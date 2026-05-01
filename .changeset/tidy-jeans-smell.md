---
"recursica-forge": patch
---

### Bug Fixes

- **Fix palette export persistence**: Dynamic palettes added after import (e.g. palette-3) are now correctly included in subsequent exports. The `bulkImport` flow now re-derives the dynamic palette list from the imported theme JSON.
- **Fix export reference normalization**: Replaced hardcoded `palette-1|palette-2` regex patterns with dynamic `palette-\d+` matching in both `normalizeBrandReferences` and `normalizeUIKitBrandReferences`, so references from any palette index are properly normalized during export.
- **Fix interactive color propagation**: Removed an over-eager guard condition in `updateCoreColorInteractiveOnTones` that blocked recalculation of core color interactive values when the interactive color itself was changed. All core colors now correctly re-evaluate their interactive tones against the new interactive scale.
- **Fix interactive on-tone DTCG paths**: Corrected fallback brand references in `interactiveColorUpdater.ts` to use fully qualified `brand.themes.{mode}.palettes.core-colors.{color}.tone` paths instead of invalid `brand.palettes.core-colors.{color}` shorthand. Also fixed missing `.tone` suffix in `ColorTokenPicker.tsx` interactive on-tone reference.
- **Fix suggest-tone on-tone updates**: The "suggest tones" modal now correctly updates on-tone values (white or black) when changing the underlying tone, using mode-qualified core-color references.
- **Fix compliance on-tone persistence**: `ThemeCompliance` on-tone updates now derive the CSS variable from the issue's `toneCssVar` when `targetCssVar` is missing, and use theme-scoped JSON references for persistence.
- **Fix color scale rename**: Renaming a color scale now correctly updates the `alias` in the tokens JSON before calling `renameFamilyName`, preventing blank duplicate scales from being created on blur.
- **Fix form field descender clipping**: Moved `minHeight` from `<input>` elements to their parent wrapper `<div>` in TextField, NumberInput, and DatePicker. Input elements have implicit `overflow: hidden`, so tight `line-height` values caused descenders (g, y, p, q) to be clipped at certain resolutions. Also changed `overflow: hidden` to `overflow: clip` on text spans in Dropdown and FileInput.
