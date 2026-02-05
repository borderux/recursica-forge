# Toolbar Modules Testing Guide

## Overview

This document provides testing guidelines for the new reusable toolbar modules. All modules follow the same pattern as `TextStyleToolbar` and are automatically detected by `PropControlContent`.

## Modules to Test

### 1. BorderGroupToolbar
**Components:** Button, Chip, Badge, TextField, Menu, Accordion, SegmentedControl, SegmentedControlItem

**Test Cases:**
- [ ] Open Button component toolbar, click "Border" prop
- [ ] Verify "Size" slider appears and updates border-size CSS var
- [ ] Verify "Corner radius" dimension selector appears and updates border-radius CSS var
- [ ] Verify "Color" palette control appears (for Button/Chip with border-color)
- [ ] Change border size and verify visual update in preview
- [ ] Change border radius and verify visual update in preview
- [ ] Change border color (if applicable) and verify visual update
- [ ] Test with different style variants (solid, outline, text)
- [ ] Test with different size variants (small, default, large)

### 2. PaddingGroupToolbar
**Components:** Chip, Badge, MenuItem, Menu, SegmentedControl, Accordion

**Test Cases:**
- [ ] Open Chip component toolbar, click "Padding" prop
- [ ] Verify "Horizontal padding" dimension selector appears
- [ ] Verify "Vertical padding" dimension selector appears
- [ ] Change horizontal padding and verify visual update
- [ ] Change vertical padding and verify visual update
- [ ] Test with different style variants
- [ ] Test with different size variants

### 3. WidthGroupToolbar
**Components:** Button, Chip, MenuItem, Menu, Accordion, Toast

**Test Cases:**
- [ ] Open Button component toolbar, click "Width" prop
- [ ] Verify "Min width" dimension selector appears
- [ ] Verify "Max width" dimension selector appears
- [ ] For Toast, verify "Min height" also appears
- [ ] Change min-width and verify visual update
- [ ] Change max-width and verify visual update
- [ ] Test with different variants

### 4. ElevationToolbar
**Components:** Button, Chip, Badge, Avatar, Toast, MenuItem, Menu, Accordion, AccordionItem

**Test Cases:**
- [ ] Open Button component toolbar, click "Elevation" prop
- [ ] Verify segmented control with elevation options appears
- [ ] Change elevation and verify visual update (shadow changes)
- [ ] Test with different style variants
- [ ] Verify elevation 0 removes shadow

### 5. BackgroundToolbar
**Components:** Button, Chip, Badge, Avatar, Toast, MenuItem, Menu, AccordionItem, SegmentedControl, SegmentedControlItem

**Test Cases:**
- [ ] Open Button component toolbar, click "Background" prop
- [ ] Verify color palette control appears
- [ ] Change background color and verify visual update
- [ ] For MenuItem, verify "Selected background" also appears
- [ ] Test with different style variants
- [ ] Test with different layers (layer-0, layer-1, etc.)

### 6. IconGroupToolbar
**Components:** TextField, Toast, Chip, SegmentedControlItem

**Test Cases:**
- [ ] Open TextField component toolbar, click "Icon" prop (if available)
- [ ] Open Toast component toolbar, click "Icon" prop
- [ ] Verify "Icon size" dimension selector appears
- [ ] Verify "Icon-text gap" dimension selector appears
- [ ] For Chip, verify icon color controls appear (leading-icon-color, close-icon-color)
- [ ] Change icon size and verify visual update
- [ ] Change icon-text gap and verify visual update
- [ ] Change icon colors (if applicable) and verify visual update

## Common Test Scenarios

### Variant Selection
- Test that modules correctly update CSS vars for selected variants
- Verify that changing variants updates the toolbar controls to show correct values
- Ensure variant-specific props are correctly resolved

### Layer Selection
- Test that color-related modules respect selected layer
- Verify that changing layers updates the toolbar controls
- Ensure layer-specific CSS vars are correctly updated

### CSS Variable Updates
- Verify that all changes dispatch `cssVarsUpdated` events
- Check that components re-render when CSS vars change
- Verify that CSS vars are correctly formatted and applied

### Edge Cases
- Test with components that don't have all props (e.g., Badge without border-color)
- Test with components that have nested groups (e.g., SegmentedControl container/selected)
- Test with components that have variant-specific props
- Test with components that have multiple icon types (e.g., Chip with leading and close icons)

## Expected Behavior

1. **Automatic Detection:** Modules should automatically be used when prop name matches (border, padding, width, elevation, background, icon)
2. **Grouped Props:** Modules should detect grouped props from toolbar config
3. **Variant Awareness:** Modules should respect selected variants and update accordingly
4. **Layer Awareness:** Color-related modules should respect selected layer
5. **Visual Updates:** All changes should immediately reflect in component previews

## Known Limitations

- Some components may have unique prop structures that require component-specific handling
- Icon groups vary significantly between components (some have colors, some don't)
- Background groups may have different structures (e.g., MenuItem has selected-background)

## Reporting Issues

When reporting issues, include:
1. Component name
2. Prop name
3. Expected behavior
4. Actual behavior
5. Steps to reproduce
6. Browser console errors (if any)
