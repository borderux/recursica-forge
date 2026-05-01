---
"recursica-forge": minor
---

### State Persistence & Import/Reset Refactor

- **Consolidated import pipeline**: Removed redundant `importTheme`, `importTokensJson`, `importBrandJson`, `importUIKitJson` methods. All imports now flow through a single `importJsonFiles()` → `store.bulkImport()` path.
- **Renamed localStorage keys**: `_original` → `_imported` to accurately distinguish user-imported snapshots from bundled app defaults.
- **Fixed import persistence**: `bulkImport` now sets the `recursica_has_imported` flag and clears `edited` keys on import so dirty data detection compares against the correct baseline.
- **Init fallback chain**: Startup loads state as `edited` → `imported` → bundled JSON, ensuring page reloads after import preserve imported data.
- **Reset modal**: Always shows confirmation on reset. Radio options ("Reset to last imported version" / "Reset to app defaults") appear only when imported data exists in localStorage.
- **Dirty data detection**: `detectDirtyData` now compares against imported baseline (when available) instead of always the bundled JSON.
- **Old key migration**: One-time migration of legacy `_original` localStorage keys to `_imported` keys.

### Compliance & Theme Fixes

- **Compliance page restructured**: Split into `ThemeCompliance` and `ComponentCompliance` modules with clear `h2`/`h3` hierarchy.
- **Dark mode alert on-tones**: Fixed tone/on-tone propagation in dark mode compliance fixes.
- **Radio button animation**: Fixed selection animation to originate from the center of the dot.
- **Suggest Tones modal**: Updated to use new compliance service patterns.

### Export Pipeline Fixes

- **Dark layer interactive on-tone**: Fixed `injectDarkLayer0InteractiveAliases` in both specific and scoped CSS transforms to synthesize `on-tone` when `tone` exists but `on-tone` is missing in the brand JSON.
- **Export validation**: Improved `ValidationErrorModal` and added `ImportValidationErrorModal` for import-time reference validation.

### Codebase Cleanup

- **Purged legacy cssDelta infrastructure**: Removed `cssDelta.ts`, `deltaToJson.ts`, and all delta-related code across UI modules.
- **Removed diagnostic instrumentation**: Deleted `dumpBrand.test.ts` and 38+ untracked script files from the project root.
- **Removed dead code**: Cleaned up unused fallback logic, legacy color stepping, and redundant localStorage writes.
