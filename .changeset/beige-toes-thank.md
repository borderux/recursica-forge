---
"recursica-forge": patch
---

Add Hover Card / Popover component

- New component: Hover Card / Popover with shared UIKit styling (`hover-card-popover`) backed by two separate adapter components (HoverCard and Popover)
- Adapter implementations for all three shells: Mantine, Material UI, and Carbon
- Supports configurable beak (arrow pointer), border, colors, padding, elevation, min/max width, and content text styling
- Preview page with two static examples (with and without beak) and interactive HoverCard/Popover triggers
- Toolbar configuration with Beak, Border, Colors, Content text, Elevation, Padding, and Sizes sections
- Component-to-kebab-case name mapping fix for `hover-card-/-popover` → `hover-card-popover` in CSS variable path generation, toolbar content text lookup, and reset-to-defaults logic
- Beak horizontally centered with proper border-aware positioning
- Removed `beak-inset` property from UIKit, toolbar, and both Mantine adapters
