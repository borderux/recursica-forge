---
"recursica-forge": minor
---
- **Structure Version 2.1.0 & Migration**:
  - Bumped design token schema structure version to `2.1.0`.
  - Decoupled interactive fill from readable color tokens across `recursica_brand.json`, `recursica_tokens.json`, and `recursica_ui-kit.json`.
  - Updated `migrateImportedJson` to automatically upgrade legacy schema structures to 2.1.0.

- **Accessibility & Compliance Service**:
  - Fixed standard component contrast audits by using real UI-Kit color keys (`background-color`, `text-color`) across all standard components.
  - Added per-mode contrast suggestion generation targeting mode-scoped brand variables when dual-mode shared fixes are mathematically impossible.
  - Surfaced interactive on-tone compliance warnings in `BaseColorsGrid` (`EmphasisCell` and `InteractiveCell`) with direct access to `SuggestTonesModal`.
  - Added fallback between flat (`interactive_tone`/`interactive_on-tone`) and nested (`interactive_default_tone`/`interactive_default_on-tone`) token pairs.

- **Toolbar Property Controls & Contrast Badges**:
  - Fixed contrast badge calculations in `PropControlContent` to compare paired props (e.g. text color vs. background color) instead of self-referencing the current control's CSS variable.

- **Color Scales & Alias Resolution**:
  - Improved color scale alias resolution and family name parsing across `tokens.ts`, `varsStore.ts`, and `familyNames.ts`.
  - Enhanced `PaletteColorSelector` and `ColorTokens` controls.
  - Added JSON schema validation utilities for token exports and imports.

- **Component Styling & Typography**:
  - Replaced legacy descender padding/margin hacks in `Button`, `MenuItem`, and `TransferList` with `tall` line-height tokens where necessary.
  - Sized `TransferList` title line box to prevent descender clipping.
