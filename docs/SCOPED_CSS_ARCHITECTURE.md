# Scoped CSS Architecture

This document defines the architecture and rules for the **scoped** CSS transform (`recursicaJsonTransformScoped.ts`). The scoped output is the primary consumer-facing CSS: one file that contains both a full variable set on `:root` and theme/layer blocks that provide generic names for cascading.

## Design goal

- **All variables resolve at `:root`.** Every value (including cross-layer references like modal in layer-0 using layer-1 surface) can resolve because the specific (full-path) variables are defined on `:root`.
- **Theme and layer blocks only add generic names** that alias to those root variables. No variable is *defined* only in a block with a value that references something not in scope. So we avoid “layer-specific ui-kit at root doesn’t resolve” and “modal in layer-0 references layer-1 which isn’t in the block.”
- **Cascading** is achieved by setting one generic name per semantic in each theme+layer block, pointing at the appropriate root variable. Components use the generic name; the selector (theme/layer) determines which root value they get.

## Two naming tiers

### 1. Specific names (on `:root`)

- **Full path** from JSON, no stripping of theme or layer.
- Examples:
  - `brand.themes.light.layers.layer-0.properties.surface` → `--recursica_brand_themes_light_layers_layer-0_properties_surface`
  - `brand.themes.dark.layers.layer-1.elements.interactive.tone` → `--recursica_brand_themes_dark_layers_layer-1_elements_interactive_tone`
  - `ui-kit.components.Modal.properties.colors.layer-0.background` (per theme) → for each theme, a distinct root name, e.g. `--recursica_ui-kit_themes_light_layer_0_components_Modal_properties_colors_background`, `--recursica_ui-kit_themes_dark_layer_0_...`, etc.
- **Rule:** Every variable that can be referenced (by any other var in the file) must exist on `:root` under this specific name. Refs in values use these specific names so resolution always succeeds at root.

### 2. Generic names (in theme/layer blocks only)

- Theme and layer are **omitted** from the name; the selector provides context.
- Examples:
  - In `[data-recursica-theme="light"][data-recursica-layer="0"]`: `--recursica_brand_layer_0_properties_surface: var(--recursica_brand_themes_light_layers_layer-0_properties_surface);`
  - In the same block: `--recursica_ui-kit_components_Modal_properties_colors_background: var(--recursica_ui-kit_themes_light_layer_0_components_Modal_properties_colors_background);`
- **Rule:** Generic names are **never** defined on `:root`. They are defined only in theme and/or theme+layer blocks. So there is no specificity fight between root and blocks; blocks only alias into root.

## Output structure

### `:root`

- Holds **all** variables with **specific** (full-path) names:
  - Tokens (e.g. `--recursica_tokens_...`)
  - Brand typography, dimensions
  - Brand theme-only (e.g. `--recursica_brand_themes_light_palettes_...`, `--recursica_brand_themes_dark_palettes_...`)
  - Brand per theme+layer (e.g. `--recursica_brand_themes_light_layers_layer-0_...`, `--recursica_brand_themes_dark_layers_layer-1_...`)
  - Ui-kit non–layer-specific (e.g. `--recursica_ui-kit_globals_...`)
  - Ui-kit layer-specific: one var per (theme, layer) with a name that includes theme and layer (e.g. `--recursica_ui-kit_themes_light_layer_0_components_Modal_properties_colors_background`), so cross-layer refs in values point at root and resolve.

### `[data-recursica-theme="light"]` / `[data-recursica-theme="dark"]`

- Only **generic** names that alias to root.
- Theme-only brand (no layer in path): e.g. `--recursica_brand_palettes_neutral_100_...: var(--recursica_brand_themes_light_palettes_neutral_100_...);`
- Optionally, default layer (e.g. layer-0) generic names can be set here so “theme without layer” still resolves; exact behavior is defined by the generator.

### `[data-recursica-theme="light"][data-recursica-layer="N"]` (and equivalent for dark)

- Only **generic** names that alias to root:
  - Brand for that theme+layer: `--recursica_brand_layer_N_...: var(--recursica_brand_themes_light_layers_layer-N_...);`
  - Layer-specific ui-kit (one canonical name per semantic): `--recursica_ui-kit_components_Modal_properties_colors_background: var(--recursica_ui-kit_themes_light_layer_N_components_Modal_properties_colors_background);`
- No values in these blocks reference a variable that is not on root; they only reference specific names on root.

## Rules (summary)

1. **Root has only specific names.** Every variable that appears anywhere in the file as a ref target is defined on `:root` with its full path name (including theme and layer where applicable).
2. **Theme/layer blocks have only generic names.** They never introduce a new value that references a variable not defined on root. They only set `genericName: var(specificNameOnRoot);`.
3. **Generic names are never on root.** This avoids the previous “specificity issues” where root and blocks competed for the same name.
4. **Layer-specific ui-kit on root is per (theme, layer).** So each layer-specific semantic has 2×4 = 8 root vars (light/ dark × layer 0–3). Names include theme and layer (e.g. `--recursica_ui-kit_themes_light_layer_0_...`). Values are formatted with refs resolved to root (specific) names so cross-layer refs (e.g. modal layer-0 → layer-1 surface) resolve at root.
5. **Components use generic names.** In component CSS, reference e.g. `var(--recursica_ui-kit_components_Modal_properties_colors_background)`. The cascade (which theme+layer block the element is under) determines which root value that resolves to.

## Relation to specific CSS

- The **specific** transform is unchanged: it outputs a single file with all vars on `:root` with full path names, no theme/layer selectors.
- The **scoped** transform can be thought of as: “specific-style root (all specific names) + theme/layer blocks that add generic aliases for cascade.” So scoped is a superset of the naming and resolution model of specific, with additional selectors and generic names for consumer convenience. No separate specific CSS file is required for resolution to work; scoped alone is sufficient.

## Generator contract

The scoped generator must:

1. Emit to `:root` every variable with its **specific** (full-path) name and a value in which all `var()` references use only specific names that exist on root.
2. Emit in each theme block only **generic** aliases of the form `genericName: var(specificNameOnRoot);` for theme-only brand (and any default-layer aliases the spec requires).
3. Emit in each theme+layer block only **generic** aliases: brand layer vars and layer-specific ui-kit vars, each set to `var(specificNameOnRoot)`.
4. Never emit a generic name on `:root`.
5. For layer-specific ui-kit, emit on root one variable per (theme, layer) with a specific name that includes theme and layer, and format values so refs (including cross-layer) use root’s specific names.
