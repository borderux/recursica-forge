---
name: component-development
description: >
  Scaffold and wire a new Recursica Forge UI component across Mantine, Material UI,
  and Carbon: tokens, adapter, library implementations, CSS overrides, registry,
  toolbar, preview, sidebar, tests, and audits. Use when adding a new component,
  creating an adapter, implementing a library variant, or the user runs
  /component-development. Triggers: "add a new component", "create an adapter",
  "add X to the UI kit", "new Mantine/Material/Carbon component", "scaffold a
  component". Not for syncing an existing component after token edits (use the
  orchestrator pipeline in .agents/skills/).
---

# Add a Recursica Forge component

Execute this workflow to add a component. Do not skip steps. Do not invent a parallel structure.

**Source of truth** (patterns, CSS-var formulas, token value rules, toolbar modules, audits, completion checklist):

`src/components/COMPONENT_DEVELOPMENT_GUIDE.md`

Read the matching guide section before each step. Clone the closest existing component; default neighbor is **Button**. File touch-list: `references/file-map.md`.

Supported kits: Mantine (`@mantine/core`), Material UI (`@mui/material`), Carbon (`@carbon/react`).

## 0. Intake

Collect only what is missing, then proceed:

| Field | Example | Notes |
|---|---|---|
| PascalCase name | `TextField` | Adapter, registry, filenames |
| kebab-case ui-kit key | `text-field` | `recursica_ui-kit.json` |
| Sidebar label | `Text field` | Title Case, extra words lowercase |
| URL slug | `text-field` | kebab-case |
| Neighbor to clone | `Button` | Closest visual/behavioral match |
| Style variants | `solid`, `outline` | From `variants.styles` |
| Size variants | `default`, `small` | From `variants.sizes` |
| Family members | Item / Group / Header | Add each as its own component |

Abort if the name already exists in `src/components/registry/types.ts`.

Read before writing code:

1. Neighbor adapter + one library folder (`tsx` + `css`)
2. Neighbor `*.toolbar.json` and ui-kit entry
3. Guide: Quick Start + the step you are on

## Non-negotiables

- Use the adapter in `src/components/adapters/{ComponentName}.tsx`. Never drop raw Mantine/MUI/Carbon into previews or toolbars.
- CSS overrides only — never restyle by rewriting library markup/structure.
- Most styles are direct `var(--recursica-…)` references. Reactive `useState`/`useEffect` only for **elevation** (box-shadow) and **text styles**.
- Token `$value`s are `{brand.*}` / `{tokens.*}` aliases, not hex or literal dimensions. Exceptions and color-key suffix rules live in the guide (`Property Value Guidelines`, DTCG `-color` suffix).
- Toolbar modules (`border`, `padding`, `width`, `elevation`, `background`, `icon`) auto-detect from prop names — do not reinvent those controls. Toolbar sliders use the `Slider` adapter.
- All three libraries ship together. Preview, sidebar `baseComponents`, toolbar config, and toolbar tests are mandatory.

## Workflow

### 1. Tokens — `recursica_ui-kit.json`

Add `ui-kit.components.{kebab}`. Shape:

- Colors: `variants.styles.{variant}.properties.colors.{layer}.{property}`
- Sizes: `variants.sizes.{variant}.properties.{property}`
- Shared: `properties.{property}`

Layer color keys use the `-color` suffix (`text-color`, `icon-color`, `border-color`). No `{brand.themes.light.*}` refs.

If the neighbor has no `variants.styles` (Switch) or nested style variants (Avatar), copy that neighbor's token shape instead of Button.

Validate before adapters:

```bash
npx tsx .agents/scripts/verify-workspace.ts
```

### 2. Adapter — `src/components/adapters/{ComponentName}.tsx`

Unified props + `useComponent('{ComponentName}')` + `Suspense`. Pass `layer`, `elevation`, variant/size, and `LibrarySpecificProps` (`mantine` / `material` / `carbon`) through.

Helpers: `src/components/utils/cssVarNames.ts`, `src/components/utils/brandCssVars.ts`.

### 3. Library implementations — all three kits in parallel

```
src/components/adapters/{mantine|material|carbon}/{ComponentName}/
  {ComponentName}.tsx
  {ComponentName}.css
```

Map unified variants onto the library's API. Set component CSS custom properties from Recursica vars; use library vars only as `var(--recursica-…, var(--library-…))` fallbacks. Import the CSS file from the TSX.

### 4. Preview + catalog

Required:

- `src/modules/components/{ComponentName}Preview.tsx` — use the adapter, honor `selectedVariants` / `selectedLayer` / `componentElevation`
- Lazy import + render branch in `src/modules/preview/ComponentDetailPage.tsx`
- Section entry in `src/modules/preview/componentSections.tsx`
- Sidebar: add `{ name, url }` to `baseComponents` in `src/modules/preview/ComponentsSidebar.tsx` (mandatory even if ui-kit already maps it)

### 5. Register

- `src/components/registry/types.ts` — add to `ComponentName`
- `src/components/registry/{mantine,material,carbon}.ts`:

```ts
registerComponent('mantine', '{ComponentName}', () =>
  import('../adapters/mantine/{ComponentName}/{ComponentName}'))
```

### 6. Toolbar

- `src/modules/toolbar/configs/{ComponentName}.toolbar.json` — every ui-kit prop gets icon + label; group related props. Icons are Phosphor names from `src/modules/components/iconLibrary.ts`.
- Register import + `switch` case in `src/modules/toolbar/utils/loadToolbarConfig.ts` (kebab-case and spaced-lowercase keys).
- New text group names (not already in the list): add to **both** `textPropertyGroupNames` arrays in `PropControlContent.tsx` and `componentToolbarUtils.ts`.

### 7. Tests (mandatory)

Clone the neighbor. Minimum:

| File | What it proves |
|---|---|
| `src/modules/toolbar/configs/__tests__/{ComponentName}.toolbar.test.ts` | JSON valid; every ui-kit prop is in the toolbar config |
| `src/components/adapters/__tests__/{ComponentName}.test.tsx` | Adapter renders through the registry |
| `src/components/adapters/__tests__/{ComponentName}.toolbar.test.tsx` | CSS vars from the toolbar actually restyle the component (guide-mandatory) |

Prefer a passing DataGrid-style config test over a skipped Button-style integration test. If you skip the adapter toolbar test, say so in the report and why.

```bash
npx vitest run src/modules/toolbar/configs/__tests__/{ComponentName}.toolbar.test.ts src/components/adapters/__tests__/{ComponentName}.test.tsx
```

### 8. Audits (recommended)

One file per library:

`src/components/adapters/{library}/{ComponentName}/{ComponentName}.{library}.audit.md`

Template: guide → **Audit File Template**.

### 9. Verify

```bash
npx tsx .agents/scripts/verify-workspace.ts
```

Then targeted vitest (step 7). Exercise the preview at `/components/{slug}` in all three kits: variants, sizes, layers, disabled, toolbar color/dimension edits.

If tokens/helpers/docs drifted beyond this component, run the matching `.agents/skills/` agent (dtcg-compliance, css-vars-sync, toolbar-configurator, qa-automation). Do not run the orchestrator for a greenfield add unless the user asks.

## Done when

Guide **Essential Checklist** is complete (`src/components/COMPONENT_DEVELOPMENT_GUIDE.md` → Component Checklist). Report: name, neighbor cloned, files written, tests run, remaining gaps.
