# Button Component Audit - Material UI

## Overview

This document audits the Button component implementation for Material UI, identifying all CSS variables used, their sources, and any gaps in coverage.

**Last Updated**: 2025-12-12

## Library CSS Variables

### Variables Used (with Fallbacks)

| Library Variable | Recursica Override | Fallback Behavior | Status |
|-----------------|-------------------|-------------------|--------|
| N/A | N/A | Material UI doesn't use CSS variables for theming | ✅ Not Applicable |

### Variables NOT Overridden

Material UI uses the `sx` prop and theme system rather than CSS variables. No Material UI CSS variables are used or overridden.

**Note**: Material UI components are styled via the `sx` prop which accepts CSS-in-JS styles. The component uses Recursica CSS variables directly in the `sx` prop.

## Recursica CSS Variables

### Variables Defined

| Variable Name | Source | Used For |
|--------------|--------|----------|
| `--recursica-ui-kit-components-button-color-layer-{n}-variant-{variant}-background` | UIKit.json | Button background color |
| `--recursica-ui-kit-components-button-color-layer-{n}-variant-{variant}-text` | UIKit.json | Button text color |
| `--recursica-ui-kit-components-button-size-variant-{size}-height` | UIKit.json | Button height |
| `--recursica-ui-kit-components-button-size-variant-{size}-min-width` | UIKit.json | Button minimum width |
| `--recursica-ui-kit-components-button-size-variant-{size}-horizontal-padding` | UIKit.json | Button horizontal padding |
| `--recursica-ui-kit-components-button-size-variant-{size}-icon` | UIKit.json | Icon size |
| `--recursica-ui-kit-components-button-size-variant-{size}-icon-text-gap` | UIKit.json | Gap between icon and text |
| `--recursica-ui-kit-components-button-border-radius` | UIKit.json | Button border radius |
| `--recursica-ui-kit-components-button-font-size` | UIKit.json | Button font size |
| `--recursica-ui-kit-components-button-content-max-width` | UIKit.json | Maximum content width |
| `--recursica-brand-light-layer-layer-alternative-{key}-property-element-interactive-tone` | Brand.json | Alternative layer background |
| `--recursica-brand-light-layer-layer-alternative-{key}-property-element-interactive-on-tone` | Brand.json | Alternative layer text color |
| `--recursica-brand-light-layer-layer-alternative-{key}-property-surface` | Brand.json | Alternative layer surface |
| `--recursica-brand-typography-button-font-weight` | Brand.json | Button font weight |
| `--recursica-brand-light-state-disabled` | Brand.json | Disabled state opacity |
| `--recursica-brand-{mode}-elevations-elevation-{n}-x-axis` | Brand.json | Elevation shadow x-axis offset |
| `--recursica-brand-{mode}-elevations-elevation-{n}-y-axis` | Brand.json | Elevation shadow y-axis offset |
| `--recursica-brand-{mode}-elevations-elevation-{n}-blur` | Brand.json | Elevation shadow blur radius |
| `--recursica-brand-{mode}-elevations-elevation-{n}-spread` | Brand.json | Elevation shadow spread radius |
| `--recursica-brand-{mode}-elevations-elevation-{n}-shadow-color` | Brand.json | Elevation shadow color |

### Variables Used (in sx prop)

**In TSX (sx prop):**
```typescript
sx: {
  backgroundColor: `var(${buttonBgVar})`,
  color: `var(${buttonColorVar})`,
  // For outline, use the outline-text CSS var for border color and ensure border is set
  ...(variant === 'outline' ? {
    border: `1px solid var(${buttonColorVar})`,
    borderColor: `var(${buttonColorVar})`,
  } : {}),
  // For text variant, explicitly remove border
  ...(variant === 'text' ? {
    border: 'none',
  } : {}),
  fontSize: `var(${fontSizeVar})`,
  fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
  height: `var(${heightVar})`,
  minWidth: `var(${minWidthVar})`,
  paddingLeft: `var(${horizontalPaddingVar})`,
  paddingRight: `var(${horizontalPaddingVar})`,
  borderRadius: `var(${borderRadiusVar})`,
  '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
  '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
  '--button-content-max-width': `var(${contentMaxWidthVar})`,
  opacity: disabled ? 'var(--recursica-brand-light-state-disabled)' : undefined,
}
```

**In CSS:**
```css
.MuiButton-root .MuiButton-startIcon {
  width: var(--button-icon-size, 0px) !important;
  height: var(--button-icon-size, 0px) !important;
  margin-right: var(--button-icon-text-gap, 0px) !important;
}

.MuiButton-root {
  max-width: calc(var(--button-content-max-width, var(--recursica-ui-kit-components-button-content-max-width)) - var(--button-icon-size, 0px) - var(--button-icon-text-gap, 0px)) !important;
}
```

