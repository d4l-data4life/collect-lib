import { readFileSync } from 'fs';
import { join } from 'path';
import { categoricalLabel } from '../devices/annotations/categoricalLabels';
import { categoricalLabels } from './categoricalLabels';

// Shared with pkg/categoricallabels/categoricallabels_test.go, so Go is checked against the same
// expectations.
const fixture: {
  cases: {
    name: string;
    deviceName: string;
    annotationType: string;
    column: string;
    code: number;
    expected: string | null;
  }[];
} = JSON.parse(readFileSync(join(__dirname, 'fixtures/categorical-labels.json'), 'utf8'));

describe('categoricalLabel', () => {
  it.each(fixture.cases)('$name', ({ deviceName, annotationType, column, code, expected }) => {
    expect(categoricalLabel(deviceName, annotationType, column, code) ?? null).toBe(expected);
  });
});

describe('categoricalLabels (Go entry for pkg/categoricallabels)', () => {
  it('survives the JSON boundary to Go', () => {
    const registry = categoricalLabels();
    expect(JSON.parse(JSON.stringify(registry))).toEqual(registry);
  });
});
