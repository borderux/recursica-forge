---
"recursica-forge": patch
---

Fix invisible MenuItem text in layer-2 and layer-3 contexts (e.g., overlay opacity dropdown). The `unselected-item.opacity` values were `null`, resolving to `0` and making menu items fully transparent. Set to `1` for both layers.
