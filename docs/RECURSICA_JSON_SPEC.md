# Recursica JSON Spec

This document describes the JSON structure of Recursica design token files and their alignment with the [Design Tokens Community Group (DTCG) Format Module](https://www.designtokens.org/TR/2025.10/format/) (e.g. 2025.10).

## Reference

- **DTCG Format Module**: [Design Tokens Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/)
- **Recursica export files**: `recursica_tokens.json`, `recursica_brand.json`, `recursica_ui-kit.json`
- **Schemas** (for validation): `tokens.schema.json`, `brand.schema.json`, `uikit.schema.json`

---

## 1. DTCG fundamentals

### Token vs group

- **Token**: Any JSON object that has a **`$value`** property. The object's key is the token name; `$value` holds the value (literal or reference).
- **Group**: Any JSON object that does **not** have a `$value` property. Groups contain nested groups and/or tokens. They provide hierarchy only; tools must not infer type or purpose from group names.

So: **presence of `$value` ⇒ token; absence ⇒ group.**

### Reserved properties (DTCG)

| Property      | Applies to | Purpose |
|---------------|------------|--------|
| **`$value`**  | Token      | Required. The token's value (literal or alias). |
| **`$type`**    | Token, Group | Optional. Token type (e.g. `color`, `dimension`, `number`) or default type for a group. |
| **`$description`** | Token, Group | Optional. Plain string description. |
| **`$extensions`**  | Token, Group | Optional. Vendor-/tool-specific data. Must be preserved by other tools. |
| **`$deprecated`**  | Token, Group | Optional. `true`, `false`, or string explanation. |
| **`$extends`**     | Group      | Optional. Inherit from another group (reference syntax). |

All other keys (e.g. `alias` on color scale groups) are non-reserved and treated as group/token names or custom metadata.

### Naming rules (DTCG)

- Token and group **names** (object keys) must **not** start with `$`.
- Names must **not** contain `{`, `}`, or `.` (period).  
  (Dots are used only in **paths** when referencing, e.g. `{brand.palettes.neutral.050}`.)
- Names are case-sensitive.

### References (aliases)

- **Curly-brace syntax**: `"{path.to.token}"` — a string value that references another token by path. The path is built from group and token names joined by `.`. References resolve to the referenced token's `$value`; resolution must follow the spec (e.g. no circular references).
- **Target**: References must target **whole tokens** (objects with `$value`), not groups. The path must resolve to an object that has a `$value` property. Do not reference a group or an intermediate path that has no `$value`.
- **Fully qualified paths (DTCG-aligned)**: We encourage **fully qualified** references — complete paths to the token that holds the value. For example: `{brand.themes.light.palettes.neutral.200.color.tone}`, `{tokens.sizes.3x}`, `{brand.themes.dark.palettes.palette-1.600.color.on-tone}`. No special or shorthand refs; the path should unambiguously identify the token. This aligns with DTCG and keeps resolution explicit.

#### Exception: theme-agnostic refs allowed in ui-kit

Strict DTCG alignment would use fully qualified brand paths (including theme). In **recursica_ui-kit.json** only, we **allow** theme-agnostic brand references (e.g. `{brand.palettes.neutral.100.color.tone}` instead of `{brand.themes.light.palettes.neutral.100.color.tone}`) so that a single ui-kit file can be resolved against any theme at runtime. This is a pragmatic exception, not the preferred pattern elsewhere; the brand file and general guidance should use fully qualified refs to values (tokens), not groups, and should not rely on special ref forms outside the ui-kit.

---

## 2. File roles and top-level structure

| File | Root key | Role |
|------|----------|------|
| **recursica_tokens.json** | `tokens` | Primitive design tokens: color scales, sizes, font, opacities. No theme or layer. |
| **recursica_brand.json** | `brand` | Theme-aware brand: themes (e.g. light/dark), layers, palettes, dimensions, elevations, states, text-emphasis. References `tokens.*` and `brand.*` paths. |
| **recursica_ui-kit.json** | `ui-kit` | Component-level design: globals (form, icon, etc.) and per-component properties/variants. References `brand.*` and `tokens.*`. |

All three are valid JSON and follow the same token/group and reference rules above.

---

## 3. recursica_tokens.json (`tokens`)

- **Groups**: e.g. `colors`, `font`, `sizes`, `opacities`; under `colors`, scale groups like `scale-01`, `scale-02`, etc.
- **Tokens**: Objects with `$type` and `$value`.
- **Types used**: `color`, `dimension`, `number`, `string`, `fontFamily`.
- **Typical patterns**:
  - Color: `"$type": "color", "$value": "#hex"`.
  - Dimension: `"$type": "dimension", "$value": { "value": 8, "unit": "px" }`.
  - Font family: `"$type": "fontFamily", "$value": ["Lexend", "sans-serif"]` with optional `$extensions` (e.g. `com.google.fonts`).
- **Custom group metadata**: Color scale groups may have a non-reserved `alias` (e.g. `"alias": "cornflower"`) for display; this does not conflict with DTCG.

This file has no theme or layer structure; it is the shared primitive token set.

---

## 4. recursica_brand.json (`brand`)

- **Main groups**: `themes`, and under each theme (e.g. `light`, `dark`): `layers` (e.g. `layer-0`, `layer-1`), `palettes`, `elevations`, `states`, `text-emphasis`, `dimensions` (at theme or brand level as per schema), etc.
- **Tokens**: Any object with `$value` is a token. Prefer **fully qualified** references (e.g. `{brand.themes.light.palettes.neutral.200.color.tone}`) so paths resolve to tokens, not groups, in line with DTCG.
- **Types used**: `color`, `number`, `dimension`, `elevation` (composite), and composite values (e.g. dimension with `value` + `unit`, where `value` can be a reference string like `"{tokens.sizes.2x}"`).
- **Palettes**: Nested structure (e.g. `palettes.neutral.050.color.tone` / `on-tone`); each leaf that has `$value` is a token. Each palette may have a `default` key (with `color.tone` and `color.on-tone`) so that the ui-kit, when using its allowed theme-agnostic refs, can reference e.g. `{brand.palettes.palette-1.default.color.on-tone}`.

This file is theme- and layer-aware; references should be fully qualified to tokens.

---

## 5. recursica_ui-kit.json (`ui-kit`)

- **Groups**: `globals` (e.g. `form`, `icon`), `components` (e.g. `button`, `text-field`). Under components: `variants` (e.g. `styles`, `sizes`), `properties`, and nested groups (e.g. `colors`, `size` by layer or variant).
- **Tokens**: Any object with `$value` is a token. Values typically reference brand or tokens.
- **Theme-agnostic refs allowed**: In this file we **allow** theme-agnostic brand references (e.g. `{brand.palettes.neutral.000.color.tone}`, `{brand.palettes.palette-1.default.color.on-tone}`) so one ui-kit can be resolved against any theme. This is an exception to the preference for fully qualified refs; elsewhere we encourage full paths to tokens, not groups, and no special ref forms.
- **Types used**: `color`, `dimension`, `number`, `string`. Dimension values may be `{ "value": "{...}", "unit": "px" }` with a reference inside `value`.
- **Component structure**: Layer- and variant-specific tokens live under paths like `components.button.variants.styles.solid.properties.colors.layer-0.background`.

This file defines component-level design tokens; references point at `brand.*` and `tokens.*` (theme-agnostic brand refs permitted here only).

---

## 6. Summary table (DTCG alignment)

| Aspect | DTCG (Format 2025.10) | Recursica |
|--------|------------------------|-----------|
| Token definition | Object with `$value` | Same |
| Group definition | Object without `$value` | Same |
| Reserved properties | `$value`, `$type`, `$description`, `$extensions`, `$deprecated`, `$extends` | Same; all others (e.g. `alias`) are custom |
| Name restrictions | No `$`, `{`, `}`, `.` in names | Same (dots only in paths) |
| References | Curly-brace `{path.to.token}`; target whole tokens | Same; encourage fully qualified refs to tokens (not groups); no special ref forms in general |
| Brand refs in ui-kit | — | Exception: theme-agnostic refs allowed in ui-kit only (so one ui-kit works with any theme); brand and rest use fully qualified where possible |
| Type inheritance | Optional `$type` on group; token can inherit | Used where applicable (e.g. font group `$type`) |
| Extensions | `$extensions` for vendor/tool data | Used (e.g. `com.google.fonts` in recursica_tokens.json) |

Recursica aims to adhere to the DTCG Format Module: tokens and groups are distinguished by `$value`, naming and reserved properties follow the spec, and references use the specified curly-brace syntax targeting whole tokens (not groups). We encourage fully qualified refs and avoid special ref forms except in the ui-kit, where theme-agnostic brand refs are allowed so one ui-kit can work with any theme. The three files split responsibilities (primitives, brand/theme/layer, component design) while sharing the same token/group and reference rules.
