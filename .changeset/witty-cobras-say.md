---
"recursica-forge": patch
---

### Button: Fix icon size control and add hover-elevation property

**Icon size toolbar fix:**
- Fixed icon size slider not updating the rendered icon by correcting the CSS variable path in all four Button adapters (Mantine, Material, Carbon, base) from `getComponentCssVar` to `buildComponentCssVarPath`, matching the JSON structure path (`variants.sizes.{size}.properties.icon`)
- Updated `IconGroupToolbar` to accept `"icon"` as a valid property name for the icon-size slider, since the Button component uses `"icon"` instead of `"icon-size"` in its token structure
- Added category guard (`p.category !== 'size'`) to prevent icon color props from matching the icon-size slider
- Swapped CSS variable priority in `Button.css` SVG rules to use `--button-icon-size` (set reactively by the adapter) as primary, with the static recursica variable as fallback

**Hover elevation:**
- Added `hover-elevation` token (type: `elevation`) to all three Button style variants (solid, text, outline) in `recursica_ui-kit.json`
- Added reactive `hoverElevationVar` resolution in the Mantine Button adapter, exposing `--button-hover-box-shadow` as a CSS custom property
- Updated `Button.css` hover rule to use `var(--button-hover-box-shadow, none)` instead of hardcoded `box-shadow: none`
- Added `hover-elevation` control to the Elevation group in `Button.toolbar.json`

**Toolbar variant key mapping fix:**
- Fixed `variantProp` to toolbar key mapping in `IconGroupToolbar`, `PaddingGroupToolbar`, and `PropControlContent` (e.g., `"sizes"` → `"size"`, `"styles"` → `"style"`)

**Content-variant-specific horizontal padding:**
- Updated Mantine Button adapter to resolve `horizontal-padding` from the content-variant-specific path (`variants.content.{label|icon-only}.sizes.{size}.properties.horizontal-padding`)
- Added content-variant-aware prop resolution in `PropControlContent` so the toolbar writes to the correct CSS variable for the selected content variant
