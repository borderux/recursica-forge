---
"recursica-forge": minor
---

## Semantic Core Color System Migration

Renames the brand palette's legacy `black`/`white` core-color keys to semantic `high-contrast`/`low-contrast` aliases, completing a full system-wide migration for mode-aware accessibility.

### What changed

**`recursica_brand.json`**
- Renamed `black` → `high-contrast` and `white` → `low-contrast` in both light and dark `core-colors` palette sections.
- Corrected 31+ dark-mode `on-tone` references that were failing the 4.5:1 AA contrast ratio, using programmatic contrast auditing to select the compliant semantic key per palette level.
- Fixed dark-mode `interactive` color references to use AA-compliant scale tokens (`scale-06.400` / `scale-06.300`).

**Architecture: Emphasis vs. Contrast**
- Formally separated opacity-based emphasis tokens (`high-emphasis`/`low-emphasis`) from color-based contrast tokens (`high-contrast`/`low-contrast`) — these are distinct concepts and must not be conflated.

**Source code (`src/`)**
- `layers.ts`: Mode resolver now maps `high-contrast`/`low-contrast` keys to the correct hex values per mode (e.g. `high-contrast` = near-white in dark, near-black in light).
- `cssVarBuilder.ts` / `ComplianceService.ts` / `varsStore.ts`: Corrected emphasis token variable names that were incorrectly renamed to contrast during an earlier pass.
- `structuralMetadata.ts`, `OverlayTokenPicker.tsx`, `ColorTokenPicker.tsx`, `PaletteColorControl.tsx`: Updated all `paletteCore('black'/'white')` calls and `coreColorKeys` arrays to use semantic keys, with mode-aware CSS var path construction.
- `PaletteColorSelector.tsx` / `PaletteScale.tsx`: Refactored `pickOnToneWithOpacity` and `recheckAACompliance` to return and consume `'high-contrast' | 'low-contrast'` instead of `'white' | 'black'`.
- `AAComplianceWatcher.ts`: Compliance watcher now checks `high-contrast`/`low-contrast` CSS vars directly.

**Export pipeline**
- `jsonExport.ts`: All backwards-compat normalizers updated to map legacy `black`/`white` refs to semantic keys with mode-awareness (e.g. `{brand.themes.dark.palettes.core-colors.white}` → `{brand.themes.dark.palettes.core-colors.high-contrast.tone}`).
- `recursicaJsonTransformScoped.ts`: `core-black`/`core-white` alias expansion now targets `high-contrast`/`low-contrast`.
- `normalizeUIKitBrandReferences`: UIKit ref normalizer updated to emit semantic keys.

**Test fixtures & test files**
- 22 component test-export JSONs under `src/components/test-exports/`: replaced all 44 `core-colors.white.tone` refs with `core-colors.low-contrast.tone` and 9 `core-colors.black.tone` refs with `core-colors.high-contrast.tone`.
- `colorSteppingForAa.test.ts`: Updated assertions to expect `low-contrast`/`high-contrast` return values and the correct CSS var prefix format.
