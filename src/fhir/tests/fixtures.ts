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

export const phq9Scoring: SurveyScoring = {
  scores: {
    valueset: {
      'http://fhir.data4life.care/r5/CodeSystem/phq-occurrence': {
        'not-at-all': 0,
        'several-days': 1,
        'more-than-half-the-days': 2,
        'nearly-every-day': 3,
      },
    },
  },
};

export const phq9Questionnaire: fhir5.Questionnaire = {
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
  contained: [
    {
      compose: {
        include: [
          {
            concept: [
              {
                code: 'not-at-all',
              },
              {
                code: 'several-days',
              },
              {
                code: 'more-than-half-the-days',
              },
              {
                code: 'nearly-every-day',
              },
            ],
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-occurrence',
          },
        ],
      },
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
      expansion: {
        contains: [
          {
            code: 'not-at-all',
            display: 'Not at all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-occurrence',
          },
          {
            code: 'several-days',
            display: 'Several Days',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-occurrence',
          },
          {
            code: 'more-than-half-the-days',
            display: 'More than half the days',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-occurrence',
          },
          {
            code: 'nearly-every-day',
            display: 'Nearly every day',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-occurrence',
          },
        ],
        identifier: 'ff69b13c-2ab0-48c4-b78b-095c131d1d8d',
        parameter: [
          {
            name: 'displayLanguage',
            valueCode: 'en',
          },
        ],
        timestamp: '2025-11-17T08:28:37Z',
      },
      id: '0',
      language: 'en',
      name: 'phq-occurrence-scale',
      publisher: 'D4L data4life gGmbH',
      resourceType: 'ValueSet',
      status: 'active',
      url: 'http://fhir.data4life.care/r5/phq/ValueSet/phq-occurrence-scale',
    },
    {
      compose: {
        include: [
          {
            concept: [
              {
                code: 'not-difficult-at-all',
              },
              {
                code: 'somewhat-difficult',
              },
              {
                code: 'very-difficult',
              },
              {
                code: 'extremely-difficult',
              },
            ],
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
        ],
      },
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
      expansion: {
        contains: [
          {
            code: 'not-difficult-at-all',
            display: 'Not difficult at all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          {
            code: 'somewhat-difficult',
            display: 'Somewhat difficult',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          {
            code: 'very-difficult',
            display: 'Very difficult',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          {
            code: 'extremely-difficult',
            display: 'Extremely difficult',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
        ],
        identifier: 'f8e94a06-290f-4d42-a5c0-6d66bfeee512',
        parameter: [
          {
            name: 'displayLanguage',
            valueCode: 'en',
          },
        ],
        timestamp: '2025-11-17T09:06:02Z',
      },
      id: '1',
      language: 'en',
      name: 'phq-difficulty-scale',
      publisher: 'D4L data4life gGmbH',
      resourceType: 'ValueSet',
      status: 'active',
      url: 'http://fhir.data4life.care/r5/phq/ValueSet/phq-difficulty-scale',
    },
  ],
  date: '2025-11-17T08:28:28Z',
  item: [
    {
      answerValueSet: '#0',
      linkId: 'interest',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nLittle interest or pleasure in doing things?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'depressed',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nFeeling down, depressed, or hopeless?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'sleeping',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nTrouble falling or staying asleep, or sleeping too much?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'tired',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nFeeling tired or having little energy?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'appetite',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nPoor appetite or overeating?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'self-doubt',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nFeeling bad about yourself - or that you are a failure or have let yourself or your family down?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'concentration',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nTrouble concentrating on things, such as reading the newspaper or watching television?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'speed',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nMoving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
      type: 'coding',
    },
    {
      answerValueSet: '#0',
      linkId: 'self-harm',
      required: true,
      text: 'Over the last 2 weeks, how often have you been bothered by:\nThoughts that you would be better off dead or of hurting yourself in some way?',
      type: 'coding',
    },
    {
      answerValueSet: '#1',
      linkId: 'difficulty',
      required: true,
      text: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
      type: 'coding',
      enableBehavior: 'any',
      enableWhen: [
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'interest',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'depressed',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'sleeping',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'tired',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'appetite',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'self-doubt',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'concentration',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'speed',
        },
        {
          answerCoding: {
            code: 'not-at-all',
            system: 'http://fhir.data4life.care/r5/CodeSystem/phq-difficulty',
          },
          operator: '!=',
          question: 'self-harm',
        },
      ],
    },
  ],
  language: 'en',
  name: 'phq-9',
  publisher: 'D4L data4life gGmbH',
  resourceType: 'Questionnaire',
  status: 'active',
  subjectType: ['Patient'],
  title: 'PHQ-9',
  url: 'http://fhir.data4life.care/r5/phq/Questionnaire/phq-9',
  version: '1.0.0',
};

export function generateContains(system: string, codes: string[]): fhir5.ValueSetExpansionContains[] {
  return codes.map((code) => ({
    system,
    code,
  }));
}
