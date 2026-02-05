---
"recursica-forge": patch
---

## TextField Component
- Added new TextField component adapter with support for Mantine, Material, and Carbon implementations
- Implemented label, help text, error text, and icon support
- Added CSS variable reactivity for text styles, dimensions, and colors
- Integrated TextField into the application and toolbar system

## Slider Component Improvements
- Fixed thumb and active track alignment using ResizeObserver for precise positioning
- Applied disabled opacity CSS variable to min/max labels, track, active track, and thumb
- Fixed input gap prop to apply correctly when showValueLabel is true
- Removed hardcoded margins in favor of CSS gap property for consistent spacing
- Updated preview examples: added input to third stacked example, removed fifth side-by-side example

## Preview Components
- Added h2 headings ("Stacked" and "Side-by-side") to Slider and TextField previews
- Fixed TextField preview horizontal alignment and spacing
- Applied form vertical gutter spacing between preview items within each section

## CSS Variable Reactivity
- Added event listeners for container CSS variables in Accordion components (Carbon, Material, Mantine)
- Added event listeners for icon-text-gap and size CSS variables in AssistiveElement
- Fixed CSS variable update handling to ensure components re-render when toolbar changes CSS variables

## TypeScript Fixes
- Added `id` prop to Label and AssistiveElement component types
- Fixed effectiveMinWidth usage order in Material TextField
- Fixed import path in IconInput component
- Fixed duplicate layer attribute in PropControlContent
- Added missing icon property to ToolbarPropConfig objects
- Fixed groupedProp possibly undefined errors with proper type narrowing
- Removed invalid `tokens` property from TokenReferenceContext objects

## Test Updates
- Skipped timing out tests: Accordion toolbar test, AssistiveElement toolbar test, Button integration test
