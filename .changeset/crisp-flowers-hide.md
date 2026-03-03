---
"recursica-forge": patch
---

Add Loader component with Mantine, Material UI, and Carbon adapters

- Implement Loader component with three loader types (oval, bars, dots) displayed side by side
- Add size variants (small, default, large) with per-variant size, thickness, and border-radius controls
- Add toolbar configuration with indicator color picker, size slider (8–100px), thickness slider (1–30px), and border-radius token selector
- Add preview component rendering all three sizes with H2 headings
- Override Mantine v7 hashed class names via CSS to apply thickness and border-radius to internal loader elements
- Fix pre-existing `Corners` icon import bug in iconLibrary (replaced with `CornersIn`)
- Add Loader toolbar integration tests
