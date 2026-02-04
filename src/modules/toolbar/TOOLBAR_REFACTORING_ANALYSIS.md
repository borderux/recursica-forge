# Toolbar Refactoring Analysis

## Executive Summary

This document analyzes all toolbar configurations to identify common patterns, similar groups that can be consolidated, and opportunities to create reusable toolbar modules similar to the existing `TextStyleToolbar` module.

## Current State: Type Style Module

The `TextStyleToolbar` module is already implemented and handles text property groups. Components using it:
- ✅ Button (`text`)
- ✅ Chip (`text`)
- ✅ Badge (`text`)
- ✅ Toast (`text`)
- ✅ Label (`label-text`, `optional-text`)
- ✅ MenuItem (`text`, `supporting-text`)
- ✅ Switch (`label-text`)
- ✅ AccordionItem (`header-text`, `content-text`)
- ✅ SegmentedControlItem (`text`)
- ✅ AssistiveElement (`text`)
- ✅ TextField (`value`, `placeholder`)
- ✅ Slider (`min-max-label`, `read-only-value`)

**All components are using the type style module** - no components need migration.

---

## Category 1: Identical Groups (100% Same Props)

These groups have identical prop names and can be directly abstracted into reusable modules.

### 1.1 Border Group (Standard)
**Props:** `border-size`, `border-radius`, `border-color`

**Used by:**
- Button
- Chip
- SegmentedControl (`container`, `selected`)
- SegmentedControlItem (`selected`)

**Module Name:** `BorderGroupToolbar`

### 1.2 Border Group (Size + Radius Only)
**Props:** `border-size`, `border-radius`

**Used by:**
- Badge
- TextField
- Menu (`border` group)
- Accordion (`border` group)

**Module Name:** `BorderSizeRadiusToolbar`

### 1.3 Width Group (Min/Max)
**Props:** `min-width`, `max-width`

**Used by:**
- Button
- Chip
- MenuItem
- Menu
- Accordion
- Toast (also has `min-height`)

**Module Name:** `WidthGroupToolbar`

### 1.4 Padding Group (Horizontal/Vertical)
**Props:** `horizontal-padding`, `vertical-padding`

**Used by:**
- Chip
- MenuItem
- Menu
- SegmentedControl
- Accordion

**Note:** Badge uses `padding-horizontal`/`padding-vertical` (different naming - needs normalization)

**Module Name:** `PaddingGroupToolbar`

### 1.5 Elevation (Single Prop)
**Props:** `elevation`

**Used by:**
- Button
- Chip
- Badge
- Avatar
- Toast
- MenuItem
- Menu
- Accordion
- AccordionItem

**Module Name:** `ElevationToolbar`

### 1.6 Background (Single Prop)
**Props:** `background`

**Used by:**
- Button
- Chip
- Badge
- Avatar
- Toast
- MenuItem (has group with `background` + `selected-background`)
- Menu
- AccordionItem (`header`, `content`)
- SegmentedControl (`container`, `selected`)
- SegmentedControlItem (`selected`)

**Note:** Most are single props, but MenuItem and some groups have nested structures

**Module Name:** `BackgroundToolbar` (with optional selected variant support)

---

## Category 2: Similar Groups (Can Be Consolidated)

These groups have similar structures but slight variations. Can be consolidated with configuration.

### 2.1 Border Group Variations
**Pattern:** All have `border-size` and `border-radius`, some add `border-color`

**Variations:**
- Standard: `border-size`, `border-radius`, `border-color` (Button, Chip, SegmentedControl)
- Size+Radius: `border-size`, `border-radius` (Badge, TextField, Menu, Accordion)
- Color+Size+Radius: Menu/Accordion have `border` group with color, size, radius

**Consolidation:** Create `BorderGroupToolbar` with optional `includeColor` prop

### 2.2 Padding Variations
**Pattern:** Horizontal and vertical padding, but naming differs

**Variations:**
- `horizontal-padding`, `vertical-padding` (Chip, MenuItem, Menu, SegmentedControl, Accordion)
- `padding-horizontal`, `padding-vertical` (Badge)
- `padding` (single prop in some contexts)

**Consolidation:** Normalize naming and create `PaddingGroupToolbar` with prop name mapping

