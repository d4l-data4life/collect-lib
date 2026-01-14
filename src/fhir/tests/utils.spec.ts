import { indexArrayBy } from "../utils";

describe('indexArrayBy', () => {
  it('works with strings', () => {
    type A = { id: string; value: number };
    const array: A[] = [
        {id: 'a', value: 1},
        {id: 'b', value: 2},
        {id: 'c', value: 3},
    ]
    const expected = {
        a: {id: 'a', value: 1},
        b: {id: 'b', value: 2},
        c: {id: 'c', value: 3},
    }

    const result = indexArrayBy(array, 'id');

    expect(result).toEqual(expected);
  });

  it('works with numbers', () => {
    type A = { id: string; value: number };
    const array: A[] = [
        {id: 'a', value: 1},
        {id: 'b', value: 2},
        {id: 'c', value: 3},
    ]
    const expected = {
        1: {id: 'a', value: 1},
        2: {id: 'b', value: 2},
        3: {id: 'c', value: 3},
    }

    const result = indexArrayBy(array, 'value');

    expect(result).toEqual(expected);
  });

  it('catches undefined', () => {
    const expected = {}

    const result = indexArrayBy(undefined, 'value');

    expect(result).toEqual(expected);
  });
});
