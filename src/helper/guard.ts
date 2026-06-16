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
   * Used for questionnaire conditions (FHIR based)
   * @param answers Dictionary of question id -> answers value
   */
  evaluate(answers: Answers): boolean;
  /**
   * Evaluates if the guard is fulfilled and returns since when it counts as fulfilled.
   * Returns null if it is not fulfilled
   * Used for step conditions
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

export class AnswerCodeGuard implements Guard {
  surveyName?: string;
  questionID: string;
  operand?: string;
  operator: ConditionOperatorType;
  offset: Duration = Duration.fromObject({});

  constructor(
    questionID: string,
    operator: ConditionOperatorType,
    operand?: string,
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

/**
 * Assumption: Date answers in the questionnaire are formatted like this: YYYY-MM-DD
 * For questionnaires returns the evaluation of <answer> <operator> <operand>.
 * For steps returns the <answer>+<offset> of the answer
 */
export class AnswerDateGuard implements Guard {
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
    if (typeof answer !== 'string') {
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
      if (typeof answer === 'string') {
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
export const newStepDateGuard = (
  questionID: string,
  surveyName: string,
  offset?: string
): AnswerDateGuard => new AnswerDateGuard(questionID, 'irrelevant', 'exists', surveyName, offset);

/**
 * Assumption: Year answers in the questionnaire are formatted like this: YYYY
 */
export class YearGuard implements Guard {
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
    if (typeof answer !== 'string') {
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

export class DecimalGuard implements Guard {
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
    if (operand === undefined) {
      return false;
    }

    const answer = answers[questionID];
    if (typeof answer !== 'string') {
      return false;
    }

    const has = parseFloat(answer);
    if (isNaN(has)) {
      return false;
    }

    return evaluateOperator(has, operator, operand);
  }
  getFulfillmentDate(_params: GuardParameters): Date | null {
    return null;
  }
}

export class ExistsGuard implements Guard {
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
export class BoolGuard implements Guard {
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

export class ConsentGuard implements Guard {
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
export class SurveyGuard implements Guard {
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
export class RoutineGuard implements Guard {
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
export class ResponseGuard implements Guard {
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

/**
 * Checks if a given date has passed
 */
export class DateGuard implements Guard {
  date: Date;
  offset: Duration = Duration.fromObject({});

  constructor(date: string, offset?: string) {
    this.date = new Date(date);
    if (offset) {
      const parsedOffset = Duration.fromISO(offset);
      parsedOffset.isValid && (this.offset = parsedOffset);
    }
  }

  evaluate(_answers: Answers) {
    // stub
    return true;
  }

  getFulfillmentDate(_params: GuardParameters): Date | null {
    return DateTime.fromJSDate(this.date).plus(this.offset).toJSDate();
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
      guards.push(new ExistsGuard(condition.question));
    } else if (condition.answerDate && condition.answerDate.length === 4) {
      guards.push(new YearGuard(condition.question, condition.answerDate, condition.operator));
    } else if (condition.answerDate) {
      guards.push(
        new AnswerDateGuard(condition.question, condition.answerDate, condition.operator)
      );
    } else if (condition.answerCoding) {
      guards.push(
        new AnswerCodeGuard(condition.question, condition.operator, condition.answerCoding.code)
      );
    } else if (condition.answerDecimal !== undefined) {
      guards.push(
        new DecimalGuard(condition.question, condition.answerDecimal, condition.operator)
      );
    }
  }

  return enableBehavior === 'all' ? new Conjunction(guards) : new Disjunction(guards);
};

export const generateStepGuard = (cond: StepCondition): GuardContext => {
  if (cond.type === 'and' || cond.type === 'or') {
    // Define guard outside to add conditions and use in reduce result via reference
    const guard =
      cond.type === 'and' ? new Conjunction([], cond.sorting) : new Disjunction([], cond.sorting);
    return cond.items.reduce(
      (result, condition) => {
        const item = generateStepGuard(condition);
        guard.conditions.push(item.guard);
        return mergeContexts(result, item);
      },
      { guard } as GuardContext
    );
  }
  switch (cond.type) {
    case 'question':
      switch (cond.questionType) {
        case 'coding':
          return {
            guard: new AnswerCodeGuard(
              cond.linkID,
              cond.operator,
              cond.operand,
              cond.surveyName,
              cond.offset
            ),
            surveyNames: [cond.surveyName],
          };
        case 'date':
          return {
            guard: newStepDateGuard(cond.linkID, cond.surveyName, cond.offset),
            surveyNames: [cond.surveyName],
          };
        default:
          console.warn(`[Step Guard Generation] Unknown question condition: "${cond}"`);
          return {
            guard: new BoolGuard(false),
          };
      }
    case 'offset':
      const { guard, surveyNames, routineNames, consentKeys, responseNames } = generateStepGuard(
        cond.item
      );
      return {
        guard: new Offset(guard, cond.offset),
        surveyNames,
        routineNames,
        consentKeys,
        responseNames,
      };
    case 'consent':
      return {
        guard: new ConsentGuard(cond.consentKey, cond.offset),
        consentKeys: [cond.consentKey],
      };
    case 'survey':
      return {
        guard: new SurveyGuard(cond.surveyName, cond.offset),
        surveyNames: [cond.surveyName],
      };
    case 'routine':
      return {
        guard: new RoutineGuard(cond.routineName, cond.offset),
        routineNames: [cond.routineName],
      };
    case 'response':
      return {
        guard: new ResponseGuard(cond.responseName, cond.offset),
        responseNames: [cond.responseName],
      };
    case 'date':
      return { guard: new DateGuard(cond.date, cond.offset) };
    default:
      console.warn(`[Step Guard Generation] Unknown condition: "${cond}"`);
      return {
        guard: new BoolGuard(false),
      };
  }
};

function mergeContexts(a: GuardContext, b: GuardContext): GuardContext {
  return {
    guard: a.guard,
    surveyNames: [...new Set([...(a.surveyNames || []), ...(b.surveyNames || [])])],
    routineNames: [...new Set([...(a.routineNames || []), ...(b.routineNames || [])])],
    consentKeys: [...new Set([...(a.consentKeys || []), ...(b.consentKeys || [])])],
    responseNames: [...new Set([...(a.responseNames || []), ...(b.responseNames || [])])],
  };
}
