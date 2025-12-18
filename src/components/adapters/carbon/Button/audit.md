# Button Component Audit - Carbon

## Overview

This document audits the Button component implementation for Carbon Design System, identifying all CSS variables used, their sources, and any gaps in coverage.

**Last Updated**: 2025-12-12

## Library CSS Variables

### Variables Used (with Fallbacks)

| Library Variable | Recursica Override | Fallback Behavior | Status |
|-----------------|-------------------|-------------------|--------|
| `--cds-button-primary` | `--button-bg` → `--recursica-ui-kit-components-button-*` | Used as fallback in CSS | ✅ Covered |
| `--cds-button-text-primary` | `--button-color` → `--recursica-ui-kit-components-button-*` | Used as fallback in CSS | ✅ Covered |
| `--cds-icon-01` | N/A | Not used | ✅ Not Used |

### Variables NOT Overridden

| Library Variable | Reason | Impact | Recommendation |
|-----------------|--------|--------|----------------|
| `--cds-icon-01` | Not needed for button implementation | None | No action needed |

**Note**: Carbon CSS variables (`--cds-button-primary`, `--cds-button-text-primary`) are now used **only as fallbacks** in CSS, not directly modified. This is the correct pattern.

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

### Variables Used (with Library Fallbacks)

**In TSX (style prop):**
```typescript
style: {
  backgroundColor: `var(${buttonBgVar})`,
  color: `var(${buttonColorVar})`,
  fontSize: `var(${fontSizeVar})`,
  fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
  height: `var(${heightVar})`,
  minWidth: `var(${minWidthVar})`,
  paddingLeft: `var(${horizontalPaddingVar})`,
  paddingRight: `var(${horizontalPaddingVar})`,
  borderRadius: `var(${borderRadiusVar})`,
  '--button-bg': `var(${buttonBgVar})`,
  '--button-color': `var(${buttonColorVar})`,
  '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
  '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
  '--button-content-max-width': `var(${contentMaxWidthVar})`,
  // For outline, use the outline-text CSS var for border color and ensure border is set
  ...(variant === 'outline' ? {
    border: `1px solid var(${buttonColorVar})`,
    borderColor: `var(${buttonColorVar})`,
  } : {}),
  // For text variant, explicitly remove border
  ...(variant === 'text' ? {
    border: 'none',
  } : {}),
}
```

**In CSS:**
```css
.cds--btn {
  background-color: var(--button-bg, var(--recursica-ui-kit-components-button-color-layer-0-variant-solid-background, var(--cds-button-primary))) !important;
  color: var(--button-color, var(--recursica-ui-kit-components-button-color-layer-0-variant-solid-text, var(--cds-button-text-primary))) !important;
}

.cds--btn > svg:first-child:not(:last-child) {
  width: var(--button-icon-size, 0px) !important;
  margin-right: var(--button-icon-text-gap, 0px) !important;
}
```

## Component-Level CSS Variables

### Variables Set in TSX

| Variable | Purpose | Default |
|---------|---------|---------|
| `--button-bg` | Button background color | From Recursica CSS var |
| `--button-color` | Button text color | From Recursica CSS var |
| `--button-icon-size` | Icon width/height | `0px` (when no icon) |
| `--button-icon-text-gap` | Gap between icon and text | `0px` (when no icon) |
| `--button-content-max-width` | Maximum content width | From UIKit.json |

### Variables Used in CSS

All component-level variables are used in CSS with Recursica CSS variables and Carbon variables as fallbacks:

```css
/* Example: Background and text color with proper fallback chain */
.cds--btn {
  background-color: var(--button-bg, var(--recursica-ui-kit-components-button-color-layer-0-variant-solid-background, var(--cds-button-primary))) !important;
  color: var(--button-color, var(--recursica-ui-kit-components-button-color-layer-0-variant-solid-text, var(--cds-button-text-primary))) !important;
}

/* Example: Icon sizing */
.cds--btn > svg:first-child:not(:last-child) {
  width: var(--button-icon-size, 0px) !important;
  margin-right: var(--button-icon-text-gap, 0px) !important;
}
```

## CSS Variable Fallback Chain

```
Component Style (TSX)
  ↓
--button-* (Component-level custom properties)
  ↓
--recursica-ui-kit-components-button-* (Primary Recursica vars)
  ↓ (if not defined)
--recursica-brand-* (Brand vars)
  ↓ (if not defined)
--cds-button-* (Carbon library vars - fallback only)
  ↓ (if not defined)
Carbon default styles
```

**Note**: Carbon CSS variables are now used **only as fallbacks** in CSS, not directly modified. This follows the correct pattern.

## Coverage Checklist

