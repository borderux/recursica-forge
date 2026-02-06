---
"recursica-forge": patch
---

## Elevation System Fixes

- Fixed elevation bugs and CSS variable handling
- Improved elevation control type safety and indexing
- Updated elevation-related components and styles

## Accordion Component

- Split single `background` property into `background-collapsed` and `background-expanded` properties
- Added new "Item background" group in toolbar with "Collapsed" and "Expanded" labels
- Applied background colors to entire accordion item container (not just header) for all UI kits (Mantine, Material, Carbon)
- Updated Accordion CSS variable tests

## Label Component Improvements

- Fixed `min-height` property to work correctly for both `stacked` and `side-by-side` layouts
- Added `min-height` property to stacked layout variant in UIKit.json
- Hidden `bottom-padding` property for `side-by-side` variant in toolbar
- Fixed CSS variable application order and reactivity for Material UI, Mantine, and Carbon implementations
- Improved layout-specific style handling and CSS variable declarations

## Slider Component Fixes

- Fixed slider container rendering and CSS variable handling
- Improved top-bottom margin handling for both layout variants
- Fixed active track width calculations and ResizeObserver usage
- Enhanced slider preview and value display functionality

## TextField Component

- Fixed layout-specific property handling (max-width, width for stacked vs side-by-side)
- Improved CSS variable declarations and reactivity
- Fixed label gutter handling for side-by-side layout

## Button Component

- Fixed button styling and CSS variable application
- Improved button CSS for all UI kits

## Chip Component

- Updated Chip component styling and CSS variable handling across all UI kits

## Toolbar & Controls

- Fixed toolbar property visibility based on component variants
- Improved property control rendering and type checking
- Added support for top-bottom-margin property controls
- Fixed dimension slider ranges and property comparisons

## UI Kit Selector

- Disabled UI kit selector (Mantine/Material/Carbon) but kept it visible
- Defaulted to Mantine UI kit
- Maintained programmatic kit switching capability for tests

## Code Quality & Bug Fixes

- Removed debugging console statements added during development
- Fixed TypeScript errors across multiple components (Slider, TextField, Label, varsStore)
- Fixed CSS variable declaration order and scope issues
- Improved type safety for elevation controls and property comparisons
- Fixed test failures and improved test coverage
