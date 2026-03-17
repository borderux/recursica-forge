---
"recursica-forge": minor
---

### JSON file migration and CSS variable refactor

- Moved and renamed design token JSON files (`recursica_tokens.json`, `recursica_brand.json`, `recursica_ui-kit.json`) to project root with updated internal references
- Massive refactor of CSS variable generation to use underscore-delimited naming convention consistently across all resolvers (`palettes.ts`, `layers.ts`, `dimensions.ts`, `uikit.ts`, `cssVarBuilder.ts`)
- Introduced scoped CSS engine with `data-recursica-theme` and `data-recursica-layer` attribute selectors for portable CSS export

### Component and toolbar fixes

- Fixed accordion background colors, borders, and palette overlay panel styling
- Fixed toolbar font controls and component-level typography propagation
- Fixed segmented control, slider, modal, and various component preview rendering issues
- Corrected Link adapter usage in `ColorScale.tsx` for consistent "Used in:" link styling

### Token and resolver fixes

- Fixed core color palette variable generation (`paletteCore` builder)
- Fixed elevation resolver CSS variable naming and composite box-shadow output
- Fixed layers resolver for correct surface, border, and interactive color variables
- Fixed dimensions page rendering and dimension token display
- Fixed font token resolvers for letter-spacing, line-height, and weight variables

### CSS variable audit improvements

- Fixed `auditCssVars.ts` malformed variable detection regex to allow underscore-delimited names
- Added deduplication for brace-notation audit entries to eliminate thousands of false positives
- Fixed `tokenReferenceParser.ts` regex to handle `palettes.core` in addition to `palettes.core-colors`
- Fixed `varsStore.ts` to prioritize resolved `var()` values over stale brace notation from localStorage

### Export pipeline

- Added export validation with DTCG schema compliance checks for all three JSON files
- Added CSS-specific and CSS-scoped export options with proper file naming
- Brand references normalized to theme-agnostic format on export for portability

### Test fixes

- Fixed `dimensions.test.ts` expectations to match actual resolver key names (`border-radius` vs `border-radii`)
- All 322 passing tests, 0 failures
