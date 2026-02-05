---
"recursica-forge": patch
---

## Component Toolbar Slider Consistency & UIKit.json Token Standardization

### Summary
Ensured all component toolbars use the correct slider type (token-based or pixel-based) based on what's actually defined in UIKit.json, and standardized dimension properties to use tokens where appropriate.

### Changes

#### UIKit.json Token Standardization
- **Badge component**: Updated `padding-horizontal` and `padding-vertical` to use token references (`{brand.dimensions.general.default}` and `{brand.dimensions.general.sm}`) instead of hardcoded pixel values
- **Form globals**: Updated `vertical-item-gap` to use `{brand.dimensions.general.default}` token instead of hardcoded `8px`
- **Button component**: Updated small size variant `horizontal-padding` to use `{brand.dimensions.general.md}` token instead of hardcoded `12px`
- **Slider component**: Updated `track-height` to use `{brand.dimensions.general.sm}` token instead of hardcoded `4px`

#### Component Toolbar Slider Logic
- **New utility function**: Added `getDimensionPropertyType()` in `componentToolbarUtils.ts` to check UIKit.json and determine if a dimension property uses token references or hardcoded pixel values
- **PropControlContent updates**: Modified dimension property rendering to:
  - Check UIKit.json first to determine property type (token vs px)
  - Use `BrandDimensionSliderInline` for properties that use tokens
  - Use pixel sliders (`Slider` component) or `DimensionTokenSelector` for properties that use hardcoded px values
  - Automatically determine the correct dimension category (border-radii, icons, general, text-size) based on property name

#### Technical Details
- Component toolbars now dynamically select the appropriate slider component based on UIKit.json definitions
- Ensures consistency across all components - properties using tokens get token sliders, properties using px get pixel sliders
- Maintains backward compatibility with existing component-specific handlers while prioritizing UIKit.json definitions

### Impact
- Improved consistency: All dimension properties now use the slider type that matches their UIKit.json definition
- Better maintainability: Changes to UIKit.json automatically reflect in toolbar slider selection
- Standardized approach: Eliminates inconsistencies where some components used tokens but had pixel sliders (or vice versa)
