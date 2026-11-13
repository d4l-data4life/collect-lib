package jsbundle_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"sync"
	"testing"

	"github.com/gesundheitscloud/collect-lib/pkg/internal/jsbundle"
)

// Shaped like the IIFE bundles tsup emits for the Go packages.
const testBundle = `"use strict";
var Exports = (() => ({
  echo: (v) => v,
  greet: (p) => ({ greeting: "Hello " + p.name, keys: Object.keys(p) }),
  add: (a, b) => a + b,
  fail: (msg) => { throw new Error(msg); },
  nothing: () => undefined,
  warn: (msg) => { console.warn("careful:", msg, 42); return "done"; },
}))();`

var bundle = jsbundle.MustLoad("test.js", testBundle)

type person struct {
	Name  string  `json:"name"`
	Email *string `json:"email,omitempty"`
}

func TestCall_ArgumentsArePlainJSONObjects(t *testing.T) {
	// json tags apply and omitted fields are absent, as in the browser.
	got, err := bundle.Call("greet", person{Name: "Ada"})
	if err != nil {
		t.Fatal(err)
	}
	if want := `{"greeting":"Hello Ada","keys":["name"]}`; string(got) != want {
		t.Errorf("got %s, want %s", got, want)
	}
}

func TestCall_MultipleArguments(t *testing.T) {
	got, err := bundle.Call("add", 2, 3)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "5" {
		t.Errorf("got %s, want 5", got)
	}
}

func TestCall_RoundTripsJSON(t *testing.T) {
	in := json.RawMessage(`{"a":[1,"two",null,{"b":true}]}`)
	got, err := bundle.Call("echo", in)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != string(in) {
		t.Errorf("got %s, want %s", got, in)
	}
}

func TestCall_UndefinedResultIsNil(t *testing.T) {
	got, err := bundle.Call("nothing")
	if err != nil || got != nil {
		t.Errorf("got %q, %v; want nil, nil", got, err)
	}
}

func TestCall_Thrown(t *testing.T) {
	_, err := bundle.Call("fail", "bad input")
	if !errors.Is(err, jsbundle.ErrThrown) {
		t.Fatalf("want ErrThrown, got %v", err)
	}
	if !strings.Contains(err.Error(), "Error: bad input") {
		t.Errorf("error %q lacks the thrown message", err)
	}
	// The runtime is still usable afterwards.
	if _, err := bundle.Call("add", 1, 1); err != nil {
		t.Fatal(err)
	}
}

func TestCall_UnknownFunction(t *testing.T) {
	_, err := bundle.Call("missing")
	if err == nil || errors.Is(err, jsbundle.ErrThrown) {
		t.Fatalf("want a non-ErrThrown error, got %v", err)
	}
}

func TestCall_UnencodableArgument(t *testing.T) {
	_, err := bundle.Call("echo", make(chan int))
	if err == nil || errors.Is(err, jsbundle.ErrThrown) {
		t.Fatalf("want a non-ErrThrown error, got %v", err)
	}
}

func TestLoad_Errors(t *testing.T) {
	for name, src := range map[string]string{
		"syntax error":  `var Exports = (`,
		"throws":        `throw new Error("boom")`,
		"no global":     `var Other = {}`,
		"not an object": `var Exports = 42`,
	} {
		t.Run(name, func(t *testing.T) {
			if _, err := jsbundle.Load("broken.js", src); err == nil {
				t.Fatal("want error")
			}
		})
	}
}

// Run with -race: runtimes are pooled and must never be shared between goroutines.
func TestCall_Concurrent(t *testing.T) {
	var wg sync.WaitGroup
	for i := range 32 {
		wg.Go(func() {
			got, err := bundle.Call("add", i, 1)
			if err != nil {
				t.Error(err)
				return
			}
			var n int
			if err := json.Unmarshal(got, &n); err != nil || n != i+1 {
				t.Errorf("add(%d, 1) = %s", i, got)
			}
		})
	}
	wg.Wait()
}

func TestCall_ConsoleLogsToSlog(t *testing.T) {
	// goja has no console of its own; without the shim this call would throw a ReferenceError.
	var buf bytes.Buffer
	prev := slog.Default()
	slog.SetDefault(slog.New(slog.NewTextHandler(&buf, nil)))
	t.Cleanup(func() { slog.SetDefault(prev) })

	got, err := bundle.Call("warn", "x")
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != `"done"` {
		t.Errorf("got %s, want \"done\"", got)
	}
	if log := buf.String(); !strings.Contains(log, `level=WARN msg="careful: x 42" bundle=test.js`) {
		t.Errorf("unexpected log output: %q", log)
	}
}