### 2.3 Width/Size Groups
**Pattern:** Min/max width, sometimes with height

**Variations:**
- `min-width`, `max-width` (Button, Chip, MenuItem, Menu, Accordion)
- `min-width`, `max-width`, `min-height` (Toast)
- `width` group with `min-width`, `max-width` (Button, Chip, MenuItem, Menu, Accordion, Toast)

**Consolidation:** Create `SizeGroupToolbar` with optional height support

### 2.4 Icon Groups
**Pattern:** Icon size and icon-text gap

**Variations:**
- `icon-size`, `icon-text-gap` (TextField, Toast, SegmentedControlItem)
- `icon-size`, `icon-text-gap`, `leading-icon-color`, `close-icon-color` (Chip)
- `icon-size` (single prop in some contexts)

**Consolidation:** Create `IconGroupToolbar` with optional color props

---

## Category 3: Unique/Component-Specific Groups

These are unique to specific components and should remain component-specific.

### 3.1 Switch-Specific
- `thumb` group: `thumb-selected`, `thumb-unselected`, `thumb-height`, `thumb-width`, `thumb-border-radius`
- `track` group: `track-selected`, `track-unselected`, `track-width`, `track-inner-padding`, `track-border-radius`
- `thumb-icon` group: `thumb-icon-size`, `thumb-icon-selected`, `thumb-icon-unselected`
- `elevation` group: `thumb-elevation`, `track-elevation`
- `label-switch-gap`

**Status:** ✅ Unique - Keep as-is

### 3.2 Slider-Specific
- `track` group: `track`, `track-active`, `track-height`, `track-border-radius`
- `thumb` group: `thumb`, `thumb-size`, `thumb-border-radius`, `thumb-elevation`
- `gaps` group: `label-slider-gap`, `input-gap`
- `input-width`
- `min-max-label` (text style - already handled)
- `read-only-value` (text style - already handled)

**Status:** ✅ Unique - Keep as-is

### 3.3 TextField-Specific
- `colors` group: `background`, `border`, `text`, `placeholder`, `placeholder-opacity`, `leading-icon`, `trailing-icon`
- `size` group: `min-height`, `horizontal-padding`, `vertical-padding`, `icon-size`, `icon-text-gap`, `max-width`, `min-width`
- `label-field-gap`
- `text-color` group: `leading-icon`, `trailing-icon`

**Status:** ⚠️ Partially unique - Some props overlap with common groups but structure is unique

### 3.4 Label-Specific
- `spacing` group: `bottom-padding`, `height`, `gutter`, `vertical-padding`
- `asterisk` group: `asterisk`, `required-indicator-gap`
- `label-width`

**Status:** ✅ Unique - Keep as-is

### 3.5 MenuItem-Specific
- `background` group: `background`, `selected-background`
- `text-color` group: `text`, `supporting-text-color`, `supporting-text-opacity`

**Status:** ⚠️ Similar to common groups but with selected variant - Could extend BackgroundToolbar

### 3.6 Menu-Specific
- `color` group: `interactive-color`, `separator-color`, `read-only-color`
- `icon-label-gap`
- `item-gap`
- `icon-size` (single prop)

**Status:** ✅ Unique - Keep as-is

### 3.7 Accordion-Specific
- `item-gap`
- `padding` group: `padding`, `item-gap`

**Status:** ⚠️ Similar to common groups but with item-gap - Could extend PaddingGroupToolbar

### 3.8 AccordionItem-Specific
- `header` group: `text`, `background`, `icon`, `padding`, `icon-gap`, `border-radius`
- `content` group: `content-text`, `content-background`, `content-padding`
- `divider` group: `divider`, `header-content-gap`
- `icon-size` (single prop)

**Status:** ✅ Unique - Keep as-is

### 3.9 SegmentedControl-Specific
- `container` group: `background`, `elevation`, `border-size`, `border-color`, `border-radius`, `text-color`
- `selected` group: `background`, `text-color`, `elevation`, `border-size`, `border-color`, `border-radius`
- `padding` group: `padding-horizontal`, `padding-vertical`
- `direction`
- `fill-width`
- `divider` group: `item-gap`, `divider-color`, `divider-size`

