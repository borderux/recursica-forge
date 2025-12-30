# Toast Component Audit - Material UI

## Overview

This document audits the Toast component implementation for Material UI, identifying all CSS variables used, their sources, and any gaps in coverage.

**Last Updated**: 2025-01-27

## Library CSS Variables

### Variables Used (with Fallbacks)

| Library Variable | Recursica Override | Fallback Behavior | Status |
|-----------------|-------------------|-------------------|--------|
| N/A | N/A | Material UI Paper component uses Recursica CSS variables | ✅ Covered |

**Note**: Material UI CSS variables are not directly used. The component uses Recursica CSS variables with component-level custom properties that are then applied via CSS overrides.

## Recursica CSS Variables

### Variables Defined

| Variable Name | Source | Used For |
|--------------|--------|----------|
| `--recursica-ui-kit-components-toast-color-layer-{n}-variant-{variant}-background` | UIKit.json | Toast background color |
| `--recursica-ui-kit-components-toast-color-layer-{n}-variant-{variant}-text` | UIKit.json | Toast text color |
| `--recursica-ui-kit-components-toast-color-layer-{n}-variant-{variant}-button` | UIKit.json | Toast button color (success/error variants) |
| `--recursica-ui-kit-components-toast-size-vertical-padding` | UIKit.json | Toast vertical padding |
| `--recursica-ui-kit-components-toast-size-horizontal-padding` | UIKit.json | Toast horizontal padding |
| `--recursica-ui-kit-components-toast-size-min-width` | UIKit.json | Toast minimum width |
| `--recursica-ui-kit-components-toast-size-max-width` | UIKit.json | Toast maximum width |
| `--recursica-ui-kit-components-toast-size-icon` | UIKit.json | Icon size |
| `--recursica-ui-kit-components-toast-size-spacing` | UIKit.json | Gap between elements |
| `--recursica-ui-kit-components-toast-elevation` | UIKit.json | Toast elevation (component-level) |
| `--recursica-brand-{mode}-layer-layer-alternative-{key}-property-surface` | Brand.json | Alternative layer surface |
| `--recursica-brand-{mode}-layer-layer-alternative-{key}-property-element-text-color` | Brand.json | Alternative layer text color |
| `--recursica-brand-{mode}-layer-layer-alternative-{key}-property-element-interactive-tone` | Brand.json | Alternative layer button color |
| `--recursica-brand-{mode}-elevations-elevation-{n}-x-axis` | Brand.json | Elevation shadow x-axis offset |
| `--recursica-brand-{mode}-elevations-elevation-{n}-y-axis` | Brand.json | Elevation shadow y-axis offset |
| `--recursica-brand-{mode}-elevations-elevation-{n}-blur` | Brand.json | Elevation shadow blur radius |
| `--recursica-brand-{mode}-elevations-elevation-{n}-spread` | Brand.json | Elevation shadow spread radius |
| `--recursica-brand-{mode}-elevations-elevation-{n}-shadow-color` | Brand.json | Elevation shadow color |

### Variables Used (with Library Fallbacks)

**In TSX (sx prop):**
```typescript
'--toast-bg': `var(${toastBgVar})`
'--toast-text': `var(${toastTextVar})`
'--toast-button': `var(${toastButtonVar})`
'--toast-vertical-padding': `var(${verticalPaddingVar})`
'--toast-horizontal-padding': `var(${horizontalPaddingVar})`
'--toast-min-width': `var(${minWidthVar})`
'--toast-max-width': `var(${maxWidthVar})`
'--toast-icon-size': `var(${iconVar})`
'--toast-spacing': `var(${spacingVar})`
boxShadow: (when elevation is set)
```

**In CSS:**
```css
.recursica-toast {
  padding: var(--toast-vertical-padding, var(--recursica-ui-kit-components-toast-size-vertical-padding)) var(--toast-horizontal-padding, var(--recursica-ui-kit-components-toast-size-horizontal-padding)) !important;
  min-width: var(--toast-min-width, var(--recursica-ui-kit-components-toast-size-min-width)) !important;
  max-width: var(--toast-max-width, var(--recursica-ui-kit-components-toast-size-max-width)) !important;
  background-color: var(--toast-bg, var(--recursica-ui-kit-components-toast-color-layer-0-variant-default-background)) !important;
  color: var(--toast-text, var(--recursica-ui-kit-components-toast-color-layer-0-variant-default-text)) !important;
}
```

## Component-Level CSS Variables

### Variables Set in TSX

| Variable | Purpose | Default |
|---------|---------|---------|
| `--toast-bg` | Toast background color | From Recursica CSS var |
| `--toast-text` | Toast text color | From Recursica CSS var |
| `--toast-button` | Toast button color (for close button) | From Recursica CSS var (success/error variants) |
| `--toast-vertical-padding` | Toast vertical padding | From UIKit.json |
| `--toast-horizontal-padding` | Toast horizontal padding | From UIKit.json |
| `--toast-min-width` | Toast minimum width | From UIKit.json |
| `--toast-max-width` | Toast maximum width | From UIKit.json |
| `--toast-icon-size` | Icon width/height | `0px` (when no icon) |
| `--toast-spacing` | Gap between elements | `0px` (when no icon/action) |
| `boxShadow` (inline style) | Elevation shadow (when elevation prop is set) | Built from brand elevation CSS vars |

### Variables Used in CSS

```css
.recursica-toast-icon {
  width: var(--toast-icon-size, var(--recursica-ui-kit-components-toast-size-icon)) !important;
  height: var(--toast-icon-size, var(--recursica-ui-kit-components-toast-size-icon)) !important;
}

.recursica-toast-content {
  gap: var(--toast-spacing, var(--recursica-ui-kit-components-toast-size-spacing)) !important;
}
```

## CSS Variable Fallback Chain

```
Component Style
  ↓
--recursica-ui-kit-components-toast-... (Primary)
  ↓ (if not defined)
Component-level custom property (--toast-*)
  ↓ (if not defined)
Browser default
```

## Coverage Checklist

- [x] All color variables use Recursica vars
- [x] All size variables use Recursica vars
- [x] Component-level custom properties are properly scoped
- [x] No direct modification of library CSS variables
- [x] All CSS variables from JSON files are namespaced with `--recursica-*`
- [x] Elevation support implemented
- [x] Alternative layer support implemented
- [x] All variants (default, success, error) supported
- [x] All layers (layer-0 through layer-3) supported

## TSX to CSS Migration Opportunities

### Current Implementation

The current implementation uses CSS custom properties set in TSX (via `sx` prop) and referenced in CSS, which is the recommended pattern. All styling logic is properly separated between TSX (CSS variable setup) and CSS (style application).

### Recommendations

- ✅ Current implementation follows best practices
- ✅ CSS custom properties are used for dynamic values
- ✅ All styling is in CSS files, not inline styles (except for elevation box-shadow which is dynamic)

## Recommendations

1. ✅ All critical CSS variables are covered
2. ✅ Component-level custom properties are properly scoped
3. ✅ No direct library variable modification
4. ✅ Implementation follows the component development guide
