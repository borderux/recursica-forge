---
"recursica-forge": patch
---

Restructure Accordion/AccordionItem component architecture

### Accordion

- Moved divider properties (`divider-size`, `divider` color) from AccordionItem to Accordion, making dividers a container-level feature
- Dividers now render as CSS `::before` pseudo-elements centered in the gap between items, replacing the old `data-divider` attribute approach
- Added `overflow: hidden` to the accordion container so items clip to the container's border-radius
- Reorganized toolbar: renamed "background" section to "container" (now groups background + padding), merged divider controls into the "item gap" section

### AccordionItem

- Added `content-margin` property (uses general dimension tokens) with toolbar control in the "content" section
- Added `content-border-size`, `content-border-color`, `content-border-radius` properties with toolbar controls
- Added `item-border-size`, `item-border-color` properties with toolbar controls in the "item" section
- Renamed `elevation` to `elevation-item` and added `elevation-content` for independent content panel elevation, both grouped under the "elevation" toolbar section
- Reorganized toolbar: split padding into `header-horizontal-padding` and `content-horizontal-padding`, renamed sections for semantic clarity ("hover" → "header hover", "header-content gap" → "content-top-padding", etc.)
- Removed duplicate `item-border-radius` toolbar entry
- Removed inline `border: none` overrides from Mantine adapter that were preventing item borders from rendering
- Removed `data-divider` attribute and `showDivider` logic from all adapter JSX files (Mantine, Material, Carbon, base)
- Fixed CSS variable name mismatch (`--accordion-divider-*` → `--accordion-item-divider-*`) that prevented dividers from rendering
- Border-size sliders for item, content, and header use 0–10px range

### Tests

- Updated Accordion adapter test to verify absence of `data-divider` attributes (dividers are now CSS-only)
- Updated AccordionItem toolbar test exclusion list for restructured property mappings