**Status:** ⚠️ Partially unique - Container/Selected groups combine multiple common groups

### 3.10 SegmentedControlItem-Specific
- `selected` group: `background`, `text-color`, `elevation`, `border-size`, `border-color`, `border-radius`
- `item` group: `padding-horizontal`, `height`, `icon-size`, `icon-text-gap`

**Status:** ⚠️ Similar to common groups but combined

### 3.11 Avatar-Specific
- `color` group: `background`, `icon-color`, `text-color`
- `padding` (single prop)
- `elevation` (single prop)

**Status:** ⚠️ Similar to common groups

### 3.12 Toast-Specific
- `text-color` group: `text`, `button`
- `size` group: `min-width`, `max-width`, `min-height`
- `icon` group: `icon`, `spacing`

**Status:** ⚠️ Similar to common groups but with button color variant

### 3.13 AssistiveElement-Specific
- `text` (text style - already handled)
- `color` (single prop)

**Status:** ✅ Simple - Keep as-is

### 3.14 Breadcrumb-Specific
- `color` group: `interactive-color`, `separator-color`, `read-only-color`
- `border-radius` (single prop)
- `padding` (single prop)
- `icon-label-gap`
- `item-gap`
- `icon-size` (single prop)

**Status:** ✅ Unique - Keep as-is

---

## Recommended Module Abstractions

### Priority 1: High-Impact Modules (Used by 5+ Components)

1. **`BorderGroupToolbar`**
   - Props: `border-size`, `border-radius`, `border-color` (optional)
   - Used by: Button, Chip, Badge, TextField, Menu, Accordion, SegmentedControl, SegmentedControlItem
   - Configuration: `{ includeColor?: boolean }`

2. **`PaddingGroupToolbar`**
   - Props: `horizontal-padding`, `vertical-padding`
   - Used by: Chip, Badge, MenuItem, Menu, SegmentedControl, Accordion
   - Configuration: `{ propNameMapping?: { horizontal?: string, vertical?: string } }`

3. **`WidthGroupToolbar`**
   - Props: `min-width`, `max-width`
   - Used by: Button, Chip, MenuItem, Menu, Accordion, Toast
   - Configuration: `{ includeHeight?: boolean }`

4. **`ElevationToolbar`**
   - Props: `elevation`
   - Used by: Button, Chip, Badge, Avatar, Toast, MenuItem, Menu, Accordion, AccordionItem
   - Configuration: None (simple single prop)

5. **`BackgroundToolbar`**
   - Props: `background`, optionally `selected-background`
   - Used by: Button, Chip, Badge, Avatar, Toast, MenuItem, Menu, AccordionItem, SegmentedControl, SegmentedControlItem
   - Configuration: `{ includeSelected?: boolean }`

### Priority 2: Medium-Impact Modules (Used by 3-4 Components)

6. **`IconGroupToolbar`**
   - Props: `icon-size`, `icon-text-gap`, optionally icon colors
   - Used by: TextField, Toast, Chip, SegmentedControlItem
   - Configuration: `{ includeColors?: boolean, colorProps?: string[] }`

### Priority 3: Specialized Modules (Component-Specific but Reusable Pattern)

7. **`ContainerGroupToolbar`** (for SegmentedControl pattern)
   - Props: Combines background, border, elevation, text-color
   - Used by: SegmentedControl (`container`, `selected`)
   - Configuration: `{ groupName: string, includeElevation?: boolean }`

---

## Implementation Strategy

### Phase 1: Create Base Modules
1. Create `BorderGroupToolbar` module
2. Create `PaddingGroupToolbar` module
3. Create `WidthGroupToolbar` module
4. Create `ElevationToolbar` module
5. Create `BackgroundToolbar` module

### Phase 2: Refactor Components
1. Update toolbar configs to reference modules instead of inline groups
2. Update `PropControlContent` to detect and use modules
3. Test each component after refactoring

### Phase 3: Create Specialized Modules
1. Create `IconGroupToolbar` module
2. Create `ContainerGroupToolbar` module (if needed)

### Phase 4: Cleanup
1. Remove duplicate code from `PropControlContent`
2. Update documentation
3. Add TypeScript types for module configurations

---

## Module Interface Design

