---
"recursica-forge": patch
---

- **Variant Management & Editing**:
  - Replaced the `DeleteVariantModal` with an `EditVariantModal` that supports both deleting and renaming custom design system variants.
  - Added a `renameCustomVariant` function in `createVariantInUIKit.ts` to rename variant keys in the UI Kit while preserving order, values, and the current toolbar selection.
  - Added support for fixed/closed variant axes where creation of new variants is disallowed, using the `allowCreate` prop and `getVariantFixedOptions`.
- **Dynamic Config Refactoring**:
  - Replaced hardcoded layouts and variants in component previews and toolbars (e.g. `Chip`, `SegmentedControl`, `MenuItem`) with dynamic configurations loaded from the toolbar configs and adapters.
- **Component Schemas**:
  - Added JSON schema export definitions for `tableCell.json`, `tableFooter.json`, and `tableHeader.json` to complete component test coverage.

