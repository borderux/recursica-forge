---
"recursica-forge": patch
---

**On-tone color update prompt for component layer colors**

When a user changes a component layer color to a new palette tone and the same layer group contains sibling properties (e.g. `text`, `text-hover`, `icon-color`) that are currently set to the matching on-tone of the previous value, a modal prompts the user to also update those related on-tone properties. The modal lists affected properties in natural language ("text, text hover, and icon color"), offers "Update on-tones" or "Only update background", and includes a "Don't ask me again" checkbox persisted to `localStorage` (`recursica_on_tone_preference`). The preference can be silently auto-applied on future changes without re-prompting.

Matching is scoped to the same `layer-N` group and only fires when the sibling's on-tone base still matches the old tone — if a sibling was manually changed to a different palette, it is excluded from the prompt.

**Component color write guard**

Properties under `_properties_colors_` in the UIKit JSON now hard-reject any value that is not a `{brand.*}` or `{ui-kit.*}` reference. Attempts to write `{tokens.*}` refs or raw values (hex, named colors) throw immediately so the violation is visible rather than silently corrupting the design token store.

**Core-colors reference sanitization at export**

Both `normalizeBrandReferences` and `normalizeUIKitBrandReferences` in `jsonExport.ts` now strip the spurious `.color.` subgroup from `core-colors` palette references (e.g. `core-colors.alert.color.tone` → `core-colors.alert.tone`). Core-colors entries are flat leaf nodes and do not carry a `.color.` intermediary like numbered palettes do. This acts as a belt-and-suspenders export-time heal on top of the existing write-site fixes in `varsStore` and `cssVarBuilder`.
