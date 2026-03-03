---
"recursica-forge": patch
---

Add Pagination component with variant-based sub-component configuration

- **New Pagination component**: Full adapter implementation for Mantine, Material UI, and Carbon with page navigation, truncation (ellipsis), and first/last edge controls
- **Variant type system (`$type: "variant"`)**: Introduced a new property type in UIKit.json that references button variants, allowing pagination sub-components (active pages, inactive pages, navigation controls) to inherit button style and size configurations
- **Toolbar controls**: Added toolbar groups for active page, inactive page, and navigation controls, each with Style (solid/outline/text), Size (default/small), and Display (icon/text/icon+text) dropdowns
- **Schema validation**: Updated `validateJsonSchemas.ts` with `variant-group-reference` workaround so variant references to button groups pass validation
- **CSS variable resolver**: Added `$type: "variant"` handler in `uikit.ts` that extracts variant names from reference paths for use as CSS variable values
- **Export transforms**: Updated both scoped and specific CSS export transforms to handle variant-type properties by extracting the variant name instead of resolving as a CSS variable reference
- **Virtual prop path resolution**: Updated `ComponentToolbar.tsx` and `PropControlContent.tsx` to correctly build nested CSS variable paths for grouped toolbar properties (e.g., `navigation-controls.style`)
- **Preview component**: Added `PaginationPreview` with simple (5 pages) and many pages (20 pages, with edges) examples
