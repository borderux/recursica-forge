---
"recursica-forge": patch
---

## Export Fixes

- Fixed brand.json export to correctly parse palette keys with hyphens (e.g., `palette-2`, `core-white`, `core-black`)
- Fixed token reference parsing to handle `scale-01` format correctly (was incorrectly generating `scale.01-100` instead of `scale-01.100`)
- Enhanced `normalizeBrandReferences()` to automatically fix malformed references:
  - `{brand.palettes.core.white}` → `{brand.palettes.core-white}`
  - `{brand.palettes.palette.2.000.on.tone}` → `{brand.palettes.palette-2.000.color.on-tone}`
  - `{tokens.colors.scale.01-100}` → `{tokens.colors.scale-01.100}`
- Fixed export validation to use correct object structure (validates full export object with `brand` property)
- Export now reads from CSS variables instead of store JSON, ensuring AA-compliant on-tone values are included

## Test Fixes

- Updated AAComplianceWatcher tests to match refactored implementation (removed watcher methods, now uses explicit update calls)
- Fixed test failures by updating method calls:
  - `watchPaletteOnTone()` → `updatePaletteOnTone()`
  - `watchLayerSurface()` → `updateLayerElementColors()`
  - `validateAllCompliance()` → `checkAllPaletteOnTones()`
  - `watchCoreColors()` → `updateAllLayers()`
- Removed references to non-existent `destroy()` method
- Removed reference to non-existent `lastValues` property

## AA Compliance Improvements

- Various fixes to AA compliance watcher and core color compliance logic
- Improved palette color selector and grid components
