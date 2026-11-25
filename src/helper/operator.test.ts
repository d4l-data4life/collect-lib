import { Operator, operatorToJSON } from '@d4l/grpc-modules/research-pillars';
import { toFhirOperator } from './operator';

describe('toFhirOperator', () => {
  const recognized = Object.values(Operator).filter(
    (operator): operator is Operator => typeof operator === 'number' && operator !== Operator.UNRECOGNIZED
  );

  it('maps every recognized operator', () => {
    expect(recognized.map(toFhirOperator)).toEqual(['exists', '=', '!=', '>', '<', '>=', '<=']);
  });

  it('maps every recognized operator by its JSON name', () => {
    for (const operator of recognized) {
      const name = operatorToJSON(operator) as unknown as Operator;
      expect(toFhirOperator(name)).toBe(toFhirOperator(operator));
    }
  });

  it('maps an omitted operator to exists, the proto default', () => {
    expect(toFhirOperator(undefined)).toBe('exists');
  });

  it('returns undefined for an unrecognized operator', () => {
    expect(toFhirOperator(Operator.UNRECOGNIZED)).toBeUndefined();
    expect(toFhirOperator('toString' as unknown as Operator)).toBeUndefined();
  });
});
