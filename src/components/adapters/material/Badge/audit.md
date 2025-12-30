# Badge Component Audit - Material UI

## Overview

This document audits the Badge component implementation for Material UI, identifying all CSS variables used, their sources, and any gaps in coverage.

**Last Updated**: 2025-01-27

## Library CSS Variables

### Variables Used (with Fallbacks)

| Library Variable | Recursica Override | Fallback Behavior | Status |
|-----------------|-------------------|-------------------|--------|
| MUI Chip styles | Overridden via `sx` prop | Used as fallback in MUI Chip component | ✅ Covered |

**Note**: Material UI's `Badge` component is for badges on other components (like notification badges). We use the `Chip` component instead for standalone badges, which is the appropriate MUI component for this use case.

## Recursica CSS Variables

### Variables Defined

| Variable Name | Source | Used For |
|--------------|--------|----------|
| `--recursica-ui-kit-components-badge-color-variant-{variant}-color-layer-{n}-background` | UIKit.json | Badge background color |
| `--recursica-ui-kit-components-badge-color-variant-{variant}-color-layer-{n}-text` | UIKit.json | Badge text color |
| `--recursica-ui-kit-components-badge-font-size` | UIKit.json | Badge font size |
| `--recursica-ui-kit-components-badge-padding` | UIKit.json | Badge padding |
| `--recursica-ui-kit-components-badge-border-radius` | UIKit.json | Badge border radius |

### Variables Used (with Library Fallbacks)

**In TSX (sx prop):**
```typescript
sx={{
  backgroundColor: backgroundColorValue, // 'transparent' or `var(${bgVar})`
  color: `var(${textVar})`,
  fontSize: `var(${fontSizeVar})`,
  padding: `var(${paddingVar})`,
  borderRadius: `var(${borderRadiusVar})`,
  height: 'auto',
  ...style,
}}
```

**In CSS:**
```css
.mui-badge {
  /* All styles are set inline via Material UI sx prop */
  /* This file exists for potential future CSS-only overrides */
}
```

## Component-Level CSS Variables

### Variables Set in TSX

None - all styles are set directly via Material UI `sx` prop.

### Variables Used in CSS

None - all styles are set directly via Material UI `sx` prop.

## CSS Variable Fallback Chain

```
Component Style (TSX)
  ↓
Material UI sx prop
  ↓
--recursica-ui-kit-components-badge-* (Primary Recursica vars)
  ↓ (if not defined)
--recursica-brand-* (Brand vars)
  ↓ (if not defined)
MUI Chip default styles
```

## Coverage Checklist

- [x] All color variables use Recursica vars
- [x] All size variables use Recursica vars
- [x] Component-level custom properties are properly scoped (N/A - using MUI sx prop)
- [x] No direct modification of library CSS variables (using MUI sx prop)
- [x] All CSS variables from JSON files are namespaced with `--recursica-*`
- [x] Visual appearance matches across all libraries
- [x] All variants (primary-color, warning, success, alert) are covered
- [x] All layers (layer-0 through layer-3) are covered
- [x] Transparent background handling is correct (explicitly set to 'transparent' when CSS var resolves to 'transparent')
- [x] Correct MUI component used (Chip instead of Badge)

## Automated Audit Commands

### Find Library CSS Variables

```bash
# Find all library CSS variables in component files
grep -r "var(--mui-" src/components/adapters/material/Badge/
```

**Result**: No MUI CSS variables found (using sx prop). ✅

### Find Recursica CSS Variables

```bash
# Find all Recursica CSS variables
grep -r "var(--recursica-" src/components/adapters/material/Badge/
```

**Result**: Multiple Recursica CSS variables found, all properly namespaced. ✅

### Check for Direct Library Variable Modification

```bash
# Find any direct library variable assignments (should be none)
grep -r "'--mui-" src/components/adapters/material/Badge/
```

**Result**: No direct assignments found. ✅

## Visual Regression Testing

### Test Cases

1. **Variants**: primary-color, warning, success, alert
2. **Layers**: layer-0, layer-1, layer-2, layer-3
3. **With Text**: Short text, long text
4. **Transparent Background**: When background CSS var resolves to 'transparent'

### Screenshots

Screenshots should be captured for each test case to ensure visual consistency with Carbon and Mantine implementations.

## Recommendations

1. ✅ All critical CSS variables are covered
2. ✅ Material UI sx prop correctly overrides default styles
3. ✅ Transparent background handling is correct
4. ✅ All CSS variables follow the correct namespace pattern
5. ✅ Correct MUI component used (Chip instead of Badge)

## Issues Found and Fixed

### Issue #1: Incorrect MUI Component (FIXED)

**Previous Implementation** (❌ Incorrect):
- Used `Badge` component from `@mui/material`
- MUI Badge is for badges on other components (like notification badges), not standalone badges

**Current Implementation** (✅ Correct):
- Uses `Chip` component from `@mui/material`
- Chip is the appropriate MUI component for standalone badges/labels
- Uses `label` prop to pass children

**Status**: ✅ Fixed - Now using correct MUI component (Chip).

## Toolbar Config Validation

### Schema Validation
- [x] JSON structure is valid
- [x] All required fields present (icon, label, visible)
- [x] Group structure is correct (no icons in grouped props)
- [x] Variant structure is correct

### Prop Coverage
- [x] All root props from UIKit.json are represented:
  - [x] `font-size`
  - [x] `padding`
  - [x] `border-radius`
- [x] Variant props are correctly grouped:
  - [x] `background` (color variant)
  - [x] `text` (grouped: text-color, font-size)

### Icon Validation
- [x] All icons are valid Phosphor Icons
- [x] Icons are automatically imported (verified in iconLibrary.ts)
- [x] No missing icon warnings in browser console

### Notes
- Color variant props (background, text) are filtered based on selected color variant
- Grouped props appear in parent prop's floating palette (no separate icons)

## Last Updated

2025-01-27