- [x] All color variables use Recursica vars with Carbon vars as fallbacks
- [x] All size variables use Recursica vars
- [x] Component-level custom properties are properly scoped
- [x] No direct modification of library CSS variables ✅ (Fixed)
- [x] All CSS variables from JSON files are namespaced with `--recursica-*`
- [x] Library variables are only used as fallbacks in `var()` functions
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
grep -r "var(--cds-" src/components/adapters/carbon/Button/
```

**Result**: `--cds-button-primary` and `--cds-button-text-primary` found, used only as fallbacks in CSS. ✅

### Find Recursica CSS Variables

```bash
# Find all Recursica CSS variables
grep -r "var(--recursica-" src/components/adapters/carbon/Button/
```

**Result**: Multiple Recursica CSS variables found, all properly namespaced. ✅

### Check for Direct Library Variable Modification

```bash
# Find any direct library variable assignments (should be none)
grep -r "'--cds-" src/components/adapters/carbon/Button/
```

**Result**: No direct assignments found. ✅ (Fixed - previously had direct assignments, now removed)

### Verify CSS Variable Usage

```bash
# Check that all Recursica vars are used with Carbon fallbacks
grep -r "var(--recursica-.*var(--cds-" src/components/adapters/carbon/Button/
```

**Result**: Carbon vars used as fallbacks in CSS. ✅

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

Screenshots should be captured for each test case to ensure visual consistency with Mantine and Material UI implementations.

## Recommendations

1. ✅ All critical CSS variables are covered
2. ✅ Carbon CSS variables are used only as fallbacks (fixed)
3. ✅ Component-level custom properties are properly scoped
4. ✅ No direct library variable modification (fixed)
5. ✅ All CSS variables follow the correct namespace pattern

## Issues Found and Fixed

### Issue #1: Direct Carbon Variable Modification (FIXED)

**Previous Implementation** (❌ Incorrect):
```typescript
'--cds-button-primary': `var(${buttonBgVar})`,
'--cds-button-text-primary': `var(${buttonColorVar})`,
```

**Current Implementation** (✅ Correct):
```typescript
// In TSX
'--button-bg': `var(${buttonBgVar})`,
'--button-color': `var(${buttonColorVar})`,

// In CSS
background-color: var(--button-bg, var(--recursica-ui-kit-components-button-color-..., var(--cds-button-primary))) !important;
```

**Status**: ✅ Fixed - Carbon variables are now used only as fallbacks in CSS, not directly modified.

### Issue #2: Border Handling (FIXED)

**Previous Implementation** (❌ Incorrect):
- Text variant had borders
- Outline variant did not have borders

**Current Implementation** (✅ Correct):
- **Outline variant**: Explicitly sets `border: 1px solid` using outline-text CSS variable color
- **Text variant**: Explicitly sets `border: 'none'` to ensure no border
- Border color uses the outline-text CSS variable
- CSS rules added to enforce: `.cds--btn--secondary` and `.cds--btn--tertiary`

**Status**: ✅ Fixed - Border handling now correctly matches expected behavior.

### Issue #3: Elevation Support (ADDED)

**New Feature**:
- Added `elevation` prop support that applies box-shadow using brand elevation CSS variables
- Elevation is read from alternative layer properties if `alternativeLayer` prop is set, otherwise uses component-level `elevation` prop
- Elevation-0 does not apply any box-shadow
- Uses brand elevation CSS variables: `--recursica-brand-{mode}-elevations-elevation-{n}-{property}`

**Status**: ✅ Implemented - Elevation support added to all Button implementations.

## TSX to CSS Migration Opportunities

### High Priority

1. **Inline Style Properties in `style` prop** (Lines 95-175 in Button.tsx)
   - **Current**: Direct style properties like `backgroundColor`, `color`, `fontSize`, `fontWeight`, `height`, `minWidth`, `paddingLeft`, `paddingRight`, `borderRadius`, `display`, `alignItems`, `justifyContent` are set inline
   - **Recommendation**: Move to CSS using component-level CSS variables and data attributes
   - **Impact**: Reduces TSX complexity, improves maintainability, better separation of concerns
   - **Migration**: 
     - Set CSS variables in TSX (already done for most)
     - Add CSS rules using data attributes: `[data-variant]`, `[data-size]`, `[data-disabled]`, `[data-icon-only]`
     - Example: Most properties can be moved to CSS, only keep dynamic values in TSX

2. **Variant-Based Border Styles** (Lines 108-115 in Button.tsx)
   - **Current**: Conditional border styles in `style` prop
   - **Recommendation**: Use CSS attribute selectors `[data-variant='outline']` and `[data-variant='text']`
   - **Impact**: Cleaner TSX, better separation of concerns
   - **Migration**: Already partially done in CSS (lines 51-58 in Button.css), but still in `style` prop

3. **Disabled State Styles** (Lines 131-141 in Button.tsx)
   - **Current**: Disabled state overrides in `style` prop
   - **Recommendation**: Move to CSS using `:disabled` or `[data-disabled]` selectors
   - **Impact**: Reduces conditional logic in TSX
   - **Migration**: Use CSS `:disabled` pseudo-class with `!important` if needed

### Medium Priority

1. **Icon-Only Button Centering** (Lines 120-122 in Button.tsx)
   - **Current**: Conditional `justifyContent: 'center'` in `style` prop
   - **Recommendation**: Use CSS selector for icon-only state
   - **Impact**: Cleaner TSX
   - **Migration**: Use `:not(:has(> svg))` or data attribute

2. **Elevation Box Shadow Calculation** (Lines 142-175 in Button.tsx)
   - **Current**: Complex box-shadow calculation in TSX with elevation parsing
   - **Recommendation**: Could use CSS custom properties for elevation, but complexity may justify TSX
   - **Impact**: Low - logic is complex and dynamic, CSS would require many variables
   - **Status**: Acceptable to keep in TSX due to complexity

### Low Priority

1. **Flex Layout Properties** (Lines 117-118 in Button.tsx)
   - **Current**: `display: flex` and `alignItems: center` in `style` prop
   - **Recommendation**: Move to CSS
   - **Impact**: Minimal - simple properties
   - **Status**: Low priority but easy win

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

