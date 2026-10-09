# Recursica Manifest (`recursica_manifest.json`)

The manifest is a small, export-only subset of `recursica_tokens.json`, `recursica_brand.json` and `recursica_ui-kit.json`, for tooling that needs a few cross-cutting facts without parsing all three files. It is never re-imported, so it has no migration burden. It ships alongside the other exports and carries the same version.

- **Schema:** `schemas/manifest.schema.json` (JSON Schema draft-07, validated in `src/vars/validateSchemas.test.ts`).
- **Code:** `src/core/export/manifestExport.ts` and `src/core/export/manifestExtractors/`.
- **Export selection:** "Manifest (subset for tooling)" in the export modal. It is built from the already-exported tokens, brand and ui-kit JSON, so it cannot drift from them.

## Shape

The manifest keeps the same paths as its sources, pruned to the paths an extractor picked. A concern with nothing to report is simply absent.

```json
{
  "tokens": { "breakpoints": { "<name>": { } } },
  "brand": {
    "layout-grids": { "<name>": { } },
    "breakpoints": { "<name>": { } }
  },
  "ui-kit": { "components": { "<component>": { } } },
  "$extensions": {
    "recursica.metadata": { "exportedAt": "2026-10-01T23:00:00.000Z", "version": "1.2.3" }
  }
}
```

All of `tokens`, `brand` and `ui-kit` are optional. `$extensions["recursica.metadata"]` is always present. Nothing else is allowed at the root.

## Concerns

Each concern is one extractor. Values are copied verbatim from the source path unless the extractor declares a `transform`; the validator re-applies the transform to the source and fails the export if the manifest differs.

### Component variant references (`componentVariantReferences`)

Every token under `ui-kit.components` that carries `$extensions["recursica.component"]`: a property whose `$value` references another component's whole group, with `selected-variants` pinning which variants to use. This is "a component that uses a specific variant of another component", for example pagination's active pages using a solid, small button.

**Transform:** each `selected-variants` reference is reduced to its last segment, so `{ui-kit.components.button.variants.styles.solid}` becomes `solid`. A value that is not a `{...}` reference is left as is.

```json
"ui-kit": { "components": { "pagination": { "properties": { "active-pages": {
  "$value": "{ui-kit.components.button}",
  "$extensions": { "recursica.component": { "selected-variants": { "style": "solid", "size": "small" } } }
} } } } }
```

These tokens produce no CSS variable in the exported stylesheets (`collectVars` skips them), so the manifest is the only place downstream tooling can read them.

### Breakpoints (`breakpoints`)

Copied verbatim:
- every `brand.layout-grids.<name>`, including `default`. A non-default grid with a `min-width` and/or `max-width` is a breakpoint. Both are unitless pixel numbers;
- `tokens.breakpoints.<name>` and `brand.breakpoints.<name>` when present: the sparse per-breakpoint override trees (for example `brand.breakpoints.mobile.typography.h1.fontSize`).

The CSS exports turn the same data into `@media` blocks. A grid's condition comes from its widths, for example `(min-width: 481px) and (max-width: 1080px)`. The manifest carries the raw source, not a computed condition string.

## Adding a concern

1. Add an extractor in `src/core/export/manifestExtractors/` that returns the source paths to pick, with an optional pure `transform`.
2. Register it in `MANIFEST_EXTRACTORS` in `manifestExport.ts`.
3. Extend `schemas/manifest.schema.json` for the new paths and add a case to the manifest tests in `src/vars/validateSchemas.test.ts`.

The schema is closed (`additionalProperties: false` at every named level), so a new concern that is not in it fails validation.