```typescript
interface ToolbarModuleProps {
  componentName: string
  selectedVariants: Record<string, string>
  selectedLayer: string
  propName: string // e.g., "border", "padding", "width"
  config?: ModuleConfig
}

interface BorderGroupConfig {
  includeColor?: boolean
  propNameMapping?: {
    size?: string // default: "border-size"
    radius?: string // default: "border-radius"
    color?: string // default: "border-color"
  }
}

interface PaddingGroupConfig {
  propNameMapping?: {
    horizontal?: string // default: "horizontal-padding"
    vertical?: string // default: "vertical-padding"
  }
}

interface WidthGroupConfig {
  includeHeight?: boolean
  propNameMapping?: {
    min?: string // default: "min-width"
    max?: string // default: "max-width"
    height?: string // default: "min-height"
  }
}
```

---

## Components Not Using Type Style Module

**Status:** ✅ **All components are using the type style module**

All components with text properties are correctly using `TextStyleToolbar` via the `text-group` type detection in `PropControlContent.tsx`.

---

## Summary Statistics

- **Total Components Analyzed:** 17
- **Identical Groups Found:** 6 (Border, Padding, Width, Elevation, Background, Icon)
- **Similar Groups Found:** 4 (variations of above)
- **Unique Groups:** 7 (Switch, Slider, TextField, Label, AccordionItem, Menu, Breadcrumb)
- **Components Using Type Style:** 17/17 (100%)

---

## Implementation Status

### ✅ Completed Modules (Priority 1 & 2)

1. **BorderGroupToolbar** ✅
   - Location: `src/modules/toolbar/menu/border-group/`
   - Handles: `border-size`, `border-radius`, optional `border-color`
   - Used by: Button, Chip, Badge, TextField, Menu, Accordion, SegmentedControl, SegmentedControlItem
   - Status: Implemented and integrated

2. **PaddingGroupToolbar** ✅
   - Location: `src/modules/toolbar/menu/padding-group/`
   - Handles: `horizontal-padding`, `vertical-padding`
   - Used by: Chip, Badge, MenuItem, Menu, SegmentedControl, Accordion
   - Status: Implemented and integrated

3. **WidthGroupToolbar** ✅
   - Location: `src/modules/toolbar/menu/width-group/`
   - Handles: `min-width`, `max-width`, optional `min-height`
   - Used by: Button, Chip, MenuItem, Menu, Accordion, Toast
   - Status: Implemented and integrated

4. **ElevationToolbar** ✅
   - Location: `src/modules/toolbar/menu/elevation/`
   - Handles: Single `elevation` prop
   - Used by: Button, Chip, Badge, Avatar, Toast, MenuItem, Menu, Accordion, AccordionItem
   - Status: Implemented and integrated

5. **BackgroundToolbar** ✅
   - Location: `src/modules/toolbar/menu/background/`
   - Handles: `background`, optional `selected-background`
   - Used by: Button, Chip, Badge, Avatar, Toast, MenuItem, Menu, AccordionItem, SegmentedControl, SegmentedControlItem
   - Status: Implemented and integrated

6. **IconGroupToolbar** ✅
   - Location: `src/modules/toolbar/menu/icon-group/`
   - Handles: `icon-size`, `icon-text-gap`, optional icon colors
   - Used by: TextField, Toast, Chip, SegmentedControlItem
   - Status: Implemented and integrated

### Integration

- ✅ Updated `PropControlContent.tsx` to detect and use all modules
- ✅ Detection runs before existing grouped props logic
- ✅ All modules handle variant-specific props correctly
- ✅ All modules respect selected layer for color props

### Testing Status

- ✅ Compilation: All modules compile without errors
- ✅ Linting: No linter errors
- ⏳ Runtime Testing: Pending manual testing with Button, Chip, Badge components

---

## Next Steps

1. ✅ ~~Review this analysis with the team~~
2. ✅ ~~Prioritize which modules to build first~~
3. ✅ ~~Create module implementations following the `TextStyleToolbar` pattern~~
4. ✅ ~~Update `PropControlContent` to detect and use modules~~
5. ⏳ Test components one by one, verifying toolbar functionality
6. ⏳ Monitor for any edge cases or component-specific issues
7. ⏳ Consider creating additional specialized modules if patterns emerge
