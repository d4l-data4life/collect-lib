import {
  EnableWhen,
  InputType,
  inputTypeFromJSON,
  inputTypeToJSON,
  Question,
} from '@d4l/grpc-modules/research-pillars';
import { toFhirOperator } from '../../../helper/operator';
import { CountryValueSet, EnableWhenExpressionExtension, FhirPathLanguage } from '../../constants';
import { GenerationContext } from './context';
import { generateExtensions, itemVariableExtensions, optional } from './extensions';
import { generateValueSet } from './valuesets';

// FHIR item types of input types whose name is not a FHIR type itself.
const FHIR_TYPES: Partial<Record<InputType, fhir5.QuestionnaireItem['type']>> = {
  [InputType.single_select]: 'coding',
  [InputType.multi_select]: 'coding',
  [InputType.country]: 'coding',
  [InputType.matrix_item]: 'coding',
  [InputType.year]: 'date',
  [InputType.scale_numeric]: 'decimal',
  [InputType.scale_ordinal]: 'integer',
  [InputType.geo_location]: 'string',
  [InputType.list]: 'string',
  [InputType.postal_code]: 'string',
  [InputType.matrix]: 'group',
  [InputType.scale_likert]: 'integer',
};

const NATIVE_TYPES = new Set<InputType>([
  InputType.display,
  InputType.string,
  InputType.text,
  InputType.integer,
  InputType.decimal,
  InputType.date,
  InputType.group,
]);

const fhirTypeOf = (linkId: string, inputType: InputType): fhir5.QuestionnaireItem['type'] => {
  const fhirType = FHIR_TYPES[inputType];
  if (fhirType) {
    return fhirType;
  }
  if (NATIVE_TYPES.has(inputType)) {
    return inputTypeToJSON(inputType) as fhir5.QuestionnaireItem['type'];
  }
  throw new Error(`Question ${linkId} has an unsupported input type: ${inputTypeToJSON(inputType)}`);
};

export const generateItem = (
  q: Question,
  language: string,
  contained: fhir5.ValueSet[],
  ctx: GenerationContext,
  parentValueSet?: string
): fhir5.QuestionnaireItem => {
  const inputType = inputTypeFromJSON(q.inputType);
  const type = fhirTypeOf(q.linkId, inputType);
  const { extensions, maxLength } = generateExtensions(q, inputType, type, language, ctx);
  const text = q.text?.[language];
  if (!text) {
    throw new Error(`Question ${q.linkId} is missing its ${language} translation`);
  }

  // Matrix rows answer with their parent's value set.
  let answerValueSet = parentValueSet;
  if (inputType === InputType.country) {
    // Consumers resolve the canonical ISO-3166 value set locally; nothing is contained.
    answerValueSet = CountryValueSet;
  } else if (q.answerset) {
    answerValueSet = `#${containValueSet(generateValueSet(q.answerset, q.linkId, language, ctx), contained)}`;
  }

  // An expression dependency replaces native enableWhen; FHIR has no enableBehavior for it.
  const expression = q.enableWhenExpression;
  if (expression) {
    extensions.push(...itemVariableExtensions(q, ctx));
  }
  const nativeEnableWhen = !expression && q.enableWhen?.length > 0;
  const hasRequired = inputType !== InputType.display && inputType !== InputType.group;
  const repeats = inputType === InputType.multi_select || inputType === InputType.list;

  return {
    linkId: q.linkId,
    type,
    text,
    ...(answerValueSet && { answerValueSet }),
    ...(repeats && { repeats }),
    ...(q.code?.length > 0 && {
      code: q.code.map(({ system, code, display }) => ({
        ...optional('system', system),
        ...optional('code', code),
        ...optional('display', display),
      })),
    }),
    ...(extensions.length > 0 && { extension: extensions }),
    ...(maxLength !== undefined && { maxLength }),
    ...(hasRequired && q.required && { required: true }),
    ...(expression && {
      modifierExtension: [
        {
          url: EnableWhenExpressionExtension,
          valueExpression: { language: FhirPathLanguage, expression },
        },
      ],
    }),
    ...(nativeEnableWhen && {
      enableBehavior: q.enableBehavior === 'any' ? 'any' : 'all',
      enableWhen: q.enableWhen.map((ew) => generateEnableWhen(ew, ctx)),
    }),
    ...(type === 'group' && {
      item: (q.items ?? []).map((child) => generateItem(child, language, contained, ctx, answerValueSet)),
    }),
  };
};

/** Index of the value set in `contained`, adding it unless one with the same URL is there already. */
const containValueSet = (valueSet: fhir5.ValueSet, contained: fhir5.ValueSet[]): number => {
  const index = contained.findIndex((existing) => existing.url === valueSet.url);
  if (index >= 0) {
    return index;
  }
  contained.push({ ...valueSet, id: String(contained.length) });
  return contained.length - 1;
};

const generateEnableWhen = (ew: EnableWhen, ctx: GenerationContext): fhir5.QuestionnaireItemEnableWhen => ({
  question: ew.question,
  operator: toFhirOperator(ew.operator) ?? '=',
  ...(ew.answerCoding !== undefined && {
    answerCoding: { ...optional('code', ew.answerCoding), system: ctx.effectiveCodeSystem(ew.question) },
  }),
  ...(ew.answerDate !== undefined && { answerDate: ew.answerDate }),
  ...(ew.answerDecimal !== undefined && { answerDecimal: ew.answerDecimal }),
});
