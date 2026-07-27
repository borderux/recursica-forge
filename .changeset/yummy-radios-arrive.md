---
"recursica-forge": patch
---

- **Table Component Styles**:
  - Fixed a styling issue where `text-decoration` was not inheriting or propagating to the actual text content in `TableHeader` and `TableFooter` (due to atomic inline-flex/inline-block behaviors) by explicitly applying the decoration CSS variables inside the inner wrappers of `TableHeader.css` and `TableFooter.css`.
  - Refactored `TableFooter.tsx` so that `currency` variants read text settings from the component's own new `currency-style` design token rather than borrowing from `TableCell`.
- **Design Tokens**:
  - Added `currency-style` under `TableFooter` definitions in `recursica_ui-kit.json` to match the custom currency styling options.
- **Toolbar Configuration & Previews**:
  - Added the `properties.currency-style` control block to `TableFooter.toolbar.json`.
  - Cleaned up the `TablePreview.tsx` module by removing hardcoded inline `fontWeight` rules from the footer, allowing the design tokens to properly dictate the text weights.

