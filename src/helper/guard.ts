import { DateTime, Duration } from 'luxon';
import {
  Answers,
  ConditionOperatorType,
  ConditionSorting,
  ConsentTimes,
  MultiAnswers,
  ResponseTimes,
  RoutineTimes,
  StepCondition,
} from '../types';
import { stringToDate, stringToYear } from './datetime';

export type GuardParameters = {
  multiAnswers?: MultiAnswers;
  consentTimes?: ConsentTimes;
  routineTimes?: RoutineTimes;
  responseTimes?: ResponseTimes;
};

export type GuardContext = {
  guard: Guard;
  surveyNames?: string[];
  routineNames?: string[];
  consentKeys?: string[];
  responseNames?: string[];
};

/**
 * Checks if a given condition is fulfilled by evaluating the answers of a questionnaire response.
 */
export interface Guard {
  /**
   * Evaluates if the guard is fulfilled with the given answers
   * @param answers Dictionary of question id -> answers value
   */
  evaluate(answers: Answers): boolean;
  /**
   * Evaluates if the guard is fulfilled and returns since when it counts as fulfilled.
   * Returns null if it is not fulfilled
   * Requires surveyName to be defined to use the correct answers for evaluation.
   * @param params map of parameters to calculate fulfillment
   */
  getFulfillmentDate(params: GuardParameters): Date | null;
}

const evaluateOperator = <T>(value: T, operator: ConditionOperatorType, operand: T): boolean => {
  switch (operator) {
    case 'exists':
      return !!value;
    case '=':
      return value === operand;
    case '!=':
      return value !== operand;
    case '>':
      return value > operand;
    case '<':
      return value < operand;
    case '>=':
      return value >= operand;
    case '<=':
      return value <= operand;
    default:
      return false;
  }
};

/**
 * Assumption: Date answers in the questionnaire are formatted like this: YYYY-MM-DD
 * For questionnaires returns the evaluation of <answer> <operator> <operand>.
 * For steps returns the <answer>+<offset> of the answer
 */
export class DateCondition implements Guard {
  surveyName?: string;
  questionID: string;
  operand?: Date;
  operator: ConditionOperatorType;
  offset: Duration = Duration.fromObject({});

  constructor(
    questionID: string,
    operand: string,
    operator: ConditionOperatorType,
    surveyName?: string,
    offset?: string
  ) {
    this.surveyName = surveyName;
    this.questionID = questionID;
    this.operand = stringToDate(operand!);
    this.operator = operator;
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      if (parsedOffset.isValid) {
        this.offset = parsedOffset;
      }
    }
  }
  evaluate(answers: Answers): boolean {
    const { operand, questionID, operator } = this;
    if (!operand) {
      return false;
    }

    const answer = answers[questionID];
    if (Array.isArray(answer)) {
      return false;
    }

    const has = stringToDate(answer);
    if (!has) {
      return false;
    }

    return evaluateOperator(has.getTime(), operator, operand.getTime());
  }
  getFulfillmentDate(params: GuardParameters): Date | null {
    const { multiAnswers } = params;
    if (this.surveyName && multiAnswers !== undefined) {
      const answer = multiAnswers[this.surveyName].answers[this.questionID];
      if (answer && !Array.isArray(answer)) {
        const jsDate = new Date(answer);
        if (!isNaN(jsDate.getTime())) {
          const answerDate = DateTime.fromJSDate(jsDate).plus(this.offset);
          return answerDate.toJSDate();
        }
      }
    }
    return null;
  }
}

/**
 * Wrapper around the constructor for the creation of the stepcondition version
 * Does not need operator and operand as it just returns a given date answer
 */
export const newStepDateCondtion = (
  questionID: string,
  surveyName: string,
  offset?: string
): DateCondition => new DateCondition(questionID, 'irrelevant', 'exists', surveyName, offset);

/**
 * Assumption: Year answers in the questionnaire are formatted like this: YYYY
 */
export class YearCondition implements Guard {
  questionID: string;
  operand?: number;
  operator: ConditionOperatorType;

  constructor(questionID: string, operand: string, operator: ConditionOperatorType) {
    this.questionID = questionID;
    this.operand = stringToYear(operand!);
    this.operator = operator;
  }
  evaluate(answers: Answers): boolean {
    const { operand, questionID, operator } = this;
    if (!operand) {
      return false;
    }

    const answer = answers[questionID];
    if (Array.isArray(answer)) {
      return false;
    }

    const has = stringToYear(answer);
    if (!has) {
      return false;
    }

    return evaluateOperator(has, operator, operand);
  }
  getFulfillmentDate(_params: GuardParameters): Date | null {
    return null;
  }
}

