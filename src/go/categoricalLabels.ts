// Entry for the Go package pkg/categoricallabels (see README_GO.md). Go looks a label up for
// every value it exports, which would be far too slow through goja, so Go fetches the whole
// registry once and looks labels up natively, the same way categoricalLabel does.
import { CATEGORICAL_LABELS, CategoricalLabelRegistry } from '../devices/annotations/categoricalLabels';

export const categoricalLabels = (): CategoricalLabelRegistry => CATEGORICAL_LABELS;
