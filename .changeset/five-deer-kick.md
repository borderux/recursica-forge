---
"recursica-forge": patch
---

Fix font token pipeline: export variants, import sequence, reset, and delta conflicts

## Font variant export regression
- `jsonExport.ts`: preserve `$extensions.variants` during UIKit export by merging runtime `fontVariants` map back into the typeface block, preventing a round-trip loss of weight/style variants.

## JSON import — fonts not applied
- `fontStore.ts`: added `deriveFontsFromJson(tokensData, brandData)` — a parameterised version of `getDefaultFonts()` that resolves the font sequence and typeface slugs from arbitrary imported JSON rather than the static file imports.
- `varsStore.ts` (`bulkImport`, `importTheme`): call `deriveFontsFromJson` + `saveStoredFonts` before `recomputeAndApplyAll` so `syncFontsToTokens` uses the imported font list instead of the pre-import `rf:fonts` state.
- After import, dispatch `tokenOverridesChanged` (reset) and `fontsImported` events to trigger `FontFamiliesTokens` row rebuild and Google Fonts stylesheet injection.

## JSON import — Google Font not loaded in browser
- `fontStore.ts`: added `populateWindowFontUrlMap(fonts)` — synchronously writes each `FontEntry.url` into `window.__fontUrlMap` so `ensureFontLoaded` can locate the correct Google Fonts URL without importing `fontUtils` from `varsStore`.
- `FontFamiliesTokens.tsx`: listen for `fontsImported` event and call `loadFontsFromStore()`, which injects the `<link>` stylesheet for every imported font family including custom Google Fonts URLs.

## Reset all — added fonts not removed, sequence not restored
- `varsStore.ts` (`resetAll`): after `clearStoredFonts()`, immediately call `saveStoredFonts(getDefaultFonts())` so `syncFontsToTokens` (invoked inside `recomputeAndApplyAll`) has the canonical default font list and does not return early on an empty `rf:fonts`.

## Sequence change after import has no effect — two bugs
- `FontFamiliesTokens.tsx`: changed `syncFontsToTokens(true)` (silent, no recompute) to `syncFontsToTokens()` in the sequence-swap path so CSS vars update immediately.
- `FontFamiliesTokens.tsx`: re-read tokens from `store.getState()` after the sequence swap so the metadata block (`setTokensSilent`) does not overwrite the newly-written store state with a pre-swap snapshot.
- `cssDelta.ts` (`restoreDelta`, `reapplyDelta`): exclude `--recursica_brand_fonts_*` vars from delta restore/reapply. These vars are re-derived from `rf:fonts` on every `recomputeAndApplyAll`; storing them in the import delta and replaying them after every recompute was overwriting the correctly-computed new sequence assignments.
