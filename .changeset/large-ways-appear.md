---
"recursica-forge": patch
---

### Card Component

- Added Card component adapter with full support for Mantine, Material UI, and Carbon shells
- Implemented per-layer color properties (background, header-background, footer-background, border-color, divider-color, title, content) across all four layers (0–3)
- Added per-layer border properties (border-size, border-radius) with toolbar slider controls
- Added per-layer elevation properties with elevation slider control in the toolbar
- Added component-level layout properties (padding, header-padding, footer-padding, section-gap, vertical-gutter, divider-size, min-width, max-width, header-style)
- Created Card toolbar configuration (Card.toolbar.json) with grouped controls for Border, Content, Dividers, Elevation, Footer, Header, and Sizes
- Created CardPreview with three distinct goblin-themed preview cards (story chapter, potion item, emporium shop) showcasing headers, footers, images, badges, buttons, and dividers
- Added Card.toolbar.test.tsx with 41 integration tests covering color updates, component-level props, multiple simultaneous updates, reactive CSS variable changes, variant switching, and card sections
- Added Card entry to UIKit.json with full token structure including per-layer colors, borders, and elevations
- Registered Card component in all three shell registries (Mantine, Material, Carbon)
- Added card preview images (goblin, potion, shop) to public assets

### Toolbar Fixes

- Fixed toolbar slider values not reflecting correct applied values when switching layers via the segmented control
- Fixed layer filtering in getCssVarsForProp to correctly filter by layer for any prop with 'layer-X' in its path (not just colors)
- Fixed elevation slider to correctly update the selected layer's elevation in the Card preview by reading from the Card's component-level CSS variable instead of the brand layer system
- Fixed button width in Card preview to not stretch full-width (added alignSelf: flex-start)
- Fixed letter-spacing CSS variable references in CardPreview to use the correct `font-letter-spacing` suffix matching the typography resolver output

### Elevation System

- Updated brandCssVars.ts with improved elevation resolution including parseElevationValue and extractElevationMode utilities
- CardPreview now reads elevation from component-level CSS variables (reactive to toolbar changes) instead of the static brand layer system
