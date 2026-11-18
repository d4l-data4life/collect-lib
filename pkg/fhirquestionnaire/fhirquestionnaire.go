// Package fhirquestionnaire converts between Questionnaire Definitions (the research-pillars
// Questionnaire proto) and FHIR R5 Questionnaires, one per language, inside a Go process.
// Generate and Parse wrap collect-lib's generateFHIRQuestionnaire and parseFHIRQuestionnaire
// (src/fhir/questionnaire). There is no Go port: the TypeScript entry
// src/go/fhirquestionnaire.ts is compiled into bundle/bundle.js by `yarn build` and executed
// with goja (see pkg/internal/jsbundle), so Go services and the JS apps share one implementation.
//
// For Canonical Definitions, Generate and Parse are exact inverses (see GLOSSARY.md and the
// Round Trip tests).
//
// The bundle is compiled against the TypeScript @d4l/grpc-modules types, and proto JSON is
// exchanged with the Go types of the same grpc-modules release. go.mod requires that release
// (a test keeps it equal to package.json), so every service importing this package has proto
// types at least as new as the ones the bundle reads and writes.
package fhirquestionnaire

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"

	"google.golang.org/protobuf/encoding/protojson"

	"github.com/d4l-data4life/go-fhir/pkg/fhir5"
	proto "github.com/d4l-data4life/grpc-modules/pkg/research-pillars"

	"github.com/d4l-data4life/collect-lib/pkg/internal/jsbundle"
)

//go:embed bundle/bundle.js
var bundleSource string

var bundle = jsbundle.MustLoad("fhirquestionnaire/bundle.js", bundleSource)

// ErrInvalidDefinition wraps every error Generation throws for its input, e.g. a missing
// translation or an unsupported input type. Other errors indicate a problem in this package or
// the bundle.
var ErrInvalidDefinition = errors.New("fhirquestionnaire: invalid questionnaire definition")

// ErrInvalidQuestionnaire wraps every error Parsing throws for its input, e.g. a missing name
// or version. Other errors indicate a problem in this package or the bundle.
var ErrInvalidQuestionnaire = errors.New("fhirquestionnaire: invalid FHIR questionnaire")

// Options holds everything Generate reads besides the Questionnaire Definition. Generation
// doesn't read the environment or the clock, so equal inputs give equal output.
type Options struct {
	BaseURL     string   `json:"baseUrl"`
	StaticURL   string   `json:"staticUrl"`
	ProgramName string   `json:"programName"`
	Languages   []string `json:"languages"`
	// Date is Questionnaire.date, a FHIR dateTime such as the definition's change date.
	Date string `json:"date"`
	// Timestamp is ValueSet.expansion.timestamp, a FHIR dateTime. It is also part of the
	// expansion identifier.
	Timestamp string `json:"timestamp"`
}

// Generate converts a Questionnaire Definition into one FHIR R5 Questionnaire per language in
// opts.Languages, keyed by language code. Errors caused by the definition (e.g. a missing
// translation or an unsupported input type) wrap ErrInvalidDefinition. Safe for concurrent use.
func Generate(definition *proto.Questionnaire, opts Options) (map[string]fhir5.Questionnaire, error) {
	encoded, err := protojson.MarshalOptions{UseEnumNumbers: true}.Marshal(definition)
	if err != nil {
		return nil, fmt.Errorf("fhirquestionnaire: encoding definition: %w", err)
	}

	out, err := bundle.Call("generateFHIRQuestionnaire", json.RawMessage(encoded), opts)
	if errors.Is(err, jsbundle.ErrThrown) {
		return nil, fmt.Errorf("%w: %w", ErrInvalidDefinition, err)
	}
	if err != nil {
		return nil, fmt.Errorf("fhirquestionnaire: %w", err)
	}

	// Strict decoding, as for Parsing: a field fhir5 doesn't model would otherwise be dropped
	// silently from what the service stores and serves.
	dec := json.NewDecoder(bytes.NewReader(out))
	dec.DisallowUnknownFields()
	var questionnaires map[string]fhir5.Questionnaire
	if err := dec.Decode(&questionnaires); err != nil {
		return nil, fmt.Errorf("fhirquestionnaire: decoding Generation output into fhir5.Questionnaire: %w", err)
	}
	return questionnaires, nil
}

// Parse converts one FHIR R5 Questionnaire per language into a Questionnaire Definition.
//
// The questionnaires are expected to be translations of each other. Only texts are taken from
// every language; everything else comes from the alphabetically first language code, because
// encoding/json passes the map with its keys sorted. Errors caused by the input wrap
// ErrInvalidQuestionnaire. Safe for concurrent use.
func Parse(byLanguage map[string]fhir5.Questionnaire) (*proto.Questionnaire, error) {
	if len(byLanguage) == 0 {
		return nil, fmt.Errorf("%w: no languages given", ErrInvalidQuestionnaire)
	}

	out, err := bundle.Call("parseFHIRQuestionnaire", byLanguage)
	if errors.Is(err, jsbundle.ErrThrown) {
		return nil, fmt.Errorf("%w: %w", ErrInvalidQuestionnaire, err)
	}
	if err != nil {
		return nil, fmt.Errorf("fhirquestionnaire: %w", err)
	}

	// Parsing emits the proto's JSON form (ts-proto field names, enums as numbers). Strict
	// decoding on purpose: an unknown field means the Go and TS grpc-modules versions diverged,
	// which the version pin should make impossible, so it must not be silently dropped.
	q := &proto.Questionnaire{}
	if err := protojson.Unmarshal(out, q); err != nil {
		return nil, fmt.Errorf("fhirquestionnaire: decoding Parsing output into proto.Questionnaire: %w", err)
	}
	return q, nil
}