## Component-Level CSS Variables

### Variables Set in TSX (sx prop)

| Variable | Purpose | Default |
|---------|---------|---------|
| `--button-icon-size` | Icon width/height | `0px` (when no icon) |
| `--button-icon-text-gap` | Gap between icon and text | `0px` (when no icon) |
| `--button-content-max-width` | Maximum content width | From UIKit.json |

### Variables Used in CSS

All component-level variables are used in CSS with Recursica CSS variables as fallbacks:

```css
/* Example: Icon sizing */
.MuiButton-startIcon {
  width: var(--button-icon-size, 0px) !important;
  margin-right: var(--button-icon-text-gap, 0px) !important;
}

/* Example: Text truncation */
.MuiButton-root {
  max-width: calc(var(--button-content-max-width, var(--recursica-ui-kit-components-button-content-max-width)) - var(--button-icon-size, 0px) - var(--button-icon-text-gap, 0px)) !important;
}
```

## CSS Variable Fallback Chain

```
Component Style (sx prop)
  ↓
Direct CSS properties (backgroundColor, color, etc.)
  ↓
--recursica-ui-kit-components-button-* (Primary Recursica vars)
  ↓ (if not defined)
--recursica-brand-* (Brand vars)
  ↓ (if not defined)
Material UI default theme styles
```

**Note**: Material UI doesn't use CSS variables for theming. The component applies Recursica CSS variables directly via the `sx` prop, which Material UI converts to inline styles.

## Coverage Checklist

