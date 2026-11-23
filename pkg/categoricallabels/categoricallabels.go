// Package categoricallabels turns the codes collect-lib writes for categorical values (sleep
// stages, activity levels, workout types, …) back into their labels, e.g. for a CSV export.
// The tables are collect-lib's CATEGORICAL_LABELS (src/devices/annotations/categoricalLabels.ts),
// compiled into bundle/bundle.js by `yarn build` (see README_GO.md), so there is no hand-kept
// Go copy that can drift from what Phoenix encodes.
//
// Unlike pkg/guard, the JS runs only once: Label is called for every exported value, far too
// often for a goja call each time, so the whole registry is read when the package loads and
// looked up natively, the same way categoricalLabel does in TypeScript.
package categoricallabels

import (
	_ "embed"
	"encoding/json"
	"fmt"

	"github.com/d4l-data4life/collect-lib/pkg/internal/jsbundle"
)

//go:embed bundle/bundle.js
var bundleSource string

// AnyDevice is the device name of tables that apply to every device without its own table.
const AnyDevice = ""

// device name → annotation item type → column → code → label
type registry map[string]map[string]map[string]map[int64]string

var labels = mustLoad()

func mustLoad() registry {
	r, err := load(jsbundle.MustLoad("categoricallabels/bundle.js", bundleSource))
	if err != nil {
		panic(err)
	}
	return r
}

func load(b *jsbundle.Bundle) (registry, error) {
	out, err := b.Call("categoricalLabels")
	if err != nil {
		return nil, fmt.Errorf("categoricallabels: %w", err)
	}
	var r registry
	if err := json.Unmarshal(out, &r); err != nil {
		return nil, fmt.Errorf("categoricallabels: decoding registry: %w", err)
	}
	return r, nil
}

// Label returns the label for code in column of an annotationType item sent by deviceName (the
// device's full name, as in the recording's Device resource), and false if there is none.
// Device-specific tables win over AnyDevice ones. Safe for concurrent use.
func Label(deviceName, annotationType, column string, code int64) (string, bool) {
	if label, ok := labels[deviceName][annotationType][column][code]; ok {
		return label, true
	}
	label, ok := labels[AnyDevice][annotationType][column][code]
	return label, ok
}
