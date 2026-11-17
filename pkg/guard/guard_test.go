package guard_test

import (
	"encoding/json"
	"errors"
	"os"
	"reflect"
	"sync"
	"testing"
	"time"

	"github.com/gesundheitscloud/collect-lib/pkg/guard"
)

// Shared with src/go/guard.test.ts, which checks the same cases against the TypeScript.
const fixturePath = "../../src/go/fixtures/step-fulfillment.json"

type fixtureCase struct {
	Name      string          `json:"name"`
	Condition json.RawMessage `json:"condition"`
	Expected  *time.Time      `json:"expected"`
}

type fixture struct {
	Params guard.Params  `json:"params"`
	Cases  []fixtureCase `json:"cases"`
}

func readFixture(t testing.TB) fixture {
	t.Helper()
	raw, err := os.ReadFile(fixturePath)
	if err != nil {
		t.Fatal(err)
	}
	var f fixture
	if err := json.Unmarshal(raw, &f); err != nil {
		t.Fatal(err)
	}
	return f
}

func condition(t testing.TB, raw json.RawMessage) guard.StepCondition {
	t.Helper()
	var c guard.StepCondition
	if err := json.Unmarshal(raw, &c); err != nil {
		t.Fatal(err)
	}
	return c
}

func TestFulfillmentDate_MatchesTypeScriptFixture(t *testing.T) {
	f := readFixture(t)
	for _, tc := range f.Cases {
		t.Run(tc.Name, func(t *testing.T) {
			got, err := guard.FulfillmentDate(condition(t, tc.Condition), f.Params)
			if err != nil {
				t.Fatal(err)
			}
			switch {
			case tc.Expected == nil && got != nil:
				t.Errorf("got %v, want nil", got)
			case tc.Expected != nil && (got == nil || !got.Equal(*tc.Expected)):
				t.Errorf("got %v, want %v", got, tc.Expected)
			}
		})
	}
}

// StepCondition must carry every field the TS conditions use, or they never reach the JS code.
func TestStepCondition_RoundTripIsLossless(t *testing.T) {
	for _, tc := range readFixture(t).Cases {
		out, err := json.Marshal(condition(t, tc.Condition))
		if err != nil {
			t.Fatal(err)
		}
		var want, got any
		_ = json.Unmarshal(tc.Condition, &want)
		_ = json.Unmarshal(out, &got)
		if !reflect.DeepEqual(want, got) {
			t.Errorf("%s: round trip changed the condition:\n got %s\nwant %s", tc.Name, out, tc.Condition)
		}
	}
}

func TestFulfillmentDate_InvalidCondition(t *testing.T) {
	_, err := guard.FulfillmentDate(guard.StepCondition{Type: "and"}, guard.Params{})
	if !errors.Is(err, guard.ErrInvalidCondition) {
		t.Fatalf("want ErrInvalidCondition, got %v", err)
	}
}

// Day and month offsets are calendar arithmetic in the process's local time zone, as in the
// browser. This pins that behaviour: across the EU DST change, one day is 23 hours in Berlin.
func TestFulfillmentDate_UsesLocalTimeZone(t *testing.T) {
	berlin, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		t.Skip("no tzdata:", err)
	}
	consent := time.Date(2026, 3, 28, 12, 0, 0, 0, time.UTC)
	p := guard.Params{ConsentTimes: map[string]*time.Time{"c": &consent}}
	cond := guard.StepCondition{Type: "consent", ConsentKey: "c", Offset: "P1D"}

	for _, tt := range []struct {
		loc  *time.Location
		want time.Duration
	}{{time.UTC, 24 * time.Hour}, {berlin, 23 * time.Hour}} {
		prev := time.Local
		time.Local = tt.loc
		got, err := guard.FulfillmentDate(cond, p)
		time.Local = prev
		if err != nil {
			t.Fatal(err)
		}
		if d := got.Sub(consent); d != tt.want {
			t.Errorf("TZ %s: P1D added %v, want %v", tt.loc, d, tt.want)
		}
	}
}

// Run with -race: runtimes are pooled and must never be shared between goroutines.
func TestFulfillmentDate_Concurrent(t *testing.T) {
	f := readFixture(t)
	var wg sync.WaitGroup
	for i := 0; i < 32; i++ {
		tc := f.Cases[i%len(f.Cases)]
		cond := condition(t, tc.Condition)
		wg.Add(1)
		go func() {
			defer wg.Done()
			got, err := guard.FulfillmentDate(cond, f.Params)
			if err != nil {
				t.Error(err)
				return
			}
			if (got == nil) != (tc.Expected == nil) || (got != nil && !got.Equal(*tc.Expected)) {
				t.Errorf("%s: got %v, want %v", tc.Name, got, tc.Expected)
			}
		}()
	}
	wg.Wait()
}

func BenchmarkFulfillmentDate(b *testing.B) {
	f := readFixture(b)
	cond := condition(b, f.Cases[len(f.Cases)-2].Condition) // offset around nested and
	for b.Loop() {
		if _, err := guard.FulfillmentDate(cond, f.Params); err != nil {
			b.Fatal(err)
		}
	}
}