- [x] All color variables use Recursica vars
- [x] All size variables use Recursica vars
- [x] Component-level custom properties are properly scoped
- [x] No direct modification of library CSS variables (N/A - Material UI doesn't use CSS vars)
- [x] All CSS variables from JSON files are namespaced with `--recursica-*`
- [x] Visual appearance matches across all libraries
- [x] All variants (solid, outline, text) are covered
- [x] All sizes (default, small) are covered
- [x] All layers (layer-0 through layer-3) are covered
- [x] Alternative layers are supported
- [x] Elevation prop is supported (component-level and from alt layers)
- [x] Border handling is correct (outline has border, text has no border)
- [x] Border color uses outline-text CSS variable
- [x] All states (default, hover, active, disabled, focus) are covered
- [x] Icon support (left, right, icon-only) is covered
- [x] Text truncation is implemented
- [x] TSX to CSS migration opportunities identified and documented

## Automated Audit Commands

### Find Library CSS Variables

```bash
# Find all library CSS variables in component files
grep -r "var(--mui-\|var(--Mui-" src/components/adapters/material/Button/
```

**Result**: No Material UI CSS variables found. Material UI uses theme system, not CSS variables. ✅

### Find Recursica CSS Variables

```bash
# Find all Recursica CSS variables
grep -r "var(--recursica-" src/components/adapters/material/Button/
```

**Result**: Multiple Recursica CSS variables found, all properly namespaced. ✅

### Check for Direct Library Variable Modification

```bash
# Find any direct library variable assignments (should be none)
grep -r "'--mui-\|'--Mui-" src/components/adapters/material/Button/
```

**Result**: No direct assignments found. ✅

### Verify CSS Variable Usage

```bash
# Check that all Recursica vars are used correctly
grep -r "var(--recursica-" src/components/adapters/material/Button/
```

**Result**: All Recursica vars used correctly in sx prop and CSS. ✅

## Visual Regression Testing

### Test Cases

1. **Variants**: solid, outline, text
2. **Sizes**: default, small
3. **Layers**: layer-0, layer-1, layer-2, layer-3
4. **Alternative Layers**: layer-alternative-{key}
5. **States**: default, hover, active, disabled, focus
6. **With Icons**: icon-left, icon-right, icon-only
7. **With Long Text**: truncation behavior

### Screenshots

Screenshots should be captured for each test case to ensure visual consistency with Mantine and Carbon implementations.

## Recommendations

1. ✅ All critical CSS variables are covered
2. ✅ Material UI doesn't use CSS variables, so no library variable overrides needed
3. ✅ Component-level custom properties are properly scoped
4. ✅ No direct library variable modification (N/A)
5. ✅ All CSS variables follow the correct namespace pattern

## Recent Changes

### Elevation Support
- Added `elevation` prop support that applies box-shadow using brand elevation CSS variables
- Elevation is read from alternative layer properties if `alternativeLayer` prop is set, otherwise uses component-level `elevation` prop
- Elevation-0 does not apply any box-shadow
- Uses brand elevation CSS variables: `--recursica-brand-{mode}-elevations-elevation-{n}-{property}`

### Border Handling
- **Outline variant**: Now explicitly sets border with `1px solid` using outline-text CSS variable color
- **Text variant**: Explicitly sets `border: 'none'` to ensure no border is displayed
- Border color uses the outline-text CSS variable (`--recursica-ui-kit-components-button-color-layer-{n}-variant-outline-text`)
- CSS rules added to enforce border styles: `.MuiButton-outlined` and `.MuiButton-text`

## TSX to CSS Migration Opportunities

### High Priority

1. **Extensive `sx` prop usage** (Lines 97-177 in Button.tsx)
   - **Current**: All styling done via Material UI's `sx` prop with direct CSS properties
   - **Recommendation**: Move static styles to CSS file, use CSS variables for dynamic values
   - **Impact**: Large - significantly reduces TSX complexity, improves maintainability
   - **Migration**: 
     - Set CSS variables in TSX (already done for some)
     - Move static properties to CSS: `fontSize`, `fontWeight`, `height`, `minWidth`, `paddingLeft`, `paddingRight`, `borderRadius`, `display`, `alignItems`
     - Use CSS classes with data attributes: `[data-variant]`, `[data-size]`, `[data-disabled]`
     - Keep only dynamic/computed values in `sx` prop

2. **Variant-Based Border Styles** (Lines 102-109 in Button.tsx)
   - **Current**: Conditional border styles in `sx` prop
   - **Recommendation**: Use CSS attribute selectors `[data-variant='outline']` and `[data-variant='text']`
   - **Impact**: Cleaner TSX, better separation of concerns
   - **Migration**: Already partially done in CSS (lines 42-49 in Button.css), but still in `sx` prop

3. **Disabled State Styles** (Lines 130-140 in Button.tsx)
   - **Current**: Disabled state overrides in `sx` prop
   - **Recommendation**: Move to CSS using `:disabled` or `[data-disabled]` selectors
   - **Impact**: Reduces conditional logic in TSX
   - **Migration**: Use CSS `:disabled` pseudo-class with `!important` if needed

### Medium Priority

1. **Icon-Only Button Centering** (Lines 121-123 in Button.tsx)
   - **Current**: Conditional `justifyContent: 'center'` in `sx` prop
   - **Recommendation**: Use CSS selector for icon-only state
   - **Impact**: Cleaner TSX
   - **Migration**: Use `:not(:has(.MuiButton-startIcon))` or data attribute

2. **Elevation Box Shadow Calculation** (Lines 141-174 in Button.tsx)
   - **Current**: Complex box-shadow calculation in TSX with elevation parsing
   - **Recommendation**: Could use CSS custom properties for elevation, but complexity may justify TSX
   - **Impact**: Low - logic is complex and dynamic, CSS would require many variables
   - **Status**: Acceptable to keep in TSX due to complexity

### Low Priority

1. **Flex Layout Properties** (Lines 118-119 in Button.tsx)
   - **Current**: `display: flex` and `alignItems: center` in `sx` prop
   - **Recommendation**: Move to CSS
   - **Impact**: Minimal - simple properties
   - **Status**: Low priority but easy win

## Issues Found

None. The implementation follows all guidelines correctly. See TSX to CSS Migration Opportunities above for potential improvements.

## Toolbar Config Validation

### Schema Validation
- [x] JSON structure is valid
- [x] All required fields present (icon, label, visible)
- [x] Group structure is correct (no icons in grouped props)
- [x] Variant structure is correct

### Prop Coverage
- [x] All root props from UIKit.json are represented:
  - [x] `font-size`
  - [x] `border-radius`
  - [x] `elevation`
  - [x] `max-width`
- [x] Variant props are correctly grouped:
  - [x] `background` and `background-hover` grouped
  - [x] `text` and `text-hover` grouped
  - [x] `border` (grouped: border-size, border-radius, border-color)
  - [x] `width` (grouped: min-width, max-width)
  - [x] `spacing` (grouped: icon-text-gap, horizontal-padding)

### Icon Validation
- [x] All icons are valid Phosphor Icons
- [x] Icons are automatically imported (verified in iconLibrary.ts)
- [x] No missing icon warnings in browser console

### Notes
- Size variant props (height, icon, min-width, horizontal-padding, icon-text-gap) are handled automatically via size variant selection
- Color variant props (background, background-hover, text, text-hover) are filtered based on selected color variant
- Grouped props appear in parent prop's floating palette (no separate icons)

## Last Updated

2025-01-27

