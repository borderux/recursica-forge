# File touch-list for a new component

Replace `{ComponentName}` (PascalCase), `{kebab}` (ui-kit key), `{slug}` (URL), `{library}` (`mantine` | `material` | `carbon`).

Rules live in `src/components/COMPONENT_DEVELOPMENT_GUIDE.md`. This file is only paths.

## Create

| Path | Role |
|---|---|
| `recursica_ui-kit.json` → `ui-kit.components.{kebab}` | Tokens |
| `src/components/adapters/{ComponentName}.tsx` | Unified adapter |
| `src/components/adapters/{library}/{ComponentName}/{ComponentName}.tsx` | Kit implementation (×3) |
| `src/components/adapters/{library}/{ComponentName}/{ComponentName}.css` | Kit CSS overrides (×3) |
| `src/components/adapters/{library}/{ComponentName}/{ComponentName}.{library}.audit.md` | Kit audit (×3, recommended) |
| `src/modules/components/{ComponentName}Preview.tsx` | Detail-page preview |
| `src/modules/toolbar/configs/{ComponentName}.toolbar.json` | Toolbar controls |
| `src/modules/toolbar/configs/__tests__/{ComponentName}.toolbar.test.ts` | Toolbar config vs ui-kit |
| `src/components/adapters/__tests__/{ComponentName}.test.tsx` | Adapter unit/render |
| `src/components/adapters/__tests__/{ComponentName}.toolbar.test.tsx` | Toolbar CSS-var integration |

## Edit

| Path | Change |
|---|---|
| `src/components/registry/types.ts` | Add to `ComponentName` |
| `src/components/registry/mantine.ts` | `registerComponent` |
| `src/components/registry/material.ts` | `registerComponent` |
| `src/components/registry/carbon.ts` | `registerComponent` |
| `src/modules/toolbar/utils/loadToolbarConfig.ts` | Import + `switch` case |
| `src/modules/preview/ComponentDetailPage.tsx` | Lazy preview import + render branch |
| `src/modules/preview/componentSections.tsx` | Catalog section |
| `src/modules/preview/ComponentsSidebar.tsx` | `baseComponents` entry |

## Edit only when needed

| Path | When |
|---|---|
| `src/modules/toolbar/menu/floating-palette/PropControlContent.tsx` | New text group name → `textPropertyGroupNames` |
| `src/modules/toolbar/utils/componentToolbarUtils.ts` | Same list, keep in sync |
| `src/modules/components/iconLibrary.ts` | Icon used in toolbar is not already exported |
| `src/components/utils/cssVarNames.ts` | New CSS-var helper pattern (rare; prefer existing helpers) |

## Clone from

Default: Button (`src/components/adapters/Button.tsx` and `src/components/adapters/{library}/Button/`).

Toolbar-config test pattern: `src/modules/toolbar/configs/__tests__/DataGrid.toolbar.test.ts`.
