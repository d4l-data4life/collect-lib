# Derive the Default Code System from the questionnaire URL

An answer set without its own system gets a Default Code System during Generation (`<base>/<program>/CodeSystem/<questionnaire>/<linkId>`).
FHIR needs that URL spelled out, but a Canonical Definition leaves it out, so Parsing must recognise and drop it.
We decided Parsing derives the expected URL from the FHIR Questionnaire's own `url` (`…/Questionnaire/<name>` → `…/CodeSystem/<name>/<linkId>`).
We chose this over passing the environment's base URL and program name into the parser.
That keeps Parsing free of environment config.
A questionnaire generated on one host and parsed on another also loses its default systems, so regenerating it yields that host's URLs.

## Consequences

- An answer set whose explicit system happens to equal the derived default is indistinguishable from one without a system; both parse to no system.
- Changing the URL scheme for questionnaires or code systems means changing this derivation in the same release.
