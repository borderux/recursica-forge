---
"recursica-forge": patch
---

Fix accordion export validation errors and restore export modal actions

- **Fix 13 DTCG reference validation errors on accordion-item export**: The `normalizeUIKitBrandReferences` function in `jsonExport.ts` was not correcting malformed references produced by `cssVarToRef` when toolbar changes wrote CSS variable values back into the UIKit JSON store. Added targeted normalization rules to fix `elements.text-color` → `elements.text.color` (layer text path), `palettes.core.black` → `palettes.core-colors.black.tone` (core palette path), and palette refs missing the `.color.` segment.
- **Restore Download and Export to GitHub buttons in export modal**: The Modal component refactor (PR #218) switched the export selection modal to the Modal adapter's built-in footer, which only supports two actions. This silently dropped the "Export to GitHub" button and broke the "Download" button wiring. Reverted to the original pattern using `showFooter={false}` with custom `Button` components rendered in the content area to restore all three actions (Cancel, Download, Export to GitHub).
