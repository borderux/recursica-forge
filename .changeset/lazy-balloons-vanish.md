---
"recursica-forge": patch
---

**CSS Variable Delta System**
- Introduced `cssDelta.ts` for tracking only user-modified CSS vars (delta) rather than persisting full JSON objects to localStorage
- Added `deltaToJson.ts` and `structuralMetadata.ts` to support rebuilding clean JSON exports from the CSS delta
- Added `cssVarBuilder.ts` with a centralised builder for generating scoped CSS variable names consistently

**Export / Import Improvements**
- `jsonExport.ts` now rebuilds export JSON from the CSS delta rather than the full in-memory store, producing accurate minimal diffs
- `ExportSelectionModal.tsx` updated to reflect new export pipeline
- `jsonImport.ts` fixed: replaced inline `require()` for cssDelta with a top-level import (fixes ESM/Vitest compatibility); `detectDirtyData` now returns correct results
- `updateCssVar.ts` now calls `console.error` when a brand CSS variable receives a hardcoded value that cannot be auto-fixed (fixes failing test assertion)

**Dev: Round-Trip Diff Page (`/dev/diff`)**
- New `RoundTripPage.tsx` — three-panel diff viewer showing Original / Export / Import snapshots side by side
- New `exportImportValidator.ts` orchestrating the export→import→compare pipeline
- Header is hidden on the `/dev/diff` route; a "Back to Forge" button is provided instead
- State persists when navigating to the diff page (removed erroneous `store.resetAll()` call)
- Single scrollbar replaces three independently synchronised panel scrollbars
- Top bar and panel column headers are sticky on scroll
- Tabs (Tokens / Brand / UI Kit) filter which file's diffs are shown; defaults to Tokens
- Diff page uses plain HTML + inline styles to ensure it is unaffected by randomised CSS variables

**Randomise Variables**
- Expanded `randomizeVariables.ts` to cover previously missed UIKit token reference types: `tokens.opacities.*`, `brand.dimensions.*`, `brand.typography.*`, and a keyword-based catch-all for remaining unhandled refs
- Randomise button icon updated to `Shuffle`; diff-launcher button updated to `Exclude`

**Layer & Compliance Fixes**
- `layerColorStepping.ts`, `ComplianceService.ts`, `coreColorAaCompliance.ts`, `AAComplianceWatcher.ts` — miscellaneous compliance scan accuracy and persistence fixes
- `LayerStylePanel.tsx` and `LayersPage.tsx` — layer selection and CSS variable update fixes

**Bug Fixes & Coding Standards**
- Removed stray `console.log` / `console.warn` / `debugger` statements across modified files
- `typographyUtils.ts`, `typography.ts`, `palettes.ts`, `colorSteppingForAa.ts` — resolver and utility clean-ups
- `Modal.tsx` / `Modal.css` — layout and footer spacing corrections
- `iconLibrary.ts` — added `GitDiff`, `Exclude`, and `Shuffle` icons from Phosphor
