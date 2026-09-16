---
"recursica-forge": patch
---

- **Scoped CSS Header & Variable Guidance**:
  - Corrected generic brand layer variable examples in the Scoped CSS export header comment (`formatScopedCss`) to reference the layer-agnostic form `--recursica_brand_layer_properties_surface` instead of the pinned `--recursica_brand_layer_0_properties_surface`.
  - Documented the distinction between layer-agnostic variables that dynamically adapt to ancestor layer contexts and pinned layer-specific variables (`--recursica_brand_layer_N_*`).

- **Documentation Variable Name & Path Validation**:
  - Added `docsVarNames.test.ts` to ensure all markdown documentation, component guides, and agent instructions reference valid CSS variable names according to current export and in-app naming schemes.
  - Added automated checks ensuring documentation links point to existing files and do not recommend deprecated utilities (`getComponentCssVar`).
  - Added snapshot notices to historical component adapter audit documents.

- **Layer Cascade Test Coverage**:
  - Added tests in `layerCascade.test.ts` verifying that layer-agnostic brand variable names correctly track active cascading layers and default to layer 0 on elements with a theme/mode set without an explicit layer attribute.