export class AnswerCodeCondition implements Guard {
  surveyName?: string;
  questionID: string;
  operand?: string;
  operator: ConditionOperatorType;
  offset: Duration = Duration.fromObject({});

  constructor(
    questionID: string,
    operand: string,
    operator: ConditionOperatorType,
    surveyName?: string,
    offset?: string
  ) {
    this.surveyName = surveyName;
    this.questionID = questionID;
    this.operand = operand;
    this.operator = operator;
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      if (parsedOffset.isValid) {
        this.offset = parsedOffset;
      }
    }
  }
  evaluate(answers: Answers): boolean {
    const { operand, questionID, operator } = this;
    if (!operand) {
      return false;
    }

    const answer = answers[questionID];
    if (!answer) {
      return false;
    }

    if (Array.isArray(answer)) {
      switch (operator) {
        case 'exists':
          return !!answer.length;
        case '=':
          return answer.includes(operand);
        case '!=':
          return !answer.includes(operand);
        default:
          return false;
      }
    } else {
      switch (operator) {
        case 'exists':
          return !!answer;
        case '=':
          return answer === operand;
        case '!=':
          return answer !== operand;
        default:
          return false;
      }
    }
  }
  getFulfillmentDate(params: GuardParameters): Date | null {
    const { multiAnswers } = params;
    if (!this.surveyName || multiAnswers === undefined) {
      return null;
    }
    let fulfilled = this.evaluate(multiAnswers[this.surveyName].answers);
    if (!fulfilled) {
      return null;
    }
    const answerDate = DateTime.fromJSDate(multiAnswers[this.surveyName].date!).plus(this.offset);
    return answerDate.toJSDate();
  }
}

export class DecimalCondition implements Guard {
  questionID: string;
  operand?: number;
  operator: ConditionOperatorType;

  constructor(
    questionID: string,
    operand: fhir5.QuestionnaireItemEnableWhen['answerDecimal'],
    operator: ConditionOperatorType
  ) {
    this.questionID = questionID;
    this.operand = operand!;
    this.operator = operator;
  }
  evaluate(answers: Answers): boolean {
    const { operand, questionID, operator } = this;
    if (!operand) {
      return false;
    }

    const answer = answers[questionID];
    if (Array.isArray(answer)) {
      return false;
    }

    const has = parseFloat(answer);
    if (!has || isNaN(has)) {
      return false;
    }

    return evaluateOperator(has, operator, operand);
  }
  getFulfillmentDate(_params: GuardParameters): Date | null {
    return null;
  }
}

export class ExistsCondition implements Guard {
  questionID: string;

  constructor(questionID: string) {
    this.questionID = questionID;
  }
  evaluate(answers: Answers): boolean {
    const { questionID } = this;

    return !!answers[questionID];
  }
  getFulfillmentDate(_params: GuardParameters): Date | null {
    return null;
  }
}

/**
 * Checks if a condition is true or false
 */
export class BoolCondition implements Guard {
  condition: boolean;
  constructor(condition: boolean) {
    this.condition = condition;
  }
  evaluate(_answers: Answers): boolean {
    return this.condition;
  }
  getFulfillmentDate(_params: GuardParameters): Date | null {
    return this.condition ? new Date() : null;
  }
}

const sortDates = (dates: Date[], sorting: ConditionSorting) =>
  dates.sort((a, b) => {
    switch (sorting) {
      case 'earliest':
        return a.getTime() - b.getTime();
      case 'latest':
        return b.getTime() - a.getTime();
    }
  });

/**
 * Combines a set of Guards with AND
 */
export class Conjunction implements Guard {
  conditions: Guard[];
  sorting: ConditionSorting;
  constructor(conditions: Guard[], sorting: ConditionSorting = 'latest') {
    this.conditions = conditions;
    this.sorting = sorting;
  }
  evaluate(answers: Answers): boolean {
    for (const condition of this.conditions) {
      if (!condition.evaluate(answers)) {
        return false;
      }
    }
    return true;
  }
  getFulfillmentDate(params: GuardParameters): Date | null {
    let fulfillmentDates: Date[] = [];
    for (const condition of this.conditions) {
      const fulfillmentDate = condition.getFulfillmentDate(params);
      if (!fulfillmentDate) {
        return null;
      }
      fulfillmentDates.push(fulfillmentDate);
    }
    if (fulfillmentDates.length) {
      const result = sortDates(fulfillmentDates, this.sorting)[0];
      return result;
    }
    return null;
  }
}

/**
 * Combines a set of Guards with OR
 */
