---
"recursica-forge": patch
---

### Link Component Rework

- Refactored the Link component JSON structure in `UIKit.json` to align with the updated component architecture (state-based variants with default, hover, visited, and visited-hover states)
- Updated Link toolbar configuration (`Link.toolbar.json`) for proper state-based controls
- Updated Link adapters (Mantine, Material, Carbon) to read and apply state-specific CSS variables for colors, text properties, and icon styling
- Added Link component CSS (`Link.css`) with full hover, visited, and visited-hover state support including `!important` overrides and `data-force-state` attribute support for preview
- Added icon support (start/end icons) with configurable visibility, position, size, gap, and per-state color theming
- Updated Link component preview in `componentSections.tsx`
- Introduced `IconSelector` component for choosing icons and expanded the icon library

### Sidebar Footer Fixes

- Fixed sidebar footer copyright links to correctly use the Link component's color, font-weight, text-decoration, and font-style CSS variables
- Footer links now properly override inherited caption typography styles (text-transform, font-style, text-decoration, font-weight) with Link component values
- Added missing caption typography properties (text-decoration, text-transform, font-style) to the copyright footer div
- Fixed `mapLinkProps` to correctly map `inlineStyle` prop to `style` for library adapters
- Added `variant`, `size`, and `style` to `LinkProps` type to resolve TypeScript errors in library adapters
- Full hover state support on copyright links (color, font-weight, text-decoration, font-style)

### Other Fixes

- Fixed button label overflow property and added overflow hidden to button inner container
- Updated button icon-text gaps and refined color palette references
- Fixed palette color issues
- Fixed button grey bar due to overflow change
