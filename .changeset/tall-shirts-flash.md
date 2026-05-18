---
"recursica-forge": minor
---

## DTCG Token Schema Compliance Refactor

Full alignment of `recursica_brand.json`, `recursica_tokens.json`, and `recursica_ui-kit.json` with the Design Token Community Group (DTCG) v2025.10 specification.

### JSON Token Changes

- **`$metadata` removed from all three JSON files** — moved to `$extensions.recursica.metadata` per DTCG spec (only `$value`, `$type`, `$description`, `$extensions`, `$deprecated`, and `$extends` are reserved `$`-prefixed keys)
- **`$type: "elevation"` removed** from 8 ui-kit layer property tokens and 8 brand layer property tokens — type preserved as `$extensions.recursica.type: "elevation"` alongside an untyped `$value`
- **`$type: "boxShadow"` corrected** across 10 brand elevation tokens — replaced with `$type: "shadow"` (the DTCG-defined composite type for box-shadow) with `$extensions.recursica.type: "boxShadow"` retaining the original semantic
- **Pagination component slots** refactored to use `$extensions.recursica.component` for sub-component variant configuration instead of non-standard flat variant structures
- **Fixed typo** in pagination `navigation-controls` extension: `variants.contents` → `variants.content`

### Schema Validator (`validateJsonSchemas.ts`)

- Added `validateDtcgStructure` — shared compliance checker for all three JSON files; enforces no unknown `$`-prefixed keys and no non-standard `$type` values; throws with a full list of violations
- Wired `validateDtcgStructure` into `validateBrandJson` and `validateTokensJson`
- Updated `collectRefs` to tag references inside `$extensions` blocks with `inExtensions: true`, allowing component-slot references to target groups/tokens (not only leaf tokens)
- Added `validateUIKitComponentSlots` to enforce structural integrity of `recursica.component` extension payloads

### Runtime Resolvers & Export Transforms

- **`uikit.ts` resolver** — token detection guard updated from `'$value' in value && '$type' in value` to `'$value' in value`; effective token type now resolved as `$type ?? $extensions['recursica.type']`, so elevation tokens reach the correct handler
- **Both export transforms** (`recursicaJsonTransformScoped.ts`, `recursicaJsonTransformSpecific.ts`) — `collectVars` reads `$extensions['recursica.type']` as a fallback token type when `$type` is absent
- **`jsonExport.ts`** — all five metadata write sites migrated from `$metadata` to `$extensions.recursica.metadata`; `version` field now reads from `package.json` at runtime instead of a hardcoded string
- **`exportImportValidator.ts`** — round-trip diff path skip updated from `$metadata.` to `$extensions.recursica.metadata.`

### Bug Fix

- **`PaletteColorControl.css`** — corrected `--recursica_brand_themes_*_palettes_core-colors_alert_color_tone` (non-existent) to `_alert_tone`; removed all fallback values from `var()` calls; removed hardcoded `rgba()` hover backgrounds

### Tests

- 8 new `validateDtcgStructure` tests covering: seed JSON passes, `$metadata` rejection, `"elevation"` / `"boxShadow"` `$type` rejection, valid `"shadow"` + extensions pattern, typeless tokens via `recursica.type`, and `$extensions.recursica.metadata` acceptance
- Elevation test fixture updated from `$type: 'boxShadow'` to `$type: 'shadow'` with correct extensions structure
- All 37 schema tests and 299 suite tests passing
