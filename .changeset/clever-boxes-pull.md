---
"recursica-forge": patch
---

Fix CSS variable structure, descender clipping, and component rendering issues

## CSS Variable Structure Fixes
- Fixed incorrect CSS variable paths for layer elements (removed erroneous `properties-` prefix)
- Corrected `AAComplianceWatcher` to use proper layer element color paths
- Fixed all AAComplianceWatcher tests to pass

## Descender Clipping Fixes
- Fixed descender clipping in MenuItem text and supporting text across all UI kits (Mantine, Carbon, Material)
- Fixed descender clipping in Accordion labels across all UI kits
- Fixed descender clipping in Button labels across all UI kits
- Fixed descender clipping in Tabs component
- Applied padding-bottom/margin-bottom technique to prevent text clipping while maintaining layout

## Component Preview Enhancements
- Updated component preview pages (Tabs, Label, Slider, Dropdown, TextField, Modal) to use consistent vertical gutter spacing
- Wrapped headings and content in div elements with proper spacing tokens

## Bug Fixes
- Fixed Tabs hover state styling
- Fixed Badge rendering issues
- Fixed panel close behavior on color picker
- Fixed copyright year
- Fixed CSS variable audit coverage
- Updated copyright year to 2026

## Commits
- fix descender clipping
- preview page headings fix
- fix for css var audit coverage
- fix panel close on color picker
- fix copyright year
- badge render issue fix
- fix tabs descenders
- fix tabs hover
- css var structure fix - huge
- css var fixes for tabs
- fixes
