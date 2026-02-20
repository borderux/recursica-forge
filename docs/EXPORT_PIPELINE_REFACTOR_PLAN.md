# Export Pipeline Refactor Plan

## Goal
Produce CSS from JSON via self-contained transforms. Each transform is a single file with zero dependencies on the rest of the codebase — copyable to another project, or eventually a standalone npm package. JSON is the source; transforms output CSS.

## Export Format Philosophy

The exported CSS is **not** tied to Forge's internal naming. It is a clean, new format designed for consumers.

### Design Principles

1. **Simple path-to-name mapping**: JSON paths map directly to CSS variable names. Path segments joined with underscores. Example: `tokens.colors.scale-02.500` → `--recursica_tokens_colors_scale-02_500`.

2. **References stay as references**: A JSON reference like `{brand.palettes.neutral.100.color.tone}` is output as `var(--recursica_brand_palettes_neutral_100_color_tone)` — pointing to another CSS var in the same output. No resolution to hex or px. This creates the layered/Compose-style cascade consumers expect.

3. **Specific vs Scoped**: 
   - **Specific**: All vars on `:root`. No selectors, no data attributes. One flat block.
   - **Scoped**: Vars grouped by theme/layer using `[data-recursica-theme]` and `[data-recursica-layer]` selectors. Var names omit theme/layer; the selector provides context.

4. **Validation**: All values are validated before output. References must target existing vars (with path-alias resolution, e.g. kebab↔camel). Numbers must be finite; dimensions must have valid value/unit. Invalid data is collected; the transform throws once with the complete list. Each error includes the JSON path where the problem was found and a message describing it.

5. **Layer-specific ui-kit (authoring rule)**: Any layer-specific ui-kit variable (path contains `.layer-N.` for N = 0,1,2,3) must be **defined for every layer** in the JSON. The same canonical property (e.g. `border-color`) must appear under `layer-0`, `layer-1`, `layer-2`, and `layer-3` with explicit values. If a layer has no visible effect (e.g. no border in layer-0), set an explicit value such as `transparent` or the appropriate token—do not omit the key. The scoped transform validates this and fails with clear errors if a canonical name appears in only some layers.

   **When to use layer blocks vs not (JSON structure):**
   - **Brand**: Put tokens under `brand.themes.{light|dark}.layers.layer-N.*` only when the value **varies by elevation layer** (layer 0 = base surface, 1–3 = raised surfaces). Examples: surface color, border-color, elements.text.color, elements.interactive.tone — each layer has its own. Theme-level tokens that don’t depend on elevation (e.g. palettes, elevation definitions, typography, dimensions) stay **outside** layer blocks: `brand.themes.{light|dark}.palettes.*`, `brand.typography.*`, `brand.dimensions.*`.
   - **UIKit**: Put a property inside a `layer-0` … `layer-3` group when it **references `brand.layers.layer-N.*`** or when its value should **differ by elevation layer**. Examples: button background (refs `brand.layers.layer-0.elements.interactive.tone` in layer-0, etc.) → use layer blocks; form field background, icon, text-valued (ref surface/text per layer) → use layer blocks. Keep properties **outside** layer blocks when they are the same for all layers or don’t depend on elevation: e.g. `border-size`, dimensions, typography, or refs to `brand.palettes.*`, `brand.dimensions.*`, `tokens.*`.
   - **Rule of thumb**: If the token’s value or ref changes when the component is on layer-0 vs layer-1 vs layer-2 vs layer-3, it belongs in a layer block. If it’s the same regardless of layer, it doesn’t.

6. **Elevation composites**: Elevations (box-shadow) have parts x, y, blur, spread, color. We emit both the individual part vars (from normal traversal) and a composite var per elevation. The composite is built from var refs to the parts: `var(--recursica_..._x) var(--recursica_..._y) var(--recursica_..._blur) var(--recursica_..._spread) var(--recursica_..._color)`. Refs like `{brand.elevations.elevation-2}` point to the composite. Consumers can override individual parts and the composite picks up changes. This is the only composite value type in the output.

### CSS Header Documentation

Each exported CSS file includes a header explaining:
- How var names are derived from JSON paths
- That refs output as `var(--recursica_...)` to other vars
- Specific: all on `:root`, no scoping
- Scoped: usage of `data-recursica-theme` and `data-recursica-layer`

---

## What We're Building

Two transforms. Each is a **single file** with **no imports** from the project. Portable to another project or npm package.

**Filenames:**
- `recursicaJsonTransformSpecific.ts` — produces specific CSS
- `recursicaJsonTransformScoped.ts` — produces scoped CSS

**Exported function (same name in both files):**
```ts
export function recursicaJsonTransform(json: {
  tokens: object
  brand: object
  uikit: object
}): Array<{ filename: string; contents: string }>
```

