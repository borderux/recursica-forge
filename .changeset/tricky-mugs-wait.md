---
"recursica-forge": patch
---

Added `border-size` and `border-color` properties to the `toast` component. This includes updates to `recursica_ui-kit.json`, rendering support in Carbon, Material, and Mantine adapters, and exposing these properties to the UI via `Toast.toolbar.json`. Additionally, fixed a bug in the toolbar component property parser to correctly resolve the color category for root-level property variables (such as `border-color`), restoring their missing color pickers in the border configuration group.
