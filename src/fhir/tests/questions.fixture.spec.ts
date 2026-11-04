import * as fs from 'fs';
import * as path from 'path';
import { fhirToQuestionnaire } from '../questions';

const loadFixture = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8'));

describe('fhirToQuestionnaire (real research-pillars fixture)', () => {
  it('matches research-pillars\' own canonical internal representation of the same questionnaire', () => {
    const de = loadFixture('questionnaire_de.json');
    const en = loadFixture('questionnaire_en.json');
    // expected-questionnaire.json was generated via research-pillars FixtureQuestionnaire(t).ToProto()
    // from internal/testutils/questionnaire_utils.go
    // Manually altered for 3 parser differences: answerset.system added,  answerset.order '' -> 'default'
    // and enableBehavior added where missing
    const expected = loadFixture('expected-questionnaire.json');
  
    const actual = fhirToQuestionnaire({ de, en });

    expect(actual).toStrictEqual(expected);
  });
});
