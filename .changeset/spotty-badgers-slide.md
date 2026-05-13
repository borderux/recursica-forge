---
"recursica-forge": minor
---

## Per-component test file architecture

Refactored the 37 test export JSON files from monolithic full-ui-kit snapshots (~500KB each, ~17MB total) into slim partial files that contain only the focal component(s) and shared globals (~15KB average, 643KB total — a 97% reduction).

### Test file changes
- Each file now contains `ui-kit.globals` and only the component(s) relevant to that file
- Related sub-components are grouped together: `switch` / `switch-group` / `switch-item`, `checkbox` / `checkbox-group` / `checkbox-item`, `radio-button` / `radio-button-group` / `radio-button-item`, `menu` / `menu-item`, `accordion` / `accordion-item`, `segmented-control` / `segmented-control-item`, `timeline` / `timeline-bullet`
- All 37 files updated with focused, accurate token data validated against the current design system

### Import pipeline changes (`ImportModal.tsx`)
- `handleTestFileSelect` now performs a shallow merge of the partial file's focal components over the current in-memory ui-kit state before passing to the import pipeline
- Runtime globals are used (not the test file's snapshot) so token references always resolve against the live design system
- The merged result is a complete, valid ui-kit that passes full DTCG reference validation

### Bug fixes
- Fixed dangling DTCG reference in `recursica_ui-kit.json`: `transfer-list` side-by-side layout `top-bottom-margin` referenced non-existent `{ui-kit.globals.form.properties.horizontal-item-gap}`; corrected to `{ui-kit.globals.form.properties.vertical-item-gap}`
- Added `SwitchGroup` and `SwitchItem` to the `ComponentName` union type in `registry/types.ts`
- Added `helpText` prop to `SwitchGroupProps` in `SwitchGroup.tsx`
- Fixed `normalizedComponentName` out-of-scope references in `PropControlContent.tsx` (track and thumb handlers)
- Added `hover-color` and `hover-opacity` props to `AccordionItem.toolbar.json` to match the ui-kit schema and pass the toolbar coverage test

### Per-component fixes and test file additions
Numerous individual component fixes landed alongside their test files across the branch, including: button, badge, avatar, autocomplete, assistive element, breadcrumb, card, chip, checkbox/radio groups, date picker, dropdown, file input, file upload, hover card/popover, label, link, loader, menu/menu-item, modal, number input, pagination, panel, read-only field, segmented control, slider (discrete sliders), stepper, switch group, tabs, text field, textarea, time picker, timeline, toast, tooltip, transfer list
