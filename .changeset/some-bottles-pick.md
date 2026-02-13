---
"recursica-forge": patch
---

Added NumberInput component with full integration and fixed Slider component spacing issues.

## NumberInput Component

**New Component:**
- Created NumberInput adapter component with support for all TextField features (label, placeholder, help text, error text, leading/trailing icons, states, layouts)
- Implemented library-specific versions for Mantine, Material UI, and Carbon Design System
- Added number-specific props: min, max, step, defaultValue

**Configuration:**
- Added NumberInput entry to UIKit.json with global form token references
- Configured variants for states (default, error, focus, disabled) and layouts (stacked, side-by-side)
- Created NumberInput.toolbar.json for toolbar controls

**Registration & Integration:**
- Registered component in all three UI library registries
- Added comprehensive NumberInputPreview component showing multiple states, layouts, and icon variations
- Integrated preview in ComponentDetailPage with toolbar support

**Toolbar & Export:**
- Wired up export and randomization functionality alongside TextField
- Added NumberInput handling in BorderGroupToolbar for proper border property resolution
- Added NumberInput to PropControlContent for dimension sliders and property controls
- Ensured all toolbar controls work correctly with variant-specific properties

## Slider Component Fixes

**Spacing & Layout:**
- Fixed vertical spacing between slider rows on token pages (FontSize, FontLineHeight, FontLetterSpacing, Opacity, Size)
- Implemented proper `showMinMaxInput` prop handling with master toggle behavior
- Added `finalShowInput`, `finalShowMinMaxLabels`, and `finalShowValueLabel` derived props for consistent display logic
- Fixed value label display to show correctly when input is hidden
- Ensured NumberInput component integration within Slider with proper width constraints

**Component Improvements:**
- Refactored Slider adapter to handle value labels more consistently across all UI kits
- Fixed min/max label display logic across Mantine, Material, and Carbon implementations
- Improved CSS variable reactivity for text styling properties (font-family, font-size, font-weight, etc.)
- Added proper margin control with `disableTopBottomMargin` prop for NumberInput integration

**Token Page Updates:**
- Updated all font token pages (FontLetterSpacingTokens, FontLineHeightTokens, FontSizeTokens) to use consistent Slider configuration
- Updated OpacityTokens and SizeTokens to match spacing patterns
- Ensured all token pages properly display value labels and maintain visual consistency

## Commits
- fixes for sliders
- export and randomization
- first build
