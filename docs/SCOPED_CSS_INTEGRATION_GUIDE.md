# Integrating `recursica_variables_scoped.css` into a component

Audience: an engineer who has been given the generated `recursica_variables_scoped.css` and must style a component with it, in any framework or component library. Nothing here depends on a particular library.

The file is generated. Do not edit it or override its variables. To change a value, change the Recursica JSON source and re-export.

This guide matches transform version 1.8.0, which is stated at the top of the file. The same steps are summarised in the file's header comment, under "Importing this CSS into a component".

## 1. Load it and set the theme

1. Load the file once, globally, before your component styles.
2. Set `data-recursica-theme="light"` or `data-recursica-theme="dark"` on `<html>`. Without it, the theme-dependent names below resolve to nothing.
3. Optional: set `data-recursica-layer="0|1|2|3"` on a wrapper element. Descendants follow that layer. With no layer set, layer 0 applies.

Switching the theme or layer needs no change in your component. The values follow the attributes on its ancestors.

## 2. Use only generic variable names

The file defines every value under a full-path name on `:root`, and then defines short generic names inside the theme and layer blocks that alias the right one. Your CSS reads only generic names.

- Generic (use): `--recursica_ui-kit_components_button_properties_height`, `--recursica_brand_layer_properties_surface`
- Specific (never use in component CSS): any name containing `_modes_light_`, `_modes_dark_` or a pinned layer such as `_layer_0_` or `_layers_layer-0_`
- Variant-specific (never use): names containing `_variants_`, such as `..._variants_styles_solid_...`. Read the stable root name instead (section 3).

Some component values depend on the layer (for example a surface or border colour). The export writes each of them directly in the matching theme and layer block, under the generic name, so there is nothing extra to read: the generic name follows the layer of the nearest ancestor that sets `data-recursica-layer`.

Do not write selectors that match `data-recursica-theme` or `data-recursica-layer` in component CSS. The cascade already resolves the generic name.

## 3. Component contract: stable root names

For each component the export defines the stable root names `--recursica_ui-kit_components_<component>_properties_<property>` (for example `..._button_properties_height`, `..._colors_background-color`, `..._text_font-size`). **These are the only names your component reads.** You never reference a variant-specific name such as `..._variants_styles_solid_...`.

The root names get their values from rules keyed on data attributes. You select the variant by setting attributes on the component's root element.

| Attribute | Meaning |
|---|---|
| `data-recursica="<component>"` | Required. Names the component, so rules for one component never match another that has the same axis names. |
| `data-recursica-<axis>="<value>"` | One per variant axis, named after the axis (for example `-styles`, `-sizes`, `-content`). Set it on every render. An axis nested under another (Button `sizes` under `content`) uses the same attribute, so set it once. |
| `data-recursica-<state>` | Present (no value) while the state applies. Currently `disabled` is the one that is emitted for Button. |

Example for a button:

```html
<button data-recursica="button"
        data-recursica-styles="solid"
        data-recursica-sizes="small"
        data-recursica-content="icon-only"
        data-recursica-disabled>
```

```css
.my-button {
  height: var(--recursica_ui-kit_components_button_properties_height);
  background: var(--recursica_ui-kit_components_button_properties_colors_background-color);
  color: var(--recursica_ui-kit_components_button_properties_colors_text-color);
}
```

### Rules to follow

