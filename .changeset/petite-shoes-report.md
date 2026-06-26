---
"recursica-forge": patch
---

Added keyboard accessibility improvements across various components:
- Fixed an issue where sliders lost focus on keyboard interaction by converting inline dimension slider components to a stable generic component in `PropControlContent`.
- Restored visible focus outlines for Accordion components (Mantine, Carbon, and Material) using `:focus-visible`.
- Added keyboard interaction support (`Enter`/`Space`) and focus styling for the color picker control and color swatches in `PaletteSwatchPicker` and `PaletteColorControl`.
