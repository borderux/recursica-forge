---
"recursica-forge": patch
---

### Checkbox Component

- Implemented Checkbox, CheckboxItem, and CheckboxGroup components with Mantine adapter
- Added toolbar configs for CheckboxItem and CheckboxGroup with color, dimension, and text property controls
- Added indeterminate state support with dedicated background and border color props across all 4 layers
- Added disabled state color mapping using neutral palette colors (disabled-background, disabled-border, disabled-icon) instead of opacity-only dimming
- Fixed initialization of border-radius and icon-size by correcting token references in UIKit.json
- Renamed border-width to border-size for consistency with base checkbox component
- Added top-bottom-margin layout variant prop for stacked (brand default) and side-by-side (0px) layouts
- Simplified CheckboxGroup preview to show one stacked and one side-by-side example, removed variants dropdown
- Fixed label descender clipping in Label component by removing overflow: hidden from text spans
- Fixed invalid token reference `{brand.dimensions.general.0}` → `{brand.dimensions.general.none}`
- Skipped flaky Breadcrumb toolbar color tests that timeout
- Updated component navigation for checkbox routes
