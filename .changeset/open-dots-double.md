---
"recursica-forge": minor
---

### Export/Import round-trip refactor

**UIKit JSON: flatten reference values**
- Removed redundant `{ value, unit }` wrappers from dimension tokens that use `{brand.*}` references — references now resolve their own units, eliminating double-unit bugs during round-trip.

**Atomic bulk import**
- Added `VarsStore.bulkImport()` for multi-file imports (tokens + brand + uikit) as a single atomic operation with one `recomputeAndApplyAll` pass, preventing race conditions where intermediate recomputes produced stale CSS vars.
- Added `VarsStore.importTheme()` which rebuilds elevation state (palette selections, color tokens, controls) from the imported brand JSON before recomputing — ensures elevation CSS vars are correct after import.

**Delta persistence for imports**
- `setTokens`, `setTheme`, and `bulkImport` now automatically track their computed CSS vars into the delta system (`trackCurrentStateAsDelta`), so imported state persists across page refreshes without a separate manual step.
- Import flow now clears per-namespace delta prefixes (`clearDeltaByPrefix`) before importing, preventing stale overrides from resurrecting.

**Export/Import validator improvements**
- Refactored `exportImportValidator.ts` to use live DOM CSS var snapshots (`getComputedCssVars`) instead of relying on internal store state, fixing false-positive zero-diff results.
- Added `diffSession.ts` for structured diff tracking across validation runs.

**Dirty data detection**
- Expanded `importWithDirtyData.tsx` with improved pre-import dirty-data checks and user confirmation flow.

**Resolver fixes**
- UIKit resolver (`resolvers/uikit.ts`) updated to handle null/undefined values without emitting broken CSS vars.
- Palette resolver updated for consistent token path resolution.

**Cleanup**
- Removed stale `export/` directory artifacts (brand, tokens, ui-kit JSON, and scoped CSS).
- Removed unused Switch adapter variant-mapping code (Carbon, Mantine, Material).
- Stripped all `console.log`/`console.warn`/`console.error` debugging statements.
