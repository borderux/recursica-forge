---
"recursica-forge": patch
---

### Color Scale Persistence

- Fixed deleted color scales reappearing after browser refresh by persisting deletions to `localStorage` (`rf:deleted-scales`) and stripping them from tokens during initialization
- Added delta sync protection: `restoreDelta` and `syncDeltaToJson` now skip CSS var entries belonging to deleted scales, preventing the delta system from resurrecting them
- Added `resetAll` integration to clear the deleted scales list during full theme reset

### "Used In" Labels (Color Tokens)

- Rewrote color scale usage detection to read live CSS variable values from the DOM instead of resolving stale JSON references, fixing labels reverting to defaults after user changes
- Replaced hardcoded `'interactive'` core color check with data-driven introspection of the `tone` property structure
- Replaced all hardcoded CSS variable name strings with `palette()` and `paletteCore()` builder functions

### Font Persistence

- Fixed custom fonts not loading correctly after browser refresh when reordered into primary/secondary positions
- Fixed font family CSS variable construction for custom font names

### Palette Initialization

- Fixed new palettes failing to initialize tone references for `100`, `050`, and `000` levels

### Code Quality

- Exported `DELETED_SCALES_KEY` constant to eliminate hardcoded `'rf:deleted-scales'` strings across modules
- Removed `|| fam` fallback patterns in favor of explicit `?? null` returns
- Removed stale `console.error`/`console.warn` spy assertions from `updateCssVar` tests
