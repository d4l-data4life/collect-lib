package categoricallabels_test

import (
	"encoding/json"
	"os"
	"sync"
	"testing"

	"github.com/d4l-data4life/collect-lib/pkg/categoricallabels"
)

// Shared with src/go/categoricalLabels.test.ts, which checks the same cases against the TypeScript.
const fixturePath = "../../src/go/fixtures/categorical-labels.json"

type fixtureCase struct {
	Name           string  `json:"name"`
	DeviceName     string  `json:"deviceName"`
	AnnotationType string  `json:"annotationType"`
	Column         string  `json:"column"`
	Code           int64   `json:"code"`
	Expected       *string `json:"expected"`
}

func readFixture(t testing.TB) []fixtureCase {
	t.Helper()
	raw, err := os.ReadFile(fixturePath)
	if err != nil {
		t.Fatal(err)
	}
	var f struct {
		Cases []fixtureCase `json:"cases"`
	}
	if err := json.Unmarshal(raw, &f); err != nil {
		t.Fatal(err)
	}
	return f.Cases
}

func check(t *testing.T, tc fixtureCase) {
	t.Helper()
	got, ok := categoricallabels.Label(tc.DeviceName, tc.AnnotationType, tc.Column, tc.Code)
	switch {
	case tc.Expected == nil && ok:
		t.Errorf("%s: got %q, want no label", tc.Name, got)
	case tc.Expected != nil && (!ok || got != *tc.Expected):
		t.Errorf("%s: got %q (%v), want %q", tc.Name, got, ok, *tc.Expected)
	}
}

func TestLabel_MatchesTypeScriptFixture(t *testing.T) {
	for _, tc := range readFixture(t) {
		t.Run(tc.Name, func(t *testing.T) { check(t, tc) })
	}
}

func TestLabel_Concurrent(t *testing.T) {
	cases := readFixture(t)
	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() {
			for _, tc := range cases {
				check(t, tc)
			}
		})
	}
	wg.Wait()
}