- **There are no defaults.** If an axis attribute is missing or has a value the export does not know, no rule matches and the root names that axis owns are undefined. Always set every axis.
- **Each property has one owner.** One axis (or the component itself) defines a given property, so axes never compete. Only states override, and they win by specificity and are emitted last, in the fixed priority `visited`, `active`, `error`, `disabled` (highest last).
- **Some properties exist only in a state.** For example Button `opacity` is defined only for `disabled`. When the state is not set, the name is undefined, so use a fallback in your CSS: `opacity: var(--..._properties_opacity, 1)`.
- **A `null` in the JSON is exported as an explicit value** by type: colour `transparent`, dimension `0px`, elevation `none`, number `0`.
- **Disabled is an attribute.** The export emits only `data-recursica-disabled`. Connect your own disabled mechanism to it (set the attribute when the component is disabled). Do not rely on `:disabled` or `aria-disabled` selectors for Recursica values.
- **Visited is both.** The export emits `data-recursica-visited` and `:visited` in the same rule, so either works.
- **Native state works without the attribute.** The export matches the browser's own state in the same rule as the attribute: `aria-expanded` (`accordion-header`), `aria-selected` (`tabs-item`), and `input:checked` / `input:indeterminate` (`checkbox`, `radio-button`, `chip`, `switch`). All are wrapped in `:where()`, so specificity equals the attribute form and states still win. **For input-based controls the `data-recursica` root must contain the native `<input>` as a descendant (any depth).** A control whose root is a sibling of its input (for example a switch whose root is the track) must move the root to the wrapper, or keep setting `data-recursica-selection-states`. The attribute selectors keep working. Not covered: `segmented-control-item`, tree, menu-item and timeline bullet, whose selection comes from application state.
- **Hover, focus and pressed treatments are global.** They come from the brand-level names described in the header comment of the CSS file, not from per-component names. The adapter has to track hover itself and apply `--recursica_brand_states_hover_*`; the export emits no hover selector.
- **Modal and Panel are layer-0, and portaled content resolves under the root layer.** Both overlay the page, so the ui-kit defines only `layer-0` for them (their backgrounds already point at layer-1's surface, so they read as raised). A portal renders at the end of `<body>`, outside any wrapper, so keep `data-recursica-layer="0"` and `data-recursica-theme` on `<html>` or `<body>`, not only on an inner wrapper. A layer set only on a wrapper does not reach portaled content.
- **The DatePicker dropdown reuses other contracts.** `date-picker` names cover the input field only. The calendar dropdown takes its surface, border, radius and elevation from the `hover-card-popover` names, shared with HoverCard and Popover, so it looks like those popovers. Its day cells and navigation arrows use the `button` contract.
- **Pagination reuses the `button` contract.** Active pages, inactive pages and prev/next controls use `button` variants at the small size. Pagination's own names are only `item-gap` and `dots-color`. The dots take their size from `button`; there are no Pagination-specific sizing names.
- **Form controls do not change per layer in light mode.** Checkbox and TextField backgrounds follow the global form-field value, and Checkbox borders and ticks follow the `interactive` core colour, so light-mode values are identical across layers 0-3. This is intended. The one layer-aware value is Checkbox's checked `icon-color` (layer-1).
- **The Dropdown menu uses `menu-item` values.** The option list in a Dropdown takes its item styling, including the disabled state, from the `menu-item` contract. `dropdown` names cover the field only, plus `option-disabled-opacity` as the global-disabled opacity.
- **Close buttons in Modal and Panel are the adapter's job.** The ui-kit has no close-button names. The adapter builds the close button from the Recursica `button` contract.

## 4. Adding or changing variants needs no component change

A new value on an axis (for example a new style) is a new rule in the CSS file keyed on `data-recursica-<axis>="<new value>"`. Your component keeps reading the same root names, so only the attribute value you pass changes.

## 5. Checklist

- [ ] The file is loaded once and `data-recursica-theme` is set on `<html>`.
- [ ] The component root sets `data-recursica="<component>"` and every axis attribute.
- [ ] Disabled (and any other emitted state) is mapped to its `data-recursica-<state>` attribute.
- [ ] The CSS reads only `--recursica_ui-kit_components_<component>_properties_*` (plus brand generic names where noted).
- [ ] No specific or variant-specific names (`_modes_*`, `_layer_N_`, `_variants_*`) and no selectors on the theme or layer attributes.
- [ ] State-only properties have a fallback.
- [ ] Checked in both themes and in layers 0 to 3.

## 6. Current scope

The component contract is emitted for every component that has variants, not only Button. Components with no variant that defines a property (for example Segmented Control, whose variants are empty) have no contract and read their component-level names directly. A component can also keep a base value on its root with a `disabled` or `error` state overriding it; the contract only re-points the name inside the state block.
