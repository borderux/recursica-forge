---
"recursica-forge": minor
---

- **1.x → 2.x Import Migration (tree & table)**:
  - Added `mapTree` so the tree component's flat `selected-*` / `unselected-*` colour keys and `selected-text` / `unselected-text` typography groups map onto `variants/selection-states/{selected,unselected}/properties/{colors,text}`. Previously unmapped, so all 32 values were dropped and the current template's own defaults kept — silently replacing the imported tree styling.
  - Added `mapTable` so `table-cell`, `table-header`, and `table-footer` `text-color-enabled` / `-disabled` and `cell-color-enabled` / `-disabled` split across `properties.colors` and `variants.states.disabled.properties.colors` (48 values per file, previously dropped).
  - `table`'s `highlight-on-hover-color` / `-opacity` are now dropped explicitly (hover is global in 2.x) rather than falling through to a 2.x path that does not exist.
  - `isOldUikitStructure` gained tree and table sentinels, so a file whose only legacy shape is one of those is still detected and migrated.

- **Dangling Font References Across Files**:
  - Added `reconcileUikitFontRefs`: a ui-kit `{brand.fonts.<role>}` reference pointing at a role the brand does not define now degrades to the first role it does (`primary` in practice). `brand.fonts` is sized by the brand's typeface count, so a single-typeface brand legitimately has no `secondary`.
  - Runs on import *and* in the store constructor, so every load path ends up referentially consistent — import, reset, fresh boot, and the bundle-version check that drops only the cached ui-kit and can otherwise leave an imported brand beside the bundled ui-kit.
  - Fixes an import that validated cleanly but then refused to export, with errors naming component paths the user could not reach in the UI.

- **CSS Export — tokens with no value**:
  - `tokens.font.cases.original` (`$value: null` — CSS has no keyword for "render the text as authored") is no longer declared, and neither is any declaration whose entire value aliases it, transitively. Previously the specific transform emitted `: "";` and the scoped transform omitted the primitive while keeping ~136 typography declarations pointing at an undeclared variable.
  - `tokens.font.decorations.none` now carries the CSS keyword `none` in both the bundled tokens and the export. `text-decoration: none` is a real declaration, so this token and the declarations aliasing it are emitted normally.
  - The running app now matches its own export: null tokens are no longer emitted as `none`, typography no longer aliases them, and a prune ahead of `applyCssVars` covers every resolver rather than each emit site (~112 ui-kit `text-transform` variables).
  - Note: the bundled `recursica_tokens.json` change alters the bundle version, so the cached imported ui-kit is cleared once on first load after upgrading.

- **Layer Geometry Across Light/Dark**:
  - `padding`, `border-radius`, and `border-size` are mode-independent but stored per theme, and the Layers panel writes only the mode being viewed — so an edit made in light mode left dark on the old value and the exported brand JSON disagreed with itself. Both modes are now kept in step, in the DOM and in the JSON, on the commit path and the live-preview path.
  - Surface and border colours are excluded as genuinely mode-dependent, as is elevation, which references mode-specific elevation tokens.

- **Elevation Values in Brand JSON**:
  - A bare elevation name (`elevation-2`), which is valid in the CSS variable and read back by the Layers panel, is now stored as `{brand.themes.<mode>.elevations.elevation-2}` rather than the raw string, and is refused rather than guessed when the variable carries no mode segment. Previously this only resolved because the Layers panel happened to overwrite it with the correct reference immediately afterwards.

- **Layers Reset Label**:
  - "Reset to app defaults" now reads "Reset to Recursica defaults".
