import * as fs from 'fs';
import * as path from 'path';
import { parseFHIRQuestionnaire } from '../parser';

const loadFixture = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8'));

describe('parseFHIRQuestionnaire (real research-pillars fixture)', () => {
  it("matches research-pillars' own canonical internal representation of the same questionnaire", () => {
    // questionnaire_en.json/questionnaire_de.json are a real questionnaires exported from RS Studio
    const de = loadFixture('questionnaire_de.json');
    const en = loadFixture('questionnaire_en.json');
    const expected = loadFixture('expected-questionnaire.json');

    const actual = parseFHIRQuestionnaire({ de, en });
    const actualAsJSON = JSON.parse(JSON.stringify(actual));

    expect(actualAsJSON).toStrictEqual(expected);
  });
});
