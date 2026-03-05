---
"recursica-forge": patch
---

Fix core color management and color scale usage tracking

- Fix theme corruption when changing core colors via the color picker (removed erroneous `$value` wrapper on `core-colors`)
- Fix "Reset all" button for base colors not restoring defaults correctly
- Fix deleted color palettes reappearing when navigating between sections
- Fix color scale deletion not enabling the trash icon for unused scales
- Add "Used in" usage list below each color scale showing where it is referenced (palettes and core colors)
- Style "Used in" label with subtitle typography and usage items as themed links
- Show mode-specific usage labels: usages in both light and dark modes display without a suffix, while single-mode usages show "(Light)" or "(Dark)"
- Clicking a mode-specific usage link navigates to the referenced page and automatically switches the theme mode
