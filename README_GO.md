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

## Packages

| Package          | Wraps (TypeScript)                           | Go API                                                     |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------- |
| `pkg/fhirparser` | `parseFHIRQuestionnaire` (`src/fhir/parser`) | `ParsePackedQuestionnaire(map[string]fhir5.Questionnaire)` |
| `pkg/guard`      | `generateStepGuard` (`src/helper/guard.ts`)  | `FulfillmentDate(StepCondition, Params)`                   |

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

### pkg/guard

Works out when a program step condition (`start`, `end`, `requiredCondition`) counts as
fulfilled, the same way Phoenix does.

```go
import "github.com/gesundheitscloud/collect-lib/pkg/guard"

cond := guard.StepCondition{Type: "consent", ConsentKey: "study", Offset: "P7D"}
when, err := guard.FulfillmentDate(cond, guard.Params{
	ConsentTimes: map[string]*time.Time{"study": &consentGiven},
})
// when == nil: not fulfilled (yet)
```

- **Input:** `StepCondition` mirrors the TS `StepCondition` union, with `Type` deciding which
  fields apply. `Params` holds what the conditions refer to: survey answers with their dates,
  and consent, routine and response times.
- **Unknown condition types** are logged and treated as never fulfilled (`nil`, no error), as
  in TypeScript. Conditions the TS code can't process, like an `and` without `items`, return
  `ErrInvalidCondition`.
- **Time zone:** day, week and month offsets are calendar arithmetic in the service's local
  time zone (see [Limits](#limits)).
- **Speed:** under 1 ms per call.

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

If the function is already exported by the entry file of an existing Go package's bundle,
only Go changes:

1. Add a typed Go function to that package that calls `bundle.Call("<function>", …)` and
   decodes the result (see step 4 below).
2. Add tests (see [Tests](#tests)) and update the [Packages](#packages) table.

### As a new Go package

1. **Check that the TS code can run in goja.** The function and everything it imports end up
   in the bundle, so check all of it, including libraries:
   - No Node or browser APIs are available: no `Intl`, `Buffer`, `TextEncoder`, `crypto`,
     `fetch`, `window`, timers or `require`. `console` is provided by `jsbundle` and logs to
     Go's default `slog` logger.
   - If a library needs one of these only for something you don't use, configure it to avoid
     that path in the entry file (e.g. set a fixed locale so it never asks `Intl`).
   - Look at what the bundle pulls in. Large dependencies make every pooled runtime bigger.
2. **Write an entry file** `src/go/<package>.ts` that exports only what Go needs, with
   functions that take and return plain JSON data:
   - Go calls functions by name with JSON arguments and gets their JSON result back. Classes,
     methods, functions, `Date`, `Map` and `Set` don't survive that.
   - Where the TS code works with those, wrap it: convert the JSON input into what the code
     expects, call it, and convert the result back to JSON. Dates cross as ISO 8601 strings.
   - Keep the wrapper thin, with no logic of its own, so Go runs the same code as the apps.
   - The TS target is ES2017. Newer built-ins (e.g. `Object.fromEntries`) don't type-check.
   - If an existing entry file already exports exactly the right functions with plain-data
     signatures, use it directly instead.
3. **Register the bundle** in `goBundles` in `tsup.config.ts`, as
   `<package>: 'src/go/<package>.ts'`, and run `yarn build`. That creates
   `pkg/<package>/bundle/bundle.js`.
4. **Write the Go package** `pkg/<package>/<package>.go`:
   - Embed the bundle with `//go:embed bundle/bundle.js` and load it once in a package-level
     variable with `jsbundle.MustLoad("<package>/bundle.js", bundleSource)`.
   - Define an error sentinel for invalid input, e.g. `ErrInvalid<Thing>`.
   - Write one typed Go function per exported TS function. It calls
     `bundle.Call("<tsFunction>", args...)`, wraps `jsbundle.ErrThrown` in the sentinel,
     wraps every other error with the package name, and decodes the result.
   - Choose Go input types whose `json` encoding is exactly the JSON the TS function expects.
     Prefer existing types (go-fhir, grpc-modules) over new ones. `time.Time` works for dates.
   - Decode proto results with `protojson`, everything else with `encoding/json`. A JSON `null`
     decodes into a nil pointer.
   - Keep the TS behaviour, including its gaps.
   - Document the package: what it wraps, its errors, and anything that differs from running
     in the browser (e.g. time zone).
5. **Add tests** (see [Tests](#tests)) and a row to the [Packages](#packages) table.
6. **Commit together:** the entry file with its tests and fixture, `tsup.config.ts`, the
   generated bundle and the Go package.

`pkg/guard` follows these steps and can serve as a reference.

### Tests

Each package should prove that Go gives the same result as TypeScript, from one set of test
data:

1. **Shared fixture.** Put input and expected output in a JSON file next to the entry file,
   e.g. `src/go/fixtures/<package>.json`. A Jest test runs every case through the entry file,
   and a Go test runs the same cases through the Go function. If the TS code already has
   suitable Jest fixtures, use those instead.
2. **Round trip.** If the input passes through Go types, check that the fixture survives a JSON
   round trip through them unchanged. Otherwise fields the Go types don't model never reach
   the JS code.
3. **Errors.** Check that invalid input returns the package's error sentinel.
4. **Concurrency.** Call the function from several goroutines, and run the tests with `-race`.
5. **Time zones,** if dates are involved. Keep fixture dates away from DST changes so the
   fixture passes in every time zone. Pin time-zone behaviour in a separate Go test.

## Maintenance

| When you…                                  | also…                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| change TS code that a Go package bundles   | run `yarn build` and commit `pkg/*/bundle/bundle.js` (CI fails otherwise)                               |
| bump `@d4l/grpc-modules` in `package.json` | `go get github.com/d4l-data4life/grpc-modules@vX.Y.Z` with the same version (a Go test fails otherwise) |
| bump Go dependencies                       | `go get -u ./... && go mod tidy`, then `go test -race ./...`                                            |

Running the Go side locally:

```sh
yarn build
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
