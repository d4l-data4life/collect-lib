// Package jsbundle runs functions from a collect-lib JS bundle inside the Go process with goja.
// It is the shared plumbing behind every Go package in this module: each package embeds its
// bundle (built by `yarn build`, see tsup.config.ts), loads it once with MustLoad, and exposes
// typed Go functions that delegate to Bundle.Call.
//
// Values cross the Go/JS boundary as JSON in both directions: arguments are encoded with
// encoding/json (so `json` struct tags apply) and parsed into plain JS objects, and results
// come back as JSON.stringify output. That way the JS code sees exactly the data it would
// get in the browser, and callers decode results with encoding/json or protojson.
package jsbundle

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/d4l-data4life/go-svc/pkg/logging"
	"github.com/dop251/goja"
)

// GlobalName is the global variable a bundle exposes its exports on. It must match
// `globalName` in the Go bundle config in tsup.config.ts.
const GlobalName = "Exports"

// ErrThrown wraps errors thrown by the JS function itself (e.g. input validation in the
// parser). Packages typically translate it into their own input-error sentinel. Any other
// error from Call indicates a bug in the bundle or in this package.
var ErrThrown = errors.New("JS function threw")

// Bundle is a loaded JS bundle. It is safe for concurrent use: goja runtimes are not, so each
// Call borrows a runtime from a pool.
type Bundle struct {
	name    string
	program *goja.Program
	pool    sync.Pool
}

// runtime is one goja VM with the bundle evaluated and the helpers Call needs resolved.
type runtime struct {
	vm        *goja.Runtime
	exports   *goja.Object
	parse     goja.Callable
	stringify goja.Callable
	fns       map[string]goja.Callable
}

// MustLoad compiles and evaluates the bundle once and panics if that fails. Call it in a
// package-level var: a broken bundle is a build defect, caught by the package's tests.
// name is only used in error messages.
func MustLoad(name, source string) *Bundle {
	b, err := Load(name, source)
	if err != nil {
		panic(err)
	}
	return b
}

// Load is MustLoad returning the error instead of panicking.
func Load(name, source string) (*Bundle, error) {
	prg, err := goja.Compile(name, source, true)
	if err != nil {
		return nil, fmt.Errorf("jsbundle: compiling %s: %w", name, err)
	}
	b := &Bundle{name: name, program: prg}
	// Evaluate once up front, so a bundle that compiles but fails to run is reported here
	// rather than on the first call. The runtime is kept for that first call.
	rt, err := b.newRuntime()
	if err != nil {
		return nil, err
	}
	b.pool.Put(rt)
	return b, nil
}

func (b *Bundle) newRuntime() (*runtime, error) {
	vm := goja.New()
	b.installConsole(vm)
	if _, err := vm.RunProgram(b.program); err != nil {
		return nil, fmt.Errorf("jsbundle: evaluating %s: %w", b.name, err)
	}
	exports, ok := vm.Get(GlobalName).(*goja.Object)
	if !ok {
		return nil, fmt.Errorf("jsbundle: %s defines no %s global object", b.name, GlobalName)
	}
	jsonObj := vm.Get("JSON").ToObject(vm)
	parse, _ := goja.AssertFunction(jsonObj.Get("parse"))
	stringify, _ := goja.AssertFunction(jsonObj.Get("stringify"))
	return &runtime{
		vm: vm, exports: exports, parse: parse, stringify: stringify,
		fns: map[string]goja.Callable{},
	}, nil
}

// installConsole defines the global console, which goja doesn't provide. Without it, every
// console.warn in collect-lib (e.g. the parser skipping an unsupported item) would throw a
// ReferenceError instead of logging. Messages go to go-svc's logging singleton, so they come
// out in the same format as the calling service's own logs, prefixed with the bundle name.
// console.debug logs only when the service enabled go-svc's debug logging.
func (b *Bundle) installConsole(vm *goja.Runtime) {
	console := vm.NewObject()
	// The message is always an argument, never the format string: JS text may contain '%'.
	for name, log := range map[string]func(msg string){
		"debug": func(msg string) { logging.LogDebugf("%s", msg) },
		"log":   func(msg string) { logging.LogInfof("%s", msg) },
		"info":  func(msg string) { logging.LogInfof("%s", msg) },
		"warn":  func(msg string) { logging.LogWarningf(nil, "%s", msg) },
		"error": func(msg string) { logging.LogErrorf(nil, "%s", msg) },
	} {
		_ = console.Set(name, func(call goja.FunctionCall) goja.Value {
			parts := make([]string, len(call.Arguments))
			for i, arg := range call.Arguments {
				parts[i] = arg.String()
			}
			log(b.name + ": " + strings.Join(parts, " "))
			return goja.Undefined()
		})
	}
	_ = vm.Set("console", console)
}

func (b *Bundle) get() (*runtime, error) {
	if rt, ok := b.pool.Get().(*runtime); ok {
		return rt, nil
	}
	return b.newRuntime()
}

// Call invokes the exported function fn with args and returns its result as JSON
// (JSON.stringify of the return value; "undefined" results come back as nil).
// Each arg is passed through json.Marshal and JSON.parse, so it arrives as a plain JS value.
func (b *Bundle) Call(fn string, args ...any) (result json.RawMessage, err error) {
	rt, err := b.get()
	if err != nil {
		return nil, err
	}
	defer func() {
		// A runtime that panicked may be in any state, so it is dropped instead of reused.
		if r := recover(); r != nil {
			err = fmt.Errorf("jsbundle: panic in %s.%s: %v", b.name, fn, r)
			return
		}
		b.pool.Put(rt)
	}()

	f, err := rt.function(fn)
	if err != nil {
		return nil, fmt.Errorf("jsbundle: %s: %w", b.name, err)
	}

	jsArgs := make([]goja.Value, len(args))
	for i, a := range args {
		encoded, err := json.Marshal(a)
		if err != nil {
			return nil, fmt.Errorf("jsbundle: encoding argument %d of %s: %w", i, fn, err)
		}
		if jsArgs[i], err = rt.parse(goja.Undefined(), rt.vm.ToValue(string(encoded))); err != nil {
			return nil, fmt.Errorf("jsbundle: parsing argument %d of %s: %w", i, fn, err)
		}
	}

	ret, err := f(goja.Undefined(), jsArgs...)
	if err != nil {
		var exc *goja.Exception
		if errors.As(err, &exc) {
			// The thrown value's string form, e.g. "Error: message", without goja's stack.
			return nil, fmt.Errorf("%s: %w: %s", fn, ErrThrown, exc.Value().String())
		}
		return nil, fmt.Errorf("jsbundle: calling %s: %w", fn, err)
	}

	str, err := rt.stringify(goja.Undefined(), ret)
	if err != nil {
		return nil, fmt.Errorf("jsbundle: serialising result of %s: %w", fn, err)
	}
	if goja.IsUndefined(str) {
		return nil, nil
	}
	return json.RawMessage(str.String()), nil
}

func (rt *runtime) function(name string) (goja.Callable, error) {
	if f, ok := rt.fns[name]; ok {
		return f, nil
	}
	f, ok := goja.AssertFunction(rt.exports.Get(name))
	if !ok {
		return nil, fmt.Errorf("%s.%s is not an exported function", GlobalName, name)
	}
	rt.fns[name] = f
	return f, nil
}
