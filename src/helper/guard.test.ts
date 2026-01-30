import { addDays, addWeeks } from 'date-fns';
import { StepCondition } from '../types';
import {
  AnswerCodeCondition,
  BoolCondition,
  Conjunction,
  ConsentCondition,
  DateCondition,
  DecimalCondition,
  Disjunction,
  ExistsCondition,
  Guard,
  Offset,
  ResponseCondition,
  RoutineCondition,
  SurveyCondition,
  YearCondition,
  generateStepGuard,
  newStepDateCondtion,
} from './guard';

const trueCondition = new BoolCondition(true);
const falseCondition = new BoolCondition(false);
``;
const firstDate = new Date('2020-07-01T10:00:00.000+02:00');

describe('Guard', () => {
  describe('YearCondition', () => {
    const operand = '2001';
    const yearQuestion = 'year-question';

    it('can be constructed', () => {
      expect(new YearCondition(yearQuestion, operand, '!=')).toBeTruthy();
      expect(new YearCondition(yearQuestion, operand, '<')).toBeTruthy();
      expect(new YearCondition(yearQuestion, operand, '<=')).toBeTruthy();
      expect(new YearCondition(yearQuestion, operand, '=')).toBeTruthy();
      expect(new YearCondition(yearQuestion, operand, '>')).toBeTruthy();
      expect(new YearCondition(yearQuestion, operand, '>=')).toBeTruthy();
      expect(new YearCondition(yearQuestion, operand, 'exists')).toBeTruthy();
    });

    it('can be constructed with faulty values and not break', () => {
      expect(new YearCondition(yearQuestion, 9999 as unknown as string, 'exists')).toBeTruthy();
    });

    describe('evaluates', () => {
      it('with an invalid "operand" (not a year)', () => {
        const condition = new YearCondition(yearQuestion, 'not-a-year', '!=');
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with no answers', () => {
        const condition = new YearCondition(yearQuestion, operand, '!=');
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with an array of answers', () => {
        const condition = new YearCondition(yearQuestion, operand, '!=');
        expect(condition.evaluate({ [yearQuestion]: ['2001', 'not-a-year'] })).toBeFalsy();
      });

      it('with an invalid answer', () => {
        const condition = new YearCondition(yearQuestion, operand, '!=');
        expect(condition.evaluate({ [yearQuestion]: 'not-a-year' })).toBeFalsy();
      });

      it('with the "!=" operator ', () => {
        const case1 = new YearCondition(yearQuestion, operand, '!=');
        expect(case1.evaluate({ [yearQuestion]: '2002' })).toBeTruthy();
        const case2 = new YearCondition(yearQuestion, operand, '!=');
        expect(case2.evaluate({ [yearQuestion]: '2001' })).toBeFalsy();
      });

      it('with the "<" operator ', () => {
        const case1 = new YearCondition(yearQuestion, operand, '<');
        expect(case1.evaluate({ [yearQuestion]: '1999' })).toBeTruthy();
        const case2 = new YearCondition(yearQuestion, operand, '<');
        expect(case2.evaluate({ [yearQuestion]: '2001' })).toBeFalsy();
        const case3 = new YearCondition(yearQuestion, operand, '<');
        expect(case3.evaluate({ [yearQuestion]: '2002' })).toBeFalsy();
      });

      it('with the "<=" operator ', () => {
        const case1 = new YearCondition(yearQuestion, operand, '<=');
        expect(case1.evaluate({ [yearQuestion]: '1999' })).toBeTruthy();
        const case2 = new YearCondition(yearQuestion, operand, '<=');
        expect(case2.evaluate({ [yearQuestion]: '2001' })).toBeTruthy();
        const case3 = new YearCondition(yearQuestion, operand, '<=');
        expect(case3.evaluate({ [yearQuestion]: '2002' })).toBeFalsy();
      });

      it('with the "=" operator ', () => {
        const case1 = new YearCondition(yearQuestion, operand, '=');
        expect(case1.evaluate({ [yearQuestion]: '1999' })).toBeFalsy();
        const case2 = new YearCondition(yearQuestion, operand, '=');
        expect(case2.evaluate({ [yearQuestion]: '2001' })).toBeTruthy();
        const case3 = new YearCondition(yearQuestion, operand, '=');
        expect(case3.evaluate({ [yearQuestion]: '2002' })).toBeFalsy();
      });

      it('with the ">" operator ', () => {
        const case1 = new YearCondition(yearQuestion, operand, '>');
        expect(case1.evaluate({ [yearQuestion]: '1999' })).toBeFalsy();
        const case2 = new YearCondition(yearQuestion, operand, '>');
        expect(case2.evaluate({ [yearQuestion]: '2001' })).toBeFalsy();
        const case3 = new YearCondition(yearQuestion, operand, '>');
        expect(case3.evaluate({ [yearQuestion]: '2002' })).toBeTruthy();
      });

      it('with the ">=" operator ', () => {
        const case1 = new YearCondition(yearQuestion, operand, '>=');
        expect(case1.evaluate({ [yearQuestion]: '1999' })).toBeFalsy();
        const case2 = new YearCondition(yearQuestion, operand, '>=');
        expect(case2.evaluate({ [yearQuestion]: '2001' })).toBeTruthy();
        const case3 = new YearCondition(yearQuestion, operand, '>=');
        expect(case3.evaluate({ [yearQuestion]: '2002' })).toBeTruthy();
      });

      it('with the "exists" operator ', () => {
        const case1 = new YearCondition(yearQuestion, operand, 'exists');
        expect(case1.evaluate({ [yearQuestion]: '1999' })).toBeTruthy();
        const case2 = new YearCondition(yearQuestion, operand, 'exists');
        expect(case2.evaluate({})).toBeFalsy();
      });
    });
  });

  describe('DateCondition', () => {
    const operand = '2001-05-04';
    const dateQuestion = 'date-question';

    it('can be constructed', () => {
      expect(new DateCondition(dateQuestion, operand, '!=')).toBeTruthy();
      expect(new DateCondition(dateQuestion, operand, '<')).toBeTruthy();
      expect(new DateCondition(dateQuestion, operand, '<=')).toBeTruthy();
      expect(new DateCondition(dateQuestion, operand, '=')).toBeTruthy();
      expect(new DateCondition(dateQuestion, operand, '>')).toBeTruthy();
      expect(new DateCondition(dateQuestion, operand, '>=')).toBeTruthy();
      expect(new DateCondition(dateQuestion, operand, 'exists')).toBeTruthy();
    });

    it('can be constructed with faulty values and not break', () => {
      expect(new DateCondition(dateQuestion, 9999 as unknown as string, 'exists')).toBeTruthy();
    });

    describe('evaluates', () => {
      it('with an invalid "operand" (not a date)', () => {
        const condition = new DateCondition(dateQuestion, 'not-a-date', '!=');
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with no answers', () => {
        const condition = new DateCondition(dateQuestion, operand, '!=');
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with an array of answers', () => {
        const condition = new DateCondition(dateQuestion, operand, '!=');
        expect(condition.evaluate({ [dateQuestion]: ['2001-04-21', 'not-a-date'] })).toBeFalsy();
      });

      it('with an invalid answer', () => {
        const condition = new DateCondition(dateQuestion, operand, '!=');
        expect(condition.evaluate({ [dateQuestion]: 'not-a-date' })).toBeFalsy();
      });

      it('with the "!=" operator ', () => {
        const case1 = new DateCondition(dateQuestion, operand, '!=');
        expect(case1.evaluate({ [dateQuestion]: '2002-03-01' })).toBeTruthy();
        const case2 = new DateCondition(dateQuestion, operand, '!=');
        expect(case2.evaluate({ [dateQuestion]: '2001-05-04' })).toBeFalsy();
      });

      it('with the "<" operator ', () => {
        const case1 = new DateCondition(dateQuestion, operand, '<');
        expect(case1.evaluate({ [dateQuestion]: '2001-05-03' })).toBeTruthy();
        const case2 = new DateCondition(dateQuestion, operand, '<');
        expect(case2.evaluate({ [dateQuestion]: '2001-05-04' })).toBeFalsy();
        const case3 = new DateCondition(dateQuestion, operand, '<');
        expect(case3.evaluate({ [dateQuestion]: '2012-05-04' })).toBeFalsy();
      });

      it('with the "<=" operator ', () => {
        const case1 = new DateCondition(dateQuestion, operand, '<=');
        expect(case1.evaluate({ [dateQuestion]: '1990-05-04' })).toBeTruthy();
        const case2 = new DateCondition(dateQuestion, operand, '<=');
        expect(case2.evaluate({ [dateQuestion]: '2001-05-04' })).toBeTruthy();
        const case3 = new DateCondition(dateQuestion, operand, '<=');
        expect(case3.evaluate({ [dateQuestion]: '2001-05-06' })).toBeFalsy();
      });

      it('with the "=" operator ', () => {
        const case1 = new DateCondition(dateQuestion, operand, '=');
        expect(case1.evaluate({ [dateQuestion]: '2001-05-03' })).toBeFalsy();
        const case2 = new DateCondition(dateQuestion, operand, '=');
        expect(case2.evaluate({ [dateQuestion]: '2001-05-04' })).toBeTruthy();
        const case3 = new DateCondition(dateQuestion, operand, '=');
        expect(case3.evaluate({ [dateQuestion]: '2001-06-04' })).toBeFalsy();
      });

      it('with the ">" operator ', () => {
        const case1 = new DateCondition(dateQuestion, operand, '>');
        expect(case1.evaluate({ [dateQuestion]: '2001-01-03' })).toBeFalsy();
        const case2 = new DateCondition(dateQuestion, operand, '>');
        expect(case2.evaluate({ [dateQuestion]: '2001-05-04' })).toBeFalsy();
        const case3 = new DateCondition(dateQuestion, operand, '>');
        expect(case3.evaluate({ [dateQuestion]: '2099-05-04' })).toBeTruthy();
      });

      it('with the ">=" operator ', () => {
        const case1 = new DateCondition(dateQuestion, operand, '>=');
        expect(case1.evaluate({ [dateQuestion]: '2000-05-04' })).toBeFalsy();
        const case2 = new DateCondition(dateQuestion, operand, '>=');
        expect(case2.evaluate({ [dateQuestion]: '2001-05-04' })).toBeTruthy();
        const case3 = new DateCondition(dateQuestion, operand, '>=');
        expect(case3.evaluate({ [dateQuestion]: '2001-11-04' })).toBeTruthy();
      });

      it('with the "exists" operator ', () => {
        const case1 = new DateCondition(dateQuestion, operand, 'exists');
        expect(case1.evaluate({ [dateQuestion]: '1991-08-26' })).toBeTruthy();
        const case2 = new DateCondition(dateQuestion, operand, 'exists');
        expect(case2.evaluate({})).toBeFalsy();
      });
    });

    describe('getFulfillmentDate', () => {
      it('returns the answer date', () => {
        const condition = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = { survey1: { answers: { D1: '2020-07-01' }, date: null } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(new Date('2020-07-01'));
      });

      it('works with offset', () => {
        const condition = newStepDateCondtion('D1', 'survey1', 'P1M');
        const multiAnswers = { survey1: { answers: { D1: '2020-07-01' }, date: null } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(new Date('2020-08-01'));
      });

      it('works with negative offset', () => {
        const condition = newStepDateCondtion('D1', 'survey1', '-P1M');
        const multiAnswers = { survey1: { answers: { D1: '2020-07-01' }, date: null } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(new Date('2020-06-01'));
      });

      it('returns null without answer date', () => {
        const condition = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = { survey1: { answers: { D2: '2020-07-01' }, date: null } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toBeNull();
      });

      it('returns null for non date answer', () => {
        const condition = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = { survey1: { answers: { D1: 'keks' }, date: null } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toBeNull();
      });
    });
  });

  describe('AnswerCodeCondition', () => {
    const operand = 'operand';
    const answerCodingQuestion = 'answer-coding-question';

    it('can be constructed', () => {
      expect(new AnswerCodeCondition(answerCodingQuestion, operand, '!=')).toBeTruthy();
      expect(new AnswerCodeCondition(answerCodingQuestion, operand, '<')).toBeTruthy();
      expect(new AnswerCodeCondition(answerCodingQuestion, operand, '<=')).toBeTruthy();
      expect(new AnswerCodeCondition(answerCodingQuestion, operand, '=')).toBeTruthy();
      expect(new AnswerCodeCondition(answerCodingQuestion, operand, '>')).toBeTruthy();
      expect(new AnswerCodeCondition(answerCodingQuestion, operand, '>=')).toBeTruthy();
      expect(new AnswerCodeCondition(answerCodingQuestion, operand, 'exists')).toBeTruthy();
    });

    it('can be constructed with faulty values and not break', () => {
      expect(
        new AnswerCodeCondition(answerCodingQuestion, 1 as unknown as string, 'exists')
      ).toBeTruthy();
    });

    describe('evaluates', () => {
      it('with an invalid "operand" (missing code)', () => {
        const condition = new AnswerCodeCondition(
          answerCodingQuestion,
          undefined as unknown as string,
          '!='
        );
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with no answers', () => {
        const condition = new AnswerCodeCondition(answerCodingQuestion, operand, '!=');
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with an invalid answer', () => {
        const condition = new AnswerCodeCondition(answerCodingQuestion, operand, '!=');
        expect(
          condition.evaluate({ [answerCodingQuestion]: undefined as unknown as string })
        ).toBeFalsy();
      });

      describe('single-select answers', () => {
        it('with the "!=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '!=');
          expect(case1.evaluate({ [answerCodingQuestion]: 'not-expected' })).toBeTruthy();
          const case2 = new AnswerCodeCondition(answerCodingQuestion, operand, '!=');
          expect(case2.evaluate({ [answerCodingQuestion]: operand })).toBeFalsy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the "<" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '<');
          expect(case1.evaluate({ [answerCodingQuestion]: operand })).toBeFalsy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the "<=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '<=');
          expect(case1.evaluate({ [answerCodingQuestion]: operand })).toBeFalsy();
        });

        it('with the "=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '=');
          expect(case1.evaluate({ [answerCodingQuestion]: 'not-expected' })).toBeFalsy();
          const case2 = new AnswerCodeCondition(answerCodingQuestion, operand, '=');
          expect(case2.evaluate({ [answerCodingQuestion]: operand })).toBeTruthy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the ">" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '>');
          expect(case1.evaluate({ [answerCodingQuestion]: operand })).toBeFalsy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the ">=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '>=');
          expect(case1.evaluate({ [answerCodingQuestion]: operand })).toBeFalsy();
        });

        it('with the "exists" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, 'exists');
          expect(case1.evaluate({ [answerCodingQuestion]: 'whatever' })).toBeTruthy();
          const case2 = new AnswerCodeCondition(answerCodingQuestion, operand, 'exists');
          expect(case2.evaluate({})).toBeFalsy();
        });
      });

      describe('multi-select answers', () => {
        it('with the "!=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '!=');
          expect(case1.evaluate({ [answerCodingQuestion]: [operand, 'not-operand'] })).toBeFalsy();
          const case2 = new AnswerCodeCondition(answerCodingQuestion, operand, '!=');
          expect(case2.evaluate({ [answerCodingQuestion]: ['not-operand'] })).toBeTruthy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the "<" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '<');
          expect(case1.evaluate({ [answerCodingQuestion]: [operand] })).toBeFalsy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the "<=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '<=');
          expect(case1.evaluate({ [answerCodingQuestion]: [operand] })).toBeFalsy();
        });

        it('with the "=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '=');
          expect(case1.evaluate({ [answerCodingQuestion]: ['not-operand'] })).toBeFalsy();
          const case2 = new AnswerCodeCondition(answerCodingQuestion, operand, '=');
          expect(case2.evaluate({ [answerCodingQuestion]: ['not-operand', operand] })).toBeTruthy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the ">" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '>');
          expect(case1.evaluate({ [answerCodingQuestion]: [operand] })).toBeFalsy();
        });

        // Defaults to `false` because the values are not comparable using this operator
        it('with the ">=" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, '>=');
          expect(case1.evaluate({ [answerCodingQuestion]: [operand] })).toBeFalsy();
        });

        it('with the "exists" operator ', () => {
          const case1 = new AnswerCodeCondition(answerCodingQuestion, operand, 'exists');
          expect(case1.evaluate({ [answerCodingQuestion]: ['whatever'] })).toBeTruthy();
          const case2 = new AnswerCodeCondition(answerCodingQuestion, operand, 'exists');
          expect(case2.evaluate({})).toBeFalsy();
        });
      });
    });

    describe('getFulfillmentDate', () => {
      it('works for fulfilled condition', () => {
        const condition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const multiAnswers = { survey1: { answers: { Q0: 'yes' }, date: firstDate } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(firstDate);
      });

      it('works for fulfilled condition with offset', () => {
        const condition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1', 'P1W');
        const multiAnswers = { survey1: { answers: { Q0: 'yes' }, date: firstDate } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(addWeeks(firstDate, 1));
      });

      it('works for fulfilled condition with negative offset', () => {
        const condition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1', '-P2W');
        const multiAnswers = { survey1: { answers: { Q0: 'yes' }, date: firstDate } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(addWeeks(firstDate, -2));
      });

      it('works for failed condition', () => {
        const condition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const multiAnswers = { survey1: { answers: { Q0: 'no' }, date: firstDate } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toBeNull();
      });
    });
  });

  describe('DecimalCondition', () => {
    const operand = 5.5;
    const decimalQuestion = 'decimal-question';

    it('can be constructed', () => {
      expect(new DecimalCondition(decimalQuestion, operand, '!=')).toBeTruthy();
      expect(new DecimalCondition(decimalQuestion, operand, '<')).toBeTruthy();
      expect(new DecimalCondition(decimalQuestion, operand, '<=')).toBeTruthy();
      expect(new DecimalCondition(decimalQuestion, operand, '=')).toBeTruthy();
      expect(new DecimalCondition(decimalQuestion, operand, '>')).toBeTruthy();
      expect(new DecimalCondition(decimalQuestion, operand, '>=')).toBeTruthy();
      expect(new DecimalCondition(decimalQuestion, operand, 'exists')).toBeTruthy();
    });

    it('can be constructed with faulty values and not break', () => {
      expect(
        new DecimalCondition(decimalQuestion, '9999' as unknown as number, 'exists')
      ).toBeTruthy();
    });

    describe('evaluates', () => {
      it('with an invalid "operand" (not a number)', () => {
        const condition = new DecimalCondition(decimalQuestion, '9999' as unknown as number, '!=');
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with no answers', () => {
        const condition = new DecimalCondition(decimalQuestion, operand, '!=');
        expect(condition.evaluate({})).toBeFalsy();
      });

      it('with an array of answers', () => {
        const condition = new DecimalCondition(decimalQuestion, operand, '!=');
        expect(condition.evaluate({ [decimalQuestion]: ['10.3', 'not-a-number'] })).toBeFalsy();
      });

      it('with an invalid answer', () => {
        const condition = new DecimalCondition(decimalQuestion, operand, '!=');
        expect(condition.evaluate({ [decimalQuestion]: 'not-a-number' })).toBeFalsy();
      });

      it('with the "!=" operator ', () => {
        const case1 = new DecimalCondition(decimalQuestion, operand, '!=');
        expect(case1.evaluate({ [decimalQuestion]: '10.4' })).toBeTruthy();
        const case2 = new DecimalCondition(decimalQuestion, operand, '!=');
        expect(case2.evaluate({ [decimalQuestion]: '5.5' })).toBeFalsy();
      });

      it('with the "<" operator ', () => {
        const case1 = new DecimalCondition(decimalQuestion, operand, '<');
        expect(case1.evaluate({ [decimalQuestion]: '3' })).toBeTruthy();
        const case2 = new DecimalCondition(decimalQuestion, operand, '<');
        expect(case2.evaluate({ [decimalQuestion]: '5.5' })).toBeFalsy();
        const case3 = new DecimalCondition(decimalQuestion, operand, '<');
        expect(case3.evaluate({ [decimalQuestion]: '10000.3' })).toBeFalsy();
      });

      it('with the "<=" operator ', () => {
        const case1 = new DecimalCondition(decimalQuestion, operand, '<=');
        expect(case1.evaluate({ [decimalQuestion]: '3' })).toBeTruthy();
        const case2 = new DecimalCondition(decimalQuestion, operand, '<=');
        expect(case2.evaluate({ [decimalQuestion]: '5.5' })).toBeTruthy();
        const case3 = new DecimalCondition(decimalQuestion, operand, '<=');
        expect(case3.evaluate({ [decimalQuestion]: '5.500002' })).toBeFalsy();
      });

      it('with the "=" operator ', () => {
        const case1 = new DecimalCondition(decimalQuestion, operand, '=');
        expect(case1.evaluate({ [decimalQuestion]: '4.5' })).toBeFalsy();
        const case2 = new DecimalCondition(decimalQuestion, operand, '=');
        expect(case2.evaluate({ [decimalQuestion]: '5.5' })).toBeTruthy();
        const case3 = new DecimalCondition(decimalQuestion, operand, '=');
        expect(case3.evaluate({ [decimalQuestion]: '-5.5' })).toBeFalsy();
      });

      it('with the ">" operator ', () => {
        const case1 = new DecimalCondition(decimalQuestion, operand, '>');
        expect(case1.evaluate({ [decimalQuestion]: '0' })).toBeFalsy();
        const case2 = new DecimalCondition(decimalQuestion, operand, '>');
        expect(case2.evaluate({ [decimalQuestion]: '5.5' })).toBeFalsy();
        const case3 = new DecimalCondition(decimalQuestion, operand, '>');
        expect(case3.evaluate({ [decimalQuestion]: '5.50000001' })).toBeTruthy();
      });

      it('with the ">=" operator ', () => {
        const case1 = new DecimalCondition(decimalQuestion, operand, '>=');
        expect(case1.evaluate({ [decimalQuestion]: '1.420817' })).toBeFalsy();
        const case2 = new DecimalCondition(decimalQuestion, operand, '>=');
        expect(case2.evaluate({ [decimalQuestion]: '5.5' })).toBeTruthy();
        const case3 = new DecimalCondition(decimalQuestion, operand, '>=');
        expect(case3.evaluate({ [decimalQuestion]: '871.176196' })).toBeTruthy();
      });

      it('with the "exists" operator ', () => {
        const case1 = new DecimalCondition(decimalQuestion, operand, 'exists');
        expect(case1.evaluate({ [decimalQuestion]: '3.1415' })).toBeTruthy();
        const case2 = new DecimalCondition(decimalQuestion, operand, 'exists');
        expect(case2.evaluate({})).toBeFalsy();
      });
    });
  });

  describe('ExistsCondition', () => {
    const existsQuestion = 'exists-question';

    it('can be constructed', () => {
      expect(new ExistsCondition(existsQuestion)).toBeTruthy();
    });

    describe('evaluates', () => {
      it('with the "exists" operator ', () => {
        const case1 = new ExistsCondition(existsQuestion);
        expect(case1.evaluate({ [existsQuestion]: '0' })).toBeTruthy();
        expect(case1.evaluate({})).toBeFalsy();
      });
    });
  });

  describe('Conjunction', () => {
    const yearCondition = new YearCondition('year-question', '2001', '=');
    const dateCondition = new DateCondition('date-question', '2001-01-01', '<');

    it('can be constructed', () => {
      expect(new Conjunction([yearCondition, dateCondition])).toBeTruthy();
    });

    it('evaluates', () => {
      expect(new Conjunction([]).evaluate({})).toBeTruthy();

      expect(
        new Conjunction([yearCondition]).evaluate({
          'year-question': '2001',
        })
      ).toBeTruthy();

      expect(
        new Conjunction([yearCondition, dateCondition]).evaluate({
          'year-question': '2001',
          'date-question': '1990-01-01',
        })
      ).toBeTruthy();

      expect(
        new Conjunction([yearCondition, dateCondition]).evaluate({
          'year-question': '2002',
          'date-question': '1990-01-01',
        })
      ).toBeFalsy();

      expect(
        new Conjunction([yearCondition, dateCondition]).evaluate({
          'year-question': '2002',
          'date-question': '2090-01-01',
        })
      ).toBeFalsy();
    });

    describe('getFulfillmentDate', () => {
      it('works (default null)', () => {
        expect(new Conjunction([]).getFulfillmentDate({})).toBeNull();
      });

      it('works with single condition', () => {
        const condition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const multiAnswers = { survey1: { answers: { Q0: 'yes' }, date: firstDate } };
        expect(new Conjunction([condition]).getFulfillmentDate({ multiAnswers })).toEqual(
          firstDate
        );
      });

      it('works with fulfilled answer condition', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'yes', D1: '2020-09-01' }, date: firstDate },
        };
        const condition = new Conjunction([answerCondition, dateConditionA]);
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(new Date('2020-09-01'));
      });

      it('works with fulfilled answer condition when sorting for earliest', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'yes', D1: '2020-09-01' }, date: firstDate },
        };
        const condition = new Conjunction([answerCondition, dateConditionA], 'earliest');
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(firstDate);
      });

      it('works with false coding condition (returns null)', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'no', D1: '2020-09-01' }, date: firstDate },
        };
        const condition = new Conjunction([answerCondition, dateConditionA]);
        expect(condition.getFulfillmentDate({ multiAnswers })).toBeNull();
      });

      it('works with fulfilled answer condition and no date answer (returns null)', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = { survey1: { answers: { Q0: 'yes' }, date: firstDate } };
        const condition = new Conjunction([answerCondition, dateConditionA]);
        expect(condition.getFulfillmentDate({ multiAnswers })).toBeNull();
      });
    });
  });

  describe('Disjunction', () => {
    const yearCondition = new YearCondition('year-question', '2001', '=');
    const dateCondition = new DateCondition('date-question', '2001-01-01', '<');

    it('can be constructed', () => {
      expect(new Disjunction([yearCondition, dateCondition])).toBeTruthy();
    });

    it('evaluates', () => {
      expect(new Disjunction([]).evaluate({})).toBeFalsy();

      expect(
        new Disjunction([yearCondition]).evaluate({
          'year-question': '2001',
        })
      ).toBeTruthy();

      expect(
        new Disjunction([yearCondition, dateCondition]).evaluate({
          'year-question': '2001',
          'date-question': '1990-01-01',
        })
      ).toBeTruthy();

      expect(
        new Disjunction([yearCondition, dateCondition]).evaluate({
          'year-question': '2002',
          'date-question': '1990-01-01',
        })
      ).toBeTruthy();

      expect(
        new Disjunction([yearCondition, dateCondition]).evaluate({
          'year-question': '2002',
          'date-question': '2090-01-01',
        })
      ).toBeFalsy();
    });

    describe('getFulfillmentDate', () => {
      it('works (default null)', () => {
        expect(new Disjunction([]).getFulfillmentDate({})).toBeNull();
      });

      it('works with single condition', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const multiAnswers = { survey1: { answers: { Q0: 'yes' }, date: firstDate } };
        expect(new Disjunction([answerCondition]).getFulfillmentDate({ multiAnswers })).toEqual(
          firstDate
        );
      });

      it('works with fulfilled answer condition', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'yes', D1: '2020-09-01' }, date: firstDate },
        };
        const condition = new Disjunction([answerCondition, dateConditionA]);
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(firstDate);
      });

      it('works with fulfilled answer condition when sorting for latest', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'yes', D1: '2020-09-01' }, date: firstDate },
        };
        const condition = new Disjunction([answerCondition, dateConditionA], 'latest');
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(new Date('2020-09-01'));
      });

      it('works with false coding condition', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'no', D1: '2020-09-01' }, date: firstDate },
        };
        const condition = new Disjunction([answerCondition, dateConditionA]);
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(new Date('2020-09-01'));
      });

      it('works with fulfilled answer condition and no date answer', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'yes', D2: '2020-09-01' }, date: firstDate },
        };
        const condition = new Disjunction([answerCondition, dateConditionA]);
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(firstDate);
      });

      it('works with two unfulfilled conditions', () => {
        const answerCondition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const dateConditionA = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = {
          survey1: { answers: { Q0: 'no', D2: '2020-09-01' }, date: firstDate },
        };
        const condition = new Disjunction([answerCondition, dateConditionA]);
        expect(condition.getFulfillmentDate({ multiAnswers })).toBeNull();
      });
    });
  });

  describe('Offset', () => {
    it('can be constructed', () => {
      expect(new Offset(trueCondition)).toBeTruthy();
    });

    it('can be evaluated', () => {
      expect(new Offset(trueCondition).evaluate({})).toBeTruthy();
      expect(new Offset(falseCondition).evaluate({})).toBeFalsy();
    });
    describe('getFulfillmentDate', () => {
      it('works with fulfilled Answer Condition', () => {
        const condition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const multiAnswers = { survey1: { answers: { Q0: 'yes' }, date: firstDate } };
        const expectedDate = addDays(firstDate, 2);
        expect(new Offset(condition, 'P2D').getFulfillmentDate({ multiAnswers })).toEqual(
          expectedDate
        );
      });

      it('return null for unfulfilled Condition', () => {
        const condition = new AnswerCodeCondition('Q0', 'yes', '=', 'survey1');
        const multiAnswers = { survey1: { answers: { Q0: 'no' }, date: firstDate } };
        expect(new Offset(condition, 'P2D').getFulfillmentDate({ multiAnswers })).toBeNull();
      });

      it('works with DateCondition', () => {
        const condition = newStepDateCondtion('D1', 'survey1');
        const multiAnswers = { survey1: { answers: { D1: '2020-07-01' }, date: null } };
        const expectedDate = addWeeks(new Date('2020-07-01'), 2);
        expect(new Offset(condition, 'P2W').getFulfillmentDate({ multiAnswers })).toEqual(
          expectedDate
        );
      });
    });
  });

  describe('ConsentCondition', () => {
    const consentDate = new Date();

    it('can be constructed', () => {
      expect(new ConsentCondition('foo.consent')).toBeTruthy();
      expect(new ConsentCondition('foo.consent', 'P7W')).toBeTruthy();
    });

    describe('getFulfillmentDate', () => {
      it('returns null if consent was not granted', () => {
        const condition = new ConsentCondition('foo.consent');
        expect(condition.getFulfillmentDate({ consentTimes: { 'foo.consent': null } })).toBe(null);
      });

      it('returns null if different consent was granted', () => {
        const condition = new ConsentCondition('foo.consent');
        expect(condition.getFulfillmentDate({ consentTimes: { 'foo.bar': consentDate } })).toBe(
          null
        );
      });

      it('returns date of consent if offset was not given', () => {
        const condition = new ConsentCondition('foo.consent');
        expect(
          condition.getFulfillmentDate({ consentTimes: { 'foo.consent': consentDate } })
        ).toEqual(consentDate);
      });

      it('adds/subtracts offset to/from date of consent if given', () => {
        const futureCondition = new ConsentCondition('foo.consent', 'P3D');
        const expectedFutureDate = addDays(consentDate, 3);
        expect(
          futureCondition.getFulfillmentDate({ consentTimes: { 'foo.consent': consentDate } })
        ).toEqual(expectedFutureDate);

        const pastCondition = new ConsentCondition('foo.consent', '-P9W');
        const expectedPastDate = addWeeks(consentDate, -9);
        expect(
          pastCondition.getFulfillmentDate({ consentTimes: { 'foo.consent': consentDate } })
        ).toEqual(expectedPastDate);
      });
    });
  });

  describe('SurveyCondition', () => {
    it('can be constructed', () => {
      expect(new SurveyCondition('survey1')).toBeTruthy();
    });

    describe('getFulfillmentDate', () => {
      it('works for answered survey', () => {
        const condition = new SurveyCondition('survey1');
        const multiAnswers = { survey1: { answers: {}, date: firstDate } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(firstDate);
      });

      it('works for answered survey with offset', () => {
        const condition = new SurveyCondition('survey1', 'P1W');
        const multiAnswers = { survey1: { answers: {}, date: firstDate } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(addWeeks(firstDate, 1));
      });

      it('works for answered with negative offset', () => {
        const condition = new SurveyCondition('survey1', '-P2W');
        const multiAnswers = { survey1: { answers: {}, date: firstDate } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toEqual(addWeeks(firstDate, -2));
      });

      it('works for not answered survey', () => {
        const condition = new SurveyCondition('survey1');
        const multiAnswers = { survey1: { answers: {}, date: null } };
        expect(condition.getFulfillmentDate({ multiAnswers })).toBeNull();
      });
    });
  });

  describe('RoutineCondition', () => {
    const recordingDate = new Date();

    it('can be constructed', () => {
      expect(new RoutineCondition('routine1')).toBeTruthy();
      expect(new RoutineCondition('routine1', 'P7W')).toBeTruthy();
    });

    describe('getFulfillmentDate', () => {
      it('returns null if there is no recording for the routine', () => {
        const condition = new RoutineCondition('routine1');
        expect(condition.getFulfillmentDate({ routineTimes: { routine1: null } })).toBe(null);
      });

      it('returns null if there is a recording for a different routine', () => {
        const condition = new RoutineCondition('routine1');
        expect(condition.getFulfillmentDate({ routineTimes: { routine2: recordingDate } })).toBe(
          null
        );
      });

      it('returns date of recording if offset was not given', () => {
        const condition = new RoutineCondition('routine1');
        expect(condition.getFulfillmentDate({ routineTimes: { routine1: recordingDate } })).toEqual(
          recordingDate
        );
      });

      it('adds/subtracts offset to/from date of recording if given', () => {
        const futureCondition = new RoutineCondition('routine1', 'P3D');
        const expectedFutureDate = addDays(recordingDate, 3);
        expect(
          futureCondition.getFulfillmentDate({ routineTimes: { routine1: recordingDate } })
        ).toEqual(expectedFutureDate);

        const pastCondition = new RoutineCondition('routine1', '-P9W');
        const expectedPastDate = addWeeks(recordingDate, -9);
        expect(
          pastCondition.getFulfillmentDate({ routineTimes: { routine1: recordingDate } })
        ).toEqual(expectedPastDate);
      });
    });
  });

  describe('ResponseCondition', () => {
    const responseDate = new Date();

    it('can be constructed', () => {
      expect(new ResponseCondition('response1')).toBeTruthy();
      expect(new ResponseCondition('response1', 'P7W')).toBeTruthy();
    });

    describe('getFulfillmentDate', () => {
      it('returns null if there is no recording for the routine', () => {
        const condition = new ResponseCondition('response1');
        expect(condition.getFulfillmentDate({ responseTimes: { response1: null } })).toBe(null);
      });

      it('returns null if there is a recording for a different routine', () => {
        const condition = new ResponseCondition('response1');
        expect(condition.getFulfillmentDate({ responseTimes: { response2: responseDate } })).toBe(
          null
        );
      });

      it('returns date of recording if offset was not given', () => {
        const condition = new ResponseCondition('response1');
        expect(
          condition.getFulfillmentDate({ responseTimes: { response1: responseDate } })
        ).toEqual(responseDate);
      });

      it('adds/subtracts offset to/from date of recording if given', () => {
        const futureCondition = new ResponseCondition('response1', 'P3D');
        const expectedFutureDate = addDays(responseDate, 3);
        expect(
          futureCondition.getFulfillmentDate({ responseTimes: { response1: responseDate } })
        ).toEqual(expectedFutureDate);

        const pastCondition = new ResponseCondition('response1', '-P9W');
        const expectedPastDate = addWeeks(responseDate, -9);
        expect(
          pastCondition.getFulfillmentDate({ responseTimes: { response1: responseDate } })
        ).toEqual(expectedPastDate);
      });
    });
  });

  describe('generateStepGuard', () => {
    const codingCondition: StepCondition = {
      linkID: 'A1',
      surveyName: 'survey1',
      type: 'question',
      questionType: 'coding',
      operand: 'yes',
      operator: '=',
    };
    const expectedCoding: Guard = new AnswerCodeCondition('A1', 'yes', '=', 'survey1');
    const dateCondition: StepCondition = {
      linkID: 'B2',
      surveyName: 'survey2',
      type: 'question',
      questionType: 'date',
    };
    const expectedDate: Guard = newStepDateCondtion('B2', 'survey2');

    it('works for a single Coding condition', () => {
      let { guard, surveyNames } = generateStepGuard(codingCondition);
      expect(guard).toEqual(expectedCoding);
      expect(surveyNames).toEqual(['survey1']);
    });

    it('works for a date condition', () => {
      let { guard, surveyNames } = generateStepGuard(dateCondition);
      expect(guard).toEqual(expectedDate);
      expect(surveyNames).toEqual(['survey2']);
    });

    it('works for and conditions', () => {
      const andCondition: StepCondition = {
        type: 'and',
        items: [codingCondition, dateCondition],
      };
      const expected: Guard = new Conjunction([expectedCoding, expectedDate]);
      let { guard, surveyNames } = generateStepGuard(andCondition);
      expect(guard).toEqual(expected);
      expect(surveyNames).toEqual(['survey1', 'survey2']);
    });

    it('works for and conditions with sorting overwrite to earliest', () => {
      const andCondition: StepCondition = {
        type: 'and',
        items: [codingCondition, dateCondition],
        sorting: 'earliest',
      };
      const expected: Guard = new Conjunction([expectedCoding, expectedDate], 'earliest');
      let { guard, surveyNames } = generateStepGuard(andCondition);
      expect(guard).toEqual(expected);
      expect(surveyNames).toEqual(['survey1', 'survey2']);
    });

    it('works for or conditions', () => {
      const orCondition: StepCondition = {
        type: 'or',
        items: [codingCondition, dateCondition],
      };
      const expected: Guard = new Disjunction([expectedCoding, expectedDate]);
      let { guard, surveyNames } = generateStepGuard(orCondition);
      expect(guard).toEqual(expected);
      expect(surveyNames).toEqual(['survey1', 'survey2']);
    });

    it('works for or conditions with sorting overwrite to latest', () => {
      const orCondition: StepCondition = {
        type: 'or',
        items: [codingCondition, dateCondition],
        sorting: 'latest',
      };
      const expected: Guard = new Disjunction([expectedCoding, expectedDate], 'latest');
      let { guard, surveyNames } = generateStepGuard(orCondition);
      expect(guard).toEqual(expected);
      expect(surveyNames).toEqual(['survey1', 'survey2']);
    });

    it('works for offset conditions', () => {
      const offsetCondition: StepCondition = {
        type: 'offset',
        item: codingCondition,
        offset: 'P2D',
      };
      const expected: Guard = new Offset(expectedCoding, 'P2D');
      let { guard, surveyNames } = generateStepGuard(offsetCondition);
      expect(guard).toEqual(expected);
      expect(surveyNames).toEqual(['survey1']);
    });

    it('works for consent conditions', () => {
      const consentCondition: StepCondition = {
        type: 'consent',
        consentKey: 'foo.bar',
        offset: 'P5Y',
      };
      const expected: Guard = new ConsentCondition('foo.bar', 'P5Y');
      const { guard, consentKeys } = generateStepGuard(consentCondition);
      expect(guard).toEqual(expected);
      expect(consentKeys).toEqual(['foo.bar']);
    });

    it('works for survey conditions', () => {
      const surveyCondition: StepCondition = {
        type: 'survey',
        surveyName: 'survey1',
        offset: 'P5Y',
      };
      const expected: Guard = new SurveyCondition('survey1', 'P5Y');
      const { guard, surveyNames } = generateStepGuard(surveyCondition);
      expect(guard).toEqual(expected);
      expect(surveyNames).toEqual(['survey1']);
    });

    it('only returns unique survey ids', () => {
      const orCondition: StepCondition = {
        type: 'or',
        items: [codingCondition, codingCondition],
      };
      const expected: Guard = new Disjunction([expectedCoding, expectedCoding]);
      let { guard, surveyNames } = generateStepGuard(orCondition);
      expect(guard).toEqual(expected);
      expect(surveyNames).toEqual(['survey1']);
    });

    it('only returns unique consent keys', () => {
      const condition1: StepCondition = {
        type: 'consent',
        consentKey: 'foo.bar',
      };
      const condition2: StepCondition = {
        type: 'consent',
        consentKey: 'foo.bar',
      };
      const condition3: StepCondition = {
        type: 'consent',
        consentKey: 'bar.foo',
      };
      const orCondition: StepCondition = {
        type: 'or',
        items: [condition1, condition2, condition3],
      };
      let { consentKeys } = generateStepGuard(orCondition);
      expect(consentKeys).toEqual(['foo.bar', 'bar.foo']);
    });

    it('works for routine conditions', () => {
      const routineCondition: StepCondition = {
        type: 'routine',
        routineName: 'routine1',
        offset: 'P5Y',
      };
      const expected: Guard = new RoutineCondition('routine1', 'P5Y');
      const { guard, routineNames } = generateStepGuard(routineCondition);
      expect(guard).toEqual(expected);
      expect(routineNames).toEqual(['routine1']);
    });

    it('works for response conditions', () => {
      const responseCondition: StepCondition = {
        type: 'response',
        responseName: 'response1',
        offset: 'P5Y',
      };
      const expected: Guard = new ResponseCondition('response1', 'P5Y');
      const { guard, responseNames } = generateStepGuard(responseCondition);
      expect(guard).toEqual(expected);
      expect(responseNames).toEqual(['response1']);
    });
  });
});
