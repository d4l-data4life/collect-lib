import { SurveyScoring } from '../../types';

export const ociRScoring: SurveyScoring = {
  scores: {
    valueset: {
      'http://fhir.data4life.care/r5/CodeSystem/eligibility': {
        not_at_all: 0,
        a_little: 1,
        moderately: 2,
        a_lot: 3,
        extremely: 4,
      },
    },
  },
};

export const negativeScoring: SurveyScoring = {
  scores: {
    valueset: {
      'http://fhir.data4life.care/r5/CodeSystem/eligibility': {
        not_at_all: 2,
        a_little: 1,
        moderately: 0,
        a_lot: -1,
        extremely: -2,
      },
    },
  },
};

export const ociRTestQuestionnaire: fhir5.Questionnaire = {
  resourceType: 'Questionnaire',
  name: 'oci_r_eligibility',
  url: 'http://fhir.data4life.care/r5/eligibility/Questionnaire/oci_r_eligibility',
  language: 'de',
  publisher: 'D4L data4life gGmbH',
  contact: [
    {
      name: 'D4L data4life gGmbH',
      telecom: [
        {
          system: 'url',
          value: 'https://www.data4life.care',
        },
      ],
    },
  ],
  status: 'active',
  version: '1.0.0',
  title: 'OCI-R Eignungstest',
  date: '2023-09-26T12:04:30+02:00',
  subjectType: ['Patient'],
  item: [
    {
      linkId: 'saved_items',
      text: 'Ich bewahre so viele Gegenstände auf, dass sie mich behindern.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'check_things',
      text: 'Ich kontrolliere Dinge öfter als notwendig.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'arranged_objects',
      text: 'Ich werde unruhig, wenn Gegenstände nicht korrekt (an)geordnet sind.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'compelled_counting',
      text: 'Bei vielen Aktivitäten fühle ich mich zum Zählen gezwungen.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'stranger_object_touch',
      text: 'Es fällt mir schwer, einen Gegenstand anzufassen, wenn ich weiß, dass er schon von Fremden oder von bestimmten Personen berührt wurde.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'thought_control',
      text: 'Es fällt mir schwer, meine eigenen Gedanken zu kontrollieren.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'collect_unnecessary',
      text: 'Ich sammle Dinge, die ich nicht brauche.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'repeated_checks_doors',
      text: 'Ich kontrolliere wiederholt Türen, Fenster, Schubladen etc.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'changed_arrangement',
      text: 'Ich werde unruhig, wenn andere etwas daran ändern, wie ich die Dinge (an)geordnet habe.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'repeat_numbers',
      text: 'Ich fühle mich gezwungen, bestimmte Zahlen zu wiederholen.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'wash_self',
      text: 'Manchmal muss ich mich waschen oder reinigen, einfach weil ich glaube, verunreinigt oder verseucht zu sein.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'unpleasant_thoughts',
      text: 'Ich fühle mich durch unangenehme Gedanken beunruhigt, die mir gegen meinen Willen in den Sinn kommen.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'hoarding',
      text: 'Ich vermeide es, Sachen wegzuwerfen, da ich Angst habe, ich könnte sie vielleicht später noch brauchen.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'repeated_checks_utilities',
      text: 'Ich kontrolliere wiederholt Gas-/Wasserhähne und Lichtschalter, nachdem ich sie zu-/ausgemacht habe.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'particular_arrangement',
      text: 'Für mich müssen Dinge in einer bestimmten Weise geordnet sein.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'good_bad_numbers',
      text: 'Ich glaube, dass es gute und schlechte Zahlen gibt.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'hand_washing',
      text: 'Ich wasche meine Hände öfter und länger als nötig.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
    {
      linkId: 'nasty_thoughts',
      text: 'Ich bekomme häufig abscheuliche Gedanken und es fällt mir schwer, sie wieder loszuwerden.',
      type: 'coding',
      required: true,
      answerValueSet: '#0',
    },
  ],
  contained: [
    {
      resourceType: 'ValueSet',
      name: 'eligibility_scale',
      url: 'http://fhir.data4life.care/r5/eligibility/ValueSet/eligibility_scale',
      language: 'de',
      publisher: 'D4L data4life gGmbH',
      contact: [
        {
          name: 'D4L data4life gGmbH',
          telecom: [
            {
              system: 'url',
              value: 'https://www.data4life.care',
            },
          ],
        },
      ],
      status: 'active',
      id: '0',
      compose: {
        include: [
          {
            system: 'http://fhir.data4life.care/r5/CodeSystem/eligibility',
            concept: [
              {
                code: 'not_at_all',
              },
              {
                code: 'a_little',
              },
              {
                code: 'moderately',
              },
              {
                code: 'a_lot',
              },
              {
                code: 'extremely',
              },
            ],
          },
        ],
      },
      expansion: {
        identifier: '57087cc5-f17b-4dd1-94d4-e6fa3cd5df33',
        timestamp: '2023-09-26T12:04:30+02:00',
        parameter: [
          {
            name: 'displayLanguage',
            valueCode: 'de',
          },
        ],
        contains: [
          {
            system: 'http://fhir.data4life.care/r5/CodeSystem/eligibility',
            code: 'not_at_all',
            display: 'Gar nicht',
          },
          {
            system: 'http://fhir.data4life.care/r5/CodeSystem/eligibility',
            code: 'a_little',
            display: 'Wenig',
          },
          {
            system: 'http://fhir.data4life.care/r5/CodeSystem/eligibility',
            code: 'moderately',
            display: 'Mittel',
          },
          {
            system: 'http://fhir.data4life.care/r5/CodeSystem/eligibility',
            code: 'a_lot',
            display: 'Stark',
          },
          {
            system: 'http://fhir.data4life.care/r5/CodeSystem/eligibility',
            code: 'extremely',
            display: 'Sehr stark',
          },
        ],
      },
    },
  ],
};

export function generateContains(
  system: string,
  codes: string[]
): fhir5.ValueSetExpansionContains[] {
  return codes.map((code) => ({
    system,
    code,
  }));
}
