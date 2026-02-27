---
"recursica-forge": patch
---

### Radio Button Component

Added the complete Radio Button component family (RadioButton, RadioButtonItem, RadioButtonGroup) with full implementations across Mantine, Material UI, and Carbon libraries:

- **RadioButton**: Base radio button with configurable size, border-radius, border-size, icon-size, and per-layer color properties (selected/unselected backgrounds, borders, icon color, disabled states). Uses a circle icon indicator with dimension token-based sizing.
- **RadioButtonItem**: Wraps RadioButton with label text styling (font-family, font-size, font-weight, line-height, letter-spacing, color, text-decoration, text-transform) and a configurable label gap and max-width.
- **RadioButtonGroup**: Groups RadioButtonItems with stacked and side-by-side layout variants, configurable item-gap, padding, label-field-gap, gutter, vertical-padding, and top-bottom-margin per layout.

### Toolbar Support

- Added toolbar configs (`RadioButtonItem.toolbar.json`, `RadioButtonGroup.toolbar.json`) with full property groups for size, color, and text style editing.
- Fixed component name normalization (`radio-button-group-item` → `radio-button-item`) in `componentToolbarUtils.ts`, `ComponentToolbar.tsx`, and `cssVarNames.ts` to correctly resolve UIKit.json keys.
- Added base `radio-button` property inheritance for `radio-button-item` toolbar, mirroring the existing checkbox pattern.
- Added virtual props for RadioButtonGroup stacked/side-by-side top-bottom-margin.

### Checkbox Item Enhancements

- Added `max-width` property to checkbox-item in UIKit.json (default 400px) and toolbar config (slider 200–1000px).
- Added `max-width` CSS variable wiring across all three library implementations.
- Fixed wrapping label example in CheckboxItemPreview to use proper interactive state and goblin-themed text.

### Typography

- Updated type sample text to use the goblin-themed pangram: "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

### Tests

- Added `RadioButtonItem.toolbar.test.tsx` with tests for color, size, and text prop updates.
- Added `RadioButtonGroup.toolbar.test.tsx` with tests for spacing, layout variants, and top-bottom margin updates.
