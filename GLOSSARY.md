# Collect Lib

Shared library for the collect apps and research studio.
This glossary covers the FHIR questionnaire language shared between generation and parsing.

## FHIR questionnaires

**Questionnaire Definition**:
The research-pillars protobuf `Questionnaire`: the language-independent form the studio edits.
_Avoid_: proto questionnaire, internal representation

**FHIR Questionnaire**:
One FHIR R5 `Questionnaire` resource in a single language, with its value sets contained.
_Avoid_: packed questionnaire, payload

**Generation**:
Turning a Questionnaire Definition into one FHIR Questionnaire per language.
_Avoid_: export, serialization

**Parsing**:
Turning a set of FHIR Questionnaires, one per language, back into a Questionnaire Definition.
_Avoid_: import, deserialization

**Canonical Definition**:
A Questionnaire Definition in the one form Parsing produces: defaults that FHIR makes explicit are left out or normalized.
Only Canonical Definitions survive a Round Trip unchanged.

**Round Trip**:
Generation followed by Parsing (or the reverse) that yields a deep-equal result.

**Default Code System**:
The code system URL Generation assigns to an answer set that names no system of its own; it is derived from the questionnaire URL and the question's link id.
_Avoid_: default system, generated system

**Effective Code System**:
An answer set's own system if it has one, otherwise its Default Code System.

**Enable Behavior**:
Whether a dependent question is shown when all or any of its conditions hold.
Its presence on a Questionnaire Definition marks the question as dependent.

**Follow-up Question**:
A question whose link id is its parent's link id followed by `#other`.
It is shown only when the parent is answered with "other", to capture what the participant meant.
_Avoid_: other question, sub-question
