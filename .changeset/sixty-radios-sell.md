---
"recursica-forge": patch
---

### Chip component improvements

- Added `selected-icon-color` prop to all Chip variants (unselected, selected, error, error-selected) across all layers, allowing independent control of the checkmark/selection icon color
- Added `leading-icon-color` as a variant-level, per-layer color property using `buildVariantColorCssVar` for proper reactivity
- Renamed "close icon" to "remove icon" throughout the toolbar config and labels (`close-icon-color` → "Remove icon color", `close-icon-size` → "Remove icon size")
- Fixed icon-text gap not applying between text and the remove icon — the gap slider now controls spacing on both sides (leading icon ↔ text and text ↔ remove icon)
- Fixed remove icon size not updating when the general icon size slider is changed — added separate "Remove icon size" slider to the `IconGroupToolbar`
- Fixed color label casing in `IconGroupToolbar` — now uses toolbar config labels with sentence case instead of auto-generated title case
- Updated all three Chip adapters (Mantine, Material, Carbon) to read `selected-icon-color`, `leading-icon-color`, and `close-icon-color` using `buildVariantColorCssVar`
- Fixed Mantine adapter CSS: reset default 5px section margin and applied `--chip-icon-text-gap` directly to `.recursica-chip-delete`

### FileUpload and FileInput components

- Added new `FileUpload` component with drag-and-drop support (Mantine adapter)
- Added new `FileInput` component for file selection (Mantine adapter)
- Added toolbar configs, preview components, and component registry entries for both
- Added corresponding UIKit.json definitions and Brand.json tokens

### Export pipeline and scoped CSS

- Refactored `recursicaJsonTransformScoped` for improved scoped CSS output
- Updated `recursicaJsonTransformSpecific` with border-style support
- Added `SCOPED_CSS_ARCHITECTURE.md` documentation

### Other fixes

- Fixed border-style support in `updateUIKitValue`
- Fixed palette color selector and grid cell improvements
- Fixed TextField toolbar config updates
- Added `BorderGroupToolbar` component for grouped border controls
