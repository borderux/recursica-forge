---
"recursica-forge": patch
---

Fix Avatar toolbar property resolution for image variant

- Fixed BorderGroupToolbar to correctly resolve border-size, border-radius, and border-color CSS variables for the Avatar image variant instead of incorrectly targeting text.solid variant properties
- Added Avatar-specific nested variant matching to BorderGroupToolbar (borderSizeProp, borderRadiusProp, getCssVarsForProp) that validates both style and style-secondary dimensions
- Updated Avatar adapters (Mantine, Carbon, Material) to read border properties from style variant CSS variables
- Extended ComponentToolbar cross-variant invalidation to re-resolve grouped props when switching between primary variants
- Added border-size token to the image variant in recursica_ui-kit.json
- Added showForVariants filter to hide text-color control for image variant in Avatar toolbar config
- Fixed BackgroundToolbar to correctly resolve background color for Avatar image variant