- **Specific transform**: Outputs `recursica_variables_specific.css` — all vars in `:root` with full path-derived names.
- **Scoped transform**: Outputs `recursica_variables_scoped.css` — vars in `:root`, `[data-recursica-theme]`, `[data-recursica-layer]` blocks.
- Each output CSS file is standalone (no `@import`).

---

## Implementation: Self-Contained Transforms

### Zero dependencies
Each transform file:
- Has **no `import`** statements from the project
- Can be copied to another project and run on their JSON
- Future: will become a standalone npm package

### What each transform does

1. **Traverse** — Walk the JSON, collect path/value pairs. Path = key path from root (e.g. `tokens.colors.scale-02.500`). Value = leaf ($value when present, else primitive).

2. **Path → var name** — `path` → `--recursica_` + segments joined by `_`. Segments may contain dashes (e.g. `scale-02`).

3. **Value formatting** — Literals (hex, number, string) formatted for CSS. References `{path.to.thing}` → `var(--recursica_path_to_thing)`. Context-aware expansion for theme-relative refs (e.g. `brand.palettes.X` in light context → `brand.themes.light.palettes.X`).

4. **Validation** — Before output: every reference targets an emitted var; every value is valid for its type. Collect all errors; throw once with `{ path, message }[]`.

5. **Format** — Specific: one `:root { ... }`. Scoped: group by path (theme/layer), emit in appropriate blocks.

### Specific transform (`recursicaJsonTransformSpecific.ts`)
- Traverse JSON, collect vars, format values (refs as var())
- Validate refs and values
- Output single `:root { ... }` block
- Returns `[{ filename: 'recursica_variables_specific.css', contents }]`

### Scoped transform (`recursicaJsonTransformScoped.ts`)
- Same traversal and value handling
- Group vars by theme/layer from path
- Output `:root` + theme selectors + layer selectors + theme+layer selectors
- Returns `[{ filename: 'recursica_variables_scoped.css', contents }]`

### Error handling

On validation failure, throw an error whose message includes all collected errors:
```
Transform validation failed (N errors):
  brand.themes.light.layers.layer-0.elements.interactive.tone: Reference '{brand.palettes.foo}' targets non-existent var --recursica_brand_palettes_foo
  tokens.colors.scale-99.500: Invalid color value
```

---

## Wire New Pipeline

### Export flow
1. Export JSON: `exportTokensJson()`, `exportBrandJson()`, `exportUIKitJson()`
2. Combine: `{ tokens, brand, uikit }`
3. Run transforms:
   - `recursicaJsonTransform` from `recursicaJsonTransformSpecific.ts` → specific CSS
   - `recursicaJsonTransform` from `recursicaJsonTransformScoped.ts` → scoped CSS
4. Download/zip as today

### `downloadJsonFiles` updates
- When CSS is selected: call the appropriate transform(s) with the exported JSON instead of `exportCssStylesheet()`
- Keep same filenames and zip structure

### Deprecation
- `exportCssStylesheet()` can be refactored to call the transforms or deprecated.

---

## Testing

### Unit tests
- `recursicaJsonTransformSpecific.test.ts`: Known JSON → CSS; assert structure, var count, sample values
- `recursicaJsonTransformScoped.test.ts`: Same; assert scoped structure (selectors, grouping)
- Tests can import only the transform file (no other project deps needed)

### Integration / snapshot tests
- Export current app state to JSON
- Run both transforms on that JSON
- Compare output to current `exportCssStylesheet()` output
- Allow for minor differences (comments, sort order) — critical is same variables and values

### Portability test
- Copy transform file + test + fixture JSON to a fresh directory
- Run with no other project files — should produce correct CSS

---

## File Layout (Proposed)

```
src/core/export/
  recursicaJsonTransformSpecific.ts   # Self-contained; no project imports
  recursicaJsonTransformSpecific.test.ts
  recursicaJsonTransformScoped.ts     # Self-contained; no project imports
  recursicaJsonTransformScoped.test.ts
  EXPORT_FILENAMES.ts                # For download/zip (filename constants)
  jsonExport.ts                      # Unchanged
  ...
```

---

## Risks & Mitigations

1. **Duplicated logic**: Resolution logic (tokens, palettes, layers, uikit) must be copied into each transform. No sharing with existing resolvers. Risk: divergence if resolvers change. Mitigation: tests assert parity with current export.
2. **Complexity in one file**: Each transform will be large (all resolution + format + naming). Mitigation: clear internal structure with comments; that's the tradeoff for portability.
3. **Naming rules**: `internalNameToPath` and `pathToExportedName` logic must be duplicated. Schema rules (font subcategories, color levels, etc.) live in the transform.

---

## Success Criteria
- Each transform file has zero `import` from the project
- `recursicaJsonTransform` from each file produces CSS matching current `exportCssStylesheet()` output (modulo cosmetic differences)
- Transform + test + fixture can be copied to another project and run
- Full test coverage; portability test passes
