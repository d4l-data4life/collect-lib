// Package guard evaluates collect-lib program step conditions (src/helper/guard.ts,
// generateStepGuard) inside a Go process. Like pkg/fhirparser there is no Go port: the
// TypeScript entry src/go/guard.ts is compiled into bundle/bundle.js by `yarn build` and run
// with goja (see pkg/internal/jsbundle), so Go services and Phoenix compute the same dates.
//
// Day, week and month offsets are calendar arithmetic in the process's local time zone
// (time.Local), as they are in the browser in the user's zone. Across a DST change, P1D can
// therefore be 23 or 25 hours.
package guard

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/d4l-data4life/collect-lib/pkg/internal/jsbundle"
)

//go:embed bundle/bundle.js
var bundleSource string

var bundle = jsbundle.MustLoad("guard/bundle.js", bundleSource)

// ErrInvalidCondition wraps errors caused by a condition the TS code can't process, e.g. an
// "and" without items. Other errors indicate a problem in this package or the bundle.
var ErrInvalidCondition = errors.New("guard: invalid step condition")

// StepCondition mirrors the TS StepCondition union (src/types/program.ts): Type says which
// other fields apply. Offset is an ISO 8601 duration (e.g. "P2D", "-PT12H"), Date a
// YYYY-MM-DD date.
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
	Items        []StepCondition `json:"items,omitzero"`
	Sorting      string          `json:"sorting,omitempty"`
	Item         *StepCondition  `json:"item,omitempty"`
}

// SurveyAnswers is one answered survey: when it was answered and its answers by link ID.
type SurveyAnswers struct {
	Date    *time.Time     `json:"date"`
	Answers map[string]any `json:"answers"` // string or []string per question
}

// Params holds what conditions refer to, keyed by survey name, consent key, routine name and
// response name. A nil time counts as not given.
type Params struct {
	MultiAnswers  map[string]SurveyAnswers `json:"multiAnswers,omitempty"`
	ConsentTimes  map[string]*time.Time    `json:"consentTimes,omitempty"`
	RoutineTimes  map[string]*time.Time    `json:"routineTimes,omitempty"`
	ResponseTimes map[string]*time.Time    `json:"responseTimes,omitempty"`
}

// FulfillmentDate returns when cond counts as fulfilled, or nil if it isn't. Unknown
// condition types are logged and never fulfilled, as in TypeScript. Safe for concurrent use.
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
