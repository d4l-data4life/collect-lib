package fhirparser_test

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"strings"
	"sync"
	"testing"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	"github.com/d4l-data4life/go-fhir/pkg/fhir5"
	pb "github.com/d4l-data4life/grpc-modules/pkg/research-pillars"

	"github.com/gesundheitscloud/collect-lib/pkg/fhirparser"
)

const repoRoot = "../.."

// The same fixture the TypeScript test uses (src/fhir/tests/questions.fixture.spec.ts),
// so this proves the goja run gives exactly what Node gives.
var fixtures = filepath.Join(repoRoot, "src/fhir/tests/fixtures")

func readFixture(t testing.TB, name string) json.RawMessage {
	t.Helper()
	b, err := os.ReadFile(filepath.Join(fixtures, name))
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func readQuestionnaire(t testing.TB, name string) fhir5.Questionnaire {
	t.Helper()
	var q fhir5.Questionnaire
	if err := json.Unmarshal(readFixture(t, name), &q); err != nil {
		t.Fatal(err)
	}
	return q
}

// The parser receives the questionnaire after a trip through fhir5.Questionnaire, so any field
// go-fhir doesn't model (e.g. an extension value[x] type) would silently never reach it. The
// fixtures use most extension types the parser reads; they must survive the trip unchanged.
func TestFhir5RoundTripIsLossless(t *testing.T) {
	for _, name := range []string{"questionnaire_en.json", "questionnaire_de.json"} {
		t.Run(name, func(t *testing.T) {
			raw := readFixture(t, name)
			q := readQuestionnaire(t, name)
			out, err := json.Marshal(q)
			if err != nil {
				t.Fatal(err)
			}
			var want, got any
			if err := json.Unmarshal(raw, &want); err != nil {
				t.Fatal(err)
			}
			if err := json.Unmarshal(out, &got); err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(got, want) {
				t.Errorf("fhir5.Questionnaire changes %s on a JSON round trip\ngot: %s", name, out)
			}
		})
	}
}

func fixtureInput(t testing.TB) map[string]fhir5.Questionnaire {
	return map[string]fhir5.Questionnaire{
		"en": readQuestionnaire(t, "questionnaire_en.json"),
		"de": readQuestionnaire(t, "questionnaire_de.json"),
	}
}

func TestParseQuestionnaires_MatchesTypeScriptFixture(t *testing.T) {
	got, err := fhirparser.ParsePackedQuestionnaire(fixtureInput(t))
	if err != nil {
		t.Fatal(err)
	}
	want := &pb.Questionnaire{}
	if err := protojson.Unmarshal(readFixture(t, "expected-questionnaire.json"), want); err != nil {
		t.Fatal(err)
	}
	if !proto.Equal(got, want) {
		t.Errorf("output differs from expected-questionnaire.json\ngot: %s", protojson.Format(got))
	}
}

func TestParseQuestionnaires_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		input   map[string]fhir5.Questionnaire
		message string
	}{
		{"no languages", map[string]fhir5.Questionnaire{}, "no languages"},
		{
			"missing name and version",
			map[string]fhir5.Questionnaire{"en": {ResourceType: "Questionnaire"}},
			"missing required fields (name, version)",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := fhirparser.ParsePackedQuestionnaire(tt.input)
			if !errors.Is(err, fhirparser.ErrInvalidQuestionnaire) {
				t.Fatalf("want ErrInvalidQuestionnaire, got %v", err)
			}
			if !strings.Contains(err.Error(), tt.message) {
				t.Errorf("error %q does not mention %q", err, tt.message)
			}
		})
	}
}

// The parser logs and skips items it can't convert (console.warn in TS). In goja that only
// works because jsbundle provides console; without it the warning itself would throw.
func TestParseQuestionnaires_SkipsUnsupportedItem(t *testing.T) {
	name, version, text := "q", "1", "Text"
	input := map[string]fhir5.Questionnaire{"en": {
		ResourceType: "Questionnaire",
		Name:         &name,
		Version:      &version,
		Item: []fhir5.QuestionnaireItem{
			{LinkId: "unsupported", Type: "attachment", Text: &text},
			{LinkId: "kept", Type: "string", Text: &text},
		},
	}}
	got, err := fhirparser.ParsePackedQuestionnaire(input)
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Questions) != 1 || got.Questions[0].LinkId != "kept" {
		t.Errorf("want only question %q, got %v", "kept", got.Questions)
	}
}

// A runtime that saw a failing call must still work afterwards (it goes back to the pool).
func TestParseQuestionnaires_RecoversAfterError(t *testing.T) {
	bad := map[string]fhir5.Questionnaire{"en": {}}
	if _, err := fhirparser.ParsePackedQuestionnaire(bad); err == nil {
		t.Fatal("want error")
	}
	if _, err := fhirparser.ParsePackedQuestionnaire(fixtureInput(t)); err != nil {
		t.Fatal(err)
	}
}

// Run with -race: runtimes are pooled and must never be shared between goroutines.
func TestParseQuestionnaires_Concurrent(t *testing.T) {
	input := fixtureInput(t)
	want, err := fhirparser.ParsePackedQuestionnaire(input)
	if err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	for range 16 {
		wg.Go(func() {
			got, err := fhirparser.ParsePackedQuestionnaire(input)
			if err != nil {
				t.Error(err)
				return
			}
			if !proto.Equal(got, want) {
				t.Error("concurrent result differs")
			}
		})
	}
	wg.Wait()
}

// The bundle is compiled against @d4l/grpc-modules from package.json and decoded into the Go
// types of github.com/d4l-data4life/grpc-modules from go.mod. Both are cut from the same
// repo and tag, so they must be the same version, or the parser may write fields the Go
// types don't know.
func TestGrpcModulesVersionsMatch(t *testing.T) {
	pkgJSON, err := os.ReadFile(filepath.Join(repoRoot, "package.json"))
	if err != nil {
		t.Fatal(err)
	}
	var pkg struct {
		Dependencies map[string]string `json:"dependencies"`
	}
	if err := json.Unmarshal(pkgJSON, &pkg); err != nil {
		t.Fatal(err)
	}
	npmVersion := pkg.Dependencies["@d4l/grpc-modules"]
	if !regexp.MustCompile(`^\d+\.\d+\.\d+$`).MatchString(npmVersion) {
		t.Fatalf("package.json must pin @d4l/grpc-modules to an exact version, got %q", npmVersion)
	}

	goMod, err := os.ReadFile(filepath.Join(repoRoot, "go.mod"))
	if err != nil {
		t.Fatal(err)
	}
	m := regexp.MustCompile(`(?m)^\s*(?:require\s+)?github\.com/d4l-data4life/grpc-modules\s+(v\S+)`).FindSubmatch(goMod)
	if m == nil {
		t.Fatal("go.mod does not require github.com/d4l-data4life/grpc-modules")
	}
	if goVersion := string(m[1]); goVersion != "v"+npmVersion {
		t.Errorf("grpc-modules versions differ: package.json %s, go.mod %s — run "+
			"`go get github.com/d4l-data4life/grpc-modules@v%s`", npmVersion, goVersion, npmVersion)
	}
}

func BenchmarkParseQuestionnaires(b *testing.B) {
	input := fixtureInput(b)
	for b.Loop() {
		if _, err := fhirparser.ParsePackedQuestionnaire(input); err != nil {
			b.Fatal(err)
		}
	}
}
