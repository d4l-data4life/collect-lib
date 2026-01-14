import { v4 as uuid } from 'uuid';

/**
 * Replaces {{program-name}} and {{fhir-base-host}} templates in the given string
 */
export type StringTemplater = (template: string) => string;

export function generateUrn() {
  return `urn:uuid:${uuid()}`;
}

export function capitalizeFirstLetter(string: string): string {
  return string[0].toUpperCase() + string.slice(1);
}

export function getText<K>(content: any, path: K, lng: string): string {
  const lngPath = `${path}.${lng}`;
  const value = get(content, lngPath);
  if (value !== undefined) {
    return value;
  }

  console.warn(`[getText] Missing property: '${lngPath}'`);
  return '';
}

/**
 * Get a value at a certain path from an object
 * @param obj The object to get from
 * @param path The path to get e.g 'path.to.property'
 * @returns The value at the path or undefined
 */
export function get(obj: Record<string, any>, path: string): string | undefined {
  const value = path.split('.').reduce((o, p) => o?.[p], obj);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Create an index map out of an array
 * @param array     Any array that contains objects
 * @param keyField  The key which is used to index
 * @returns An object which contains the elements from the array indexed by _keyField_
 */
export const indexArrayBy = <T extends Record<string, any>, K extends keyof T>(
  array: T[] | undefined= [],
  keyField: K
): Record<T[K], T> =>
  array.reduce(
    (obj, item) => {
      obj[item[keyField]] = item;
      return obj;
    },
    {} as Record<T[K], T>
  );