export class Disjunction implements Guard {
  conditions: Guard[];
  sorting: ConditionSorting;

  constructor(conditions: Guard[], sorting: ConditionSorting = 'earliest') {
    this.conditions = conditions;
    this.sorting = sorting;
  }
  evaluate(answers: Answers): boolean {
    for (const condition of this.conditions) {
      if (condition.evaluate(answers)) {
        return true;
      }
    }
    return false;
  }
  getFulfillmentDate(params: GuardParameters): Date | null {
    let fulfillmentDates: Date[] = [];
    for (const condition of this.conditions) {
      const fulfillmentDate = condition.getFulfillmentDate(params);
      if (fulfillmentDate) {
        fulfillmentDates.push(fulfillmentDate);
      }
    }
    if (fulfillmentDates.length) {
      const result = sortDates(fulfillmentDates, this.sorting)[0];
      return result;
    }
    return null;
  }
}

/**
 * Adds an offset to getFulfillmentDate of the encapsuled item.
 * No effect on evaluate.
 */
export class Offset implements Guard {
  condition: Guard;
  offset: Duration = Duration.fromObject({});
  constructor(condition: Guard, offset?: string) {
    this.condition = condition;
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      if (parsedOffset.isValid) {
        this.offset = parsedOffset;
      }
    }
  }
  evaluate(answers: Answers): boolean {
    return this.condition.evaluate(answers);
  }
  getFulfillmentDate(params: GuardParameters): Date | null {
    const fulfillmentDate = this.condition.getFulfillmentDate(params);
    if (fulfillmentDate && !isNaN(fulfillmentDate?.getTime())) {
      const answerDate = DateTime.fromJSDate(fulfillmentDate).plus(this.offset);
      return answerDate.toJSDate();
    }
    return null;
  }
}

export class ConsentCondition implements Guard {
  consentKey: string;
  offset: Duration = Duration.fromObject({});

  constructor(consentKey: string, offset?: string) {
    this.consentKey = consentKey;
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      parsedOffset.isValid && (this.offset = parsedOffset);
    }
  }

  evaluate(_answers: Answers) {
    // stub
    return true;
  }

  getFulfillmentDate(params: GuardParameters): Date | null {
    const { consentTimes } = params;
    if (!consentTimes?.[this.consentKey]) {
      return null;
    }

    return DateTime.fromJSDate(consentTimes[this.consentKey]!).plus(this.offset).toJSDate();
  }
}

/**
 * Checks if the survey was answered
 */
export class SurveyCondition implements Guard {
  surveyName: string;
  offset: Duration = Duration.fromObject({});
  constructor(surveyName: string, offset?: string) {
    this.surveyName = surveyName;
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      if (parsedOffset.isValid) {
        this.offset = parsedOffset;
      }
    }
  }
  evaluate(_answers: Answers): boolean {
    // stub
    return true;
  }
  getFulfillmentDate(params: GuardParameters): Date | null {
    const { multiAnswers } = params;
    if (!multiAnswers?.[this.surveyName]) {
      return null;
    }
    const date = multiAnswers[this.surveyName].date;
    if (!date) {
      return null;
    }
    const answerDate = DateTime.fromJSDate(date).plus(this.offset);
    if (!answerDate.isValid) {
      return null;
    }
    return answerDate.toJSDate();
  }
}

/**
 * Checks if a routine was recorded
 */
export class RoutineCondition implements Guard {
  routineName: string;
  offset: Duration = Duration.fromObject({});

  constructor(routineName: string, offset?: string) {
    this.routineName = routineName;
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      parsedOffset.isValid && (this.offset = parsedOffset);
    }
  }

  evaluate(_answers: Answers) {
    // stub
    return true;
  }

  getFulfillmentDate(params: GuardParameters): Date | null {
    const { routineTimes } = params;
    if (!routineTimes?.[this.routineName]) {
      return null;
    }

    return DateTime.fromJSDate(routineTimes[this.routineName]!).plus(this.offset).toJSDate();
  }
}

/**
 * Checks if a response of a certain name was received
 */
export class ResponseCondition implements Guard {
  responseName: string;
  offset: Duration = Duration.fromObject({});

  constructor(responseName: string, offset?: string) {
    this.responseName = responseName;
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      parsedOffset.isValid && (this.offset = parsedOffset);
    }
  }

  evaluate(_answers: Answers) {
    // stub
    return true;
  }

  getFulfillmentDate(params: GuardParameters): Date | null {
    const { responseTimes } = params;
    if (!responseTimes?.[this.responseName]) {
      return null;
    }

    return DateTime.fromJSDate(responseTimes[this.responseName]!).plus(this.offset).toJSDate();
  }
}

