# collect-lib for Go

collect-lib is also a Go module, `github.com/gesundheitscloud/collect-lib`. Go services use the
same implementation as Phoenix and Research Studio: there is no Go port. The TypeScript is
compiled into a JavaScript bundle, embedded in a Go package, and run in-process with
[goja](https://github.com/dop251/goja), a pure-Go JavaScript interpreter (no cgo, no Node).

- [Using it](#using-it)
- [Packages](#packages)
- [How it works](#how-it-works)
- [Exporting another function to Go](#exporting-another-function-to-go)
- [Maintenance](#maintenance)
- [Limits](#limits)

## Using it

The repository is private, so Go needs to know not to use the public module proxy for it:

```sh
go env -w GOPRIVATE=github.com/gesundheitscloud/*
go get github.com/gesundheitscloud/collect-lib@latest
```

CI and Docker builds need the same `GOPRIVATE` setting and git credentials for the repository.

**Versions** are the npm release tags: `go get github.com/gesundheitscloud/collect-lib@v1.60.0`
gives exactly the code published to npm as 1.60.0. Unreleased work can be tried from any pushed
branch or commit (`go get github.com/gesundheitscloud/collect-lib@<branch>`), which resolves to
a pseudo-version.

**Go version:** the module requires Go 1.27 (see `go.mod`).

## Packages

| Package          | Wraps (TypeScript)                        | Go API                                                     |
| ---------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `pkg/fhirparser` | `parseFHIRQuestionnaire` (`src/fhir/parser`) | `ParsePackedQuestionnaire(map[string]fhir5.Questionnaire)` |

### pkg/fhirparser

Converts one FHIR R5 Questionnaire per language into the research-pillars `Questionnaire` proto.

```go
import (
	"errors"

	"github.com/d4l-data4life/go-fhir/pkg/fhir5"
	"github.com/gesundheitscloud/collect-lib/pkg/fhirparser"
)

// en, de are fhir5.Questionnaire; q is a *researchpillars.Questionnaire from grpc-modules
q, err := fhirparser.ParsePackedQuestionnaire(map[string]fhir5.Questionnaire{"en": en, "de": de})
if errors.Is(err, fhirparser.ErrInvalidQuestionnaire) {
	// the parser rejected the input (e.g. missing name or version) → a client error
}
```

- **Languages:** the questionnaires are expected to be translations of each other. Only texts
  (title, question texts, answer labels) are taken from every language. Everything else
  (name, version, which items exist and their order, types, `required`, `enableWhen`, codes)
  comes from the alphabetically first language code, because Go passes the map to the parser
  with its keys sorted. This only matters if the language versions differ.
- **Errors:** errors caused by the input wrap `ErrInvalidQuestionnaire`. Any other error
  points to a bug in collect-lib.
- **Output types:** the result is decoded strictly into the grpc-modules Go types. `go.mod`
  requires the same grpc-modules version as `package.json`, so your service always has proto
  types at least as new as the ones the parser writes.
- **Speed:** about 4 ms for the 25-question en+de fixture on an Apple M-series laptop.
- **Concurrency:** safe to call from many goroutines.

## How it works

```
src/…/*.ts ──yarn build (tsup)──▶ pkg/<package>/bundle/bundle.js ──go:embed──▶ pkg/<package>
                                    (committed IIFE, global `Exports`)          │
                                                                                ▼
                                                                    pkg/internal/jsbundle (goja)
```

1. **Bundling.** `tsup.config.ts` has a `goBundles` map (Go package → TS entry file). For each
   entry, `yarn build` writes a self-contained IIFE to `pkg/<package>/bundle/bundle.js`:
   - The output targets ES2017, the language level goja supports.
   - Its exports end up on the global `Exports`, because goja has no module system.
   - It is left unminified so changes show up readably in PR diffs.
2. **Committing.** Go modules are downloaded from git, not from a registry. A Go service only
   gets files that are committed at the tag, so the bundles have to be committed, unlike the
   ignored `dist/`. CI rebuilds them and fails if anything under `pkg/` changes.
3. **Running.** Each Go package embeds its bundle and loads it once with `jsbundle.MustLoad`.
   `pkg/internal/jsbundle` keeps a pool of goja runtimes, because one runtime can't be used from
   two goroutines at once. `Bundle.Call(fn, args...)` borrows a runtime, calls the exported
   function and returns the result as JSON. goja has no `console`, so `jsbundle` defines one
   that logs to Go's default `slog` logger; otherwise every `console.warn` in collect-lib
   would throw.
4. **Crossing the boundary as JSON.** Arguments are encoded with `encoding/json`, so `json`
   struct tags apply, and turned into plain JS objects with `JSON.parse`. The JS code sees
   exactly the data it would get in the browser. Results come back through `JSON.stringify`,
   and the Go package decodes them with `encoding/json` or `protojson`. Passing Go values to
   goja directly is avoided: goja would wrap them through reflection, with Go field names and
   wrapper objects instead of plain JS objects.
5. **Errors.** An error thrown by the JS function comes back wrapped in `jsbundle.ErrThrown`.
   Packages translate it into their own input-error sentinel, e.g.
   `fhirparser.ErrInvalidQuestionnaire`. Every other error is a bug. A runtime that panicked is
   thrown away instead of returning to the pool.

## Exporting another function to Go

### From code that is already bundled

`src/fhir/parser/index.ts` also exports `parseExtensions`, for example. Using it needs only Go:

1. Add a typed function to the existing package that calls
   `bundle.Call("parseExtensions", …)` and decodes the result.
2. Add a test (see [Tests](#tests)).

### From another part of collect-lib

Example: a `guard` package that evaluates step conditions with `src/helper/guard.ts`, so a Go
service can work out when a program step starts or ends exactly the way Phoenix does.

1. **Check the TS code works in goja.** The code, and everything it imports, ends up in the
   bundle and runs without Node or browser APIs:
   - Not available: `Intl`, `Buffer`, `TextEncoder`, `crypto`, `fetch`, `window`, timers,
     `require`. `console` is provided by `jsbundle` and logs to Go's default `slog` logger.
   - Libraries count too. `guard.ts` uses luxon, which needs `Intl` to look up the system
     locale. Setting a fixed locale avoids that (see the entry file below).
   - Check what the bundle pulls in. luxon makes up nearly all of the guard bundle's 260 KB.
2. **Write an entry file that takes and returns plain data.** Go can only call functions whose
   arguments and result survive JSON. `guard.ts` doesn't have any: `generateStepGuard` returns
   an object with methods, and `getFulfillmentDate` takes and returns `Date`s. So add a small
   wrapper that turns JSON in into guards and dates, and the result back into JSON. Go-only
   entry files go in `src/go/<package>.ts`:

   ```ts
   // src/go/guard.ts: entry for the Go package pkg/guard (see README_GO.md).
   import { Settings } from 'luxon';
   import { generateStepGuard } from '../helper/guard';
   import { Answers, StepCondition } from '../types';

   // goja has no Intl. luxon only needs it to look up the system locale, so set one.
   Settings.defaultLocale = 'en-US';

   type Times = { [key: string]: string | null };

   export type StepParams = {
     multiAnswers?: { [surveyName: string]: { date: string | null; answers: Answers } };
     consentTimes?: Times;
     routineTimes?: Times;
     responseTimes?: Times;
   };

   const toDate = (iso: string | null) => (iso === null ? null : new Date(iso));

   const mapValues = <A, B>(obj: { [key: string]: A } | undefined, f: (a: A) => B) => {
     if (!obj) return undefined;
     const out: { [key: string]: B } = {};
     for (const key of Object.keys(obj)) out[key] = f(obj[key]);
     return out;
   };

   // When the step condition counts as fulfilled (ISO 8601), or null if it isn't.
   export const stepFulfillmentDate = (cond: StepCondition, params: StepParams): string | null => {
     const date = generateStepGuard(cond).guard.getFulfillmentDate({
       multiAnswers: mapValues(params.multiAnswers, (s) => ({
         date: toDate(s.date),
         answers: s.answers,
       })),
       consentTimes: mapValues(params.consentTimes, toDate),
       routineTimes: mapValues(params.routineTimes, toDate),
       responseTimes: mapValues(params.responseTimes, toDate),
     });
     return date ? date.toISOString() : null;
   };
   ```

   The TS target is ES2017, so newer helpers like `Object.fromEntries` don't type-check here.

3. **Add the bundle** to `goBundles` in `tsup.config.ts`:
   ```ts
   const goBundles: Record<string, string> = {
     fhirparser: 'src/fhir/parser/index.ts',
     guard: 'src/go/guard.ts',
   };
   ```
   Then run `yarn build`, which creates `pkg/guard/bundle/bundle.js`.
4. **Add the Go package** `pkg/guard/guard.go`:

   ```go
   // Package guard evaluates collect-lib step conditions (src/helper/guard.ts) in Go.
   package guard

   import (
   	_ "embed"
   	"encoding/json"
   	"errors"
   	"fmt"
   	"time"

   	"github.com/gesundheitscloud/collect-lib/pkg/internal/jsbundle"
   )

   //go:embed bundle/bundle.js
   var bundleSource string

   var bundle = jsbundle.MustLoad("guard/bundle.js", bundleSource)

   var ErrInvalidCondition = errors.New("guard: invalid step condition")

   // StepCondition mirrors the TS StepCondition union: Type says which other fields apply.
   type StepCondition struct {
   	Type         string          `json:"type"`
   	Offset       string          `json:"offset,omitempty"`
   	Date         string          `json:"date,omitempty"`
   	QuestionType string          `json:"questionType,omitempty"`
   	SurveyName   string          `json:"surveyName,omitempty"`
   	LinkID       string          `json:"linkID,omitempty"`
   	Operator     string          `json:"operator,omitempty"`
   	Operand      string          `json:"operand,omitempty"`
   	RoutineName  string          `json:"routineName,omitempty"`
   	ConsentKey   string          `json:"consentKey,omitempty"`
   	ResponseName string          `json:"responseName,omitempty"`
   	Items        []StepCondition `json:"items,omitempty"`
   	Sorting      string          `json:"sorting,omitempty"`
   	Item         *StepCondition  `json:"item,omitempty"`
   }

   type SurveyAnswers struct {
   	Date    *time.Time     `json:"date"`
   	Answers map[string]any `json:"answers"` // string or []string per question
   }

   type Params struct {
   	MultiAnswers  map[string]SurveyAnswers `json:"multiAnswers,omitempty"`
   	ConsentTimes  map[string]*time.Time    `json:"consentTimes,omitempty"`
   	RoutineTimes  map[string]*time.Time    `json:"routineTimes,omitempty"`
   	ResponseTimes map[string]*time.Time    `json:"responseTimes,omitempty"`
   }

   // FulfillmentDate returns when cond counts as fulfilled, or nil if it isn't.
   func FulfillmentDate(cond StepCondition, p Params) (*time.Time, error) {
   	out, err := bundle.Call("stepFulfillmentDate", cond, p)
   	if errors.Is(err, jsbundle.ErrThrown) {
   		return nil, fmt.Errorf("%w: %w", ErrInvalidCondition, err)
   	}
   	if err != nil {
   		return nil, fmt.Errorf("guard: %w", err)
   	}
   	var date *time.Time // JSON null → nil
   	if err := json.Unmarshal(out, &date); err != nil {
   		return nil, fmt.Errorf("guard: decoding result: %w", err)
   	}
   	return date, nil
   }
   ```

   - Choose Go types whose `json` tags give exactly the JSON the TS function expects. Prefer
     existing types (go-fhir, grpc-modules, or the service's own if it already models these)
     over writing new ones.
   - `time.Time` encodes as RFC 3339, which `new Date(...)` parses, and decodes the
     `toISOString()` result. Dates cross the boundary as strings either way.
   - Decode proto results with `protojson`, everything else with `encoding/json`.
   - Keep the TS behaviour, including its gaps. An unknown condition type is logged and
     treated as never fulfilled (`nil`, no error). Only input the TS code throws on, like an
     `and` without `items`, becomes `ErrInvalidCondition`.

5. **Add tests** (see [Tests](#tests)) and a row to the [Packages](#packages) table.
6. **Commit** the entry file, `tsup.config.ts`, the generated bundle and the Go package
   together.

### Tests

Each package should prove that Go gives the same result as TypeScript. Use the fixtures the
Jest tests already check, from `src/**/fixtures`: feed the same input through the Go function
and compare with the expected output. For an example, see `TestParseQuestionnaires_MatchesTypeScriptFixture`.
If the input passes through Go types (like `fhir5.Questionnaire`), also check that the fixture
survives a JSON round trip through them unchanged (`TestFhir5RoundTripIsLossless`); otherwise
fields Go doesn't model never reach the JS code.

## Maintenance

| When you…                                  | also…                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| change TS code that a Go package bundles   | run `yarn build` and commit `pkg/*/bundle/bundle.js` (CI fails otherwise)                               |
| bump `@d4l/grpc-modules` in `package.json` | `go get github.com/d4l-data4life/grpc-modules@vX.Y.Z` with the same version (a Go test fails otherwise) |
| bump Go dependencies                       | `go get -u ./... && go mod tidy`, then `go test -race ./...`                                            |

Running the Go side locally:

```sh
NPM_AUTH_TOKEN=unused yarn build   # yarn needs the variable set; any value works for building
go vet ./...
go test -race ./...
```

`go.mod` ignores `dist/` and `node_modules/` so `./...` doesn't walk into them. Everything
committed is still part of the downloaded module (about 4 MB), but Go only compiles `pkg/`.

## Limits

- **Language level:** goja supports ES2017 and some later features, but no Node or browser
  APIs and no `Intl`. Keep exported code pure data transformation.
- **Time zone:** JS `Date` in goja uses the Go process's local time zone (`TZ`). Offsets in
  days or months therefore follow the server's zone, while in Phoenix they follow the user's.
  Across a DST change, `P1D` can be 23 or 25 hours in one and 24 in the other.
- **Speed:** goja interprets JavaScript, so expect it to be roughly 10–20× slower than Node.
  That's milliseconds for questionnaire-sized input, but it doesn't fit hot loops over large
  data.
- **Memory:** every pooled runtime holds the evaluated bundle (about 1.3 MB for `fhirparser`). The pool grows
  with the number of concurrent calls and shrinks again when the Go GC runs.
