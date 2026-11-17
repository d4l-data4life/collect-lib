// Package fhirparser runs collect-lib's FHIR Questionnaire parser (src/fhir/parser,
// parseFHIRQuestionnaire) inside a Go process. There is no Go port: the TypeScript is compiled
// into bundle/bundle.js by `yarn build` and executed with goja (see pkg/internal/jsbundle), so
// Go services and the JS apps share one implementation.
//
// The parser is compiled against the TypeScript @d4l/grpc-modules types, and its output is
// decoded into the Go types of the same grpc-modules release. go.mod requires that release
// (a test keeps it equal to package.json), so every service importing this package gets
// proto types at least as new as the ones the parser writes.
package fhirparser

import (
	_ "embed"
	"errors"
	"fmt"

	"google.golang.org/protobuf/encoding/protojson"

	"github.com/d4l-data4life/go-fhir/pkg/fhir5"
	proto "github.com/d4l-data4life/grpc-modules/pkg/research-pillars"

	"github.com/d4l-data4life/collect-lib/pkg/internal/jsbundle"
)

//go:embed bundle/bundle.js
var bundleSource string

var bundle = jsbundle.MustLoad("fhirparser/bundle.js", bundleSource)

// ErrInvalidQuestionnaire wraps every error caused by the input, i.e. the parser rejected it.
// Other errors indicate a problem in this package or the bundle.
var ErrInvalidQuestionnaire = errors.New("fhirparser: invalid questionnaire")

// ParsePackedQuestionnaire converts one FHIR R5 Questionnaire into a protobuf Questionnaire
//
// The questionnaires are expected to be translations of each other. One language per map Entry.
// Errors caused by the input wrap ErrInvalidQuestionnaire. Safe for concurrent use.
func ParsePackedQuestionnaire(languageMap map[string]fhir5.Questionnaire) (*proto.Questionnaire, error) {
	if len(languageMap) == 0 {
		return nil, fmt.Errorf("%w: no languages given", ErrInvalidQuestionnaire)
	}

	// The parser reads the non-text fields from the first key. encoding/json writes map keys
	// sorted, so that is always the alphabetically first language code.
	out, err := bundle.Call("parseFHIRQuestionnaire", languageMap)
	if errors.Is(err, jsbundle.ErrThrown) {
		return nil, fmt.Errorf("%w: %w", ErrInvalidQuestionnaire, err)
	}
	if err != nil {
		return nil, fmt.Errorf("fhirparser: %w", err)
	}

	// The parser emits the proto's JSON form (ts-proto field names, enums as numbers). Strict
	// decoding on purpose: an unknown field means the Go and TS grpc-modules versions diverged,
	// which the version pin should make impossible, so it must not be silently dropped.
	q := &proto.Questionnaire{}
	if err := protojson.Unmarshal(out, q); err != nil {
		return nil, fmt.Errorf("fhirparser: decoding parser output into proto.Questionnaire: %w", err)
	}
	return q, nil
}