export const generateQuestionGuard = (
  enableWhen: fhir5.QuestionnaireItemEnableWhen[] | undefined,
  enableBehavior: fhir5.QuestionnaireItem['enableBehavior']
): Guard | undefined => {
  if (!enableWhen || !enableWhen.length || !enableBehavior) {
    return undefined;
  }

  const guards: Guard[] = [];
  for (const condition of enableWhen) {
    if (condition.operator === 'exists') {
      guards.push(new ExistsCondition(condition.question));
    } else if (condition.answerDate && condition.answerDate.length === 4) {
      guards.push(new YearCondition(condition.question, condition.answerDate, condition.operator));
    } else if (condition.answerDate) {
      guards.push(new DateCondition(condition.question, condition.answerDate, condition.operator));
    } else if (condition.answerCoding) {
      guards.push(
        new AnswerCodeCondition(
          condition.question,
          condition.answerCoding.code!,
          condition.operator
        )
      );
    } else if (condition.answerDecimal) {
      guards.push(
        new DecimalCondition(condition.question, condition.answerDecimal, condition.operator)
      );
    }
  }

  return enableBehavior === 'all' ? new Conjunction(guards) : new Disjunction(guards);
};

export const generateStepGuard = (cond: StepCondition): GuardContext => {
  const guards: Guard[] = [];
  let surveyNames: string[] = [];
  let routineNames: string[] = [];
  let consentKeys: string[] = [];
  let responseNames: string[] = [];
  if (cond.items) {
    for (const condition of cond.items) {
      const {
        guard,
        surveyNames: nestedIds,
        routineNames: nestedRoutineNames,
        consentKeys: nestedKeys,
        responseNames: nestedResponseNames,
      } = generateStepGuard(condition);
      guards.push(guard);
      surveyNames.push(...(nestedIds || []));
      routineNames.push(...(nestedRoutineNames || []));
      consentKeys.push(...(nestedKeys || []));
      responseNames.push(...(nestedResponseNames || []));
    }
    surveyNames = [...new Set(surveyNames)];
    routineNames = [...new Set(routineNames)];
    consentKeys = [...new Set(consentKeys)];
    responseNames = [...new Set(responseNames)];
  }
  switch (cond.type) {
    case 'question':
      switch (cond.questionType) {
        case 'coding':
          return {
            guard: new AnswerCodeCondition(
              cond.linkID!,
              cond.operand!,
              cond.operator!,
              cond.surveyName,
              cond.offset
            ),
            surveyNames: [cond.surveyName!],
          };
        case 'date':
          return {
            guard: newStepDateCondtion(cond.linkID!, cond.surveyName!, cond.offset),
            surveyNames: [cond.surveyName!],
          };
        default:
          console.warn(`[Step Guard Generation] Unknown question type: "${cond.questionType}"`);
          return {
            guard: new BoolCondition(false),
            surveyNames: [cond.surveyName!],
          };
      }
    case 'and':
      return {
        guard: new Conjunction(guards, cond.sorting),
        surveyNames,
        routineNames,
        consentKeys,
        responseNames,
      };
    case 'or':
      return {
        guard: new Disjunction(guards, cond.sorting),
        surveyNames,
        routineNames,
        consentKeys,
        responseNames,
      };
    case 'offset':
      const {
        guard: offsetGuard,
        surveyNames: offsetSurveyNames,
        routineNames: offsetRoutineNames,
        consentKeys: offsetConsentKeys,
        responseNames: offsetResponseNames,
      } = generateStepGuard(cond.item!);
      return {
        guard: new Offset(offsetGuard, cond.offset),
        surveyNames: [...(offsetSurveyNames || [])],
        routineNames: [...(offsetRoutineNames || [])],
        consentKeys: [...(offsetConsentKeys || [])],
        responseNames: [...(offsetResponseNames || [])],
      };
    case 'consent':
      return {
        guard: new ConsentCondition(cond.consentKey!, cond.offset),
        consentKeys: [cond.consentKey!],
      };
    case 'survey':
      return {
        guard: new SurveyCondition(cond.surveyName!, cond.offset),
        surveyNames: [cond.surveyName!],
      };
    case 'routine':
      return {
        guard: new RoutineCondition(cond.routineName!, cond.offset),
        routineNames: [cond.routineName!],
      };
    case 'response':
      return {
        guard: new ResponseCondition(cond.responseName!, cond.offset),
        responseNames: [cond.responseName!],
      };
    default:
      console.warn(`[Step Guard Generation] Unknown condition type: "${cond.type}"`);
      return {
        guard: new BoolCondition(false),
      };
  }
};
