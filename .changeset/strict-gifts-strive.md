---
"recursica-forge": patch
---

### Button Component Enhancements

**New variant: `content`** — Adds a `content` variant to the Button component with `label` and `icon-only` options. Each option has size-dependent horizontal padding for both `default` and `small` sizes.

**New property: `icon-color`** — Adds per-layer icon color tokens to each style variant (solid, outline, text), referencing the corresponding text color value. All three adapters (Carbon, Material, Mantine) now inject `--button-icon-color` on the button root.

**Toolbar reorganization:**
- Moved `height`, `min-width`, and `max-label-width` (renamed from `max-width`) into a new "Dimensions" group
- Moved `icon-text-gap` and `icon-size` into a new "Icon" group with the new `icon-color` control

**Layout and CSS fixes (Mantine):**
- Fixed Mantine v7 class name mismatch — updated all CSS selectors from `.mantine-Button-leftSection` / `.mantine-Button-rightSection` to `.mantine-Button-section[data-position='left']` / `[data-position='right']`
- Fixed label truncation with ellipsis — changed label flex from `none` to `1 1 0` with `min-width: 0`, and removed overly-broad `:not(:has(*:not(svg)))` selector that forced `display: flex` + `justify-content: center` on all labels
- Fixed trailing icon gap — rightSection now correctly receives `margin-inline-start` via the updated v7 selector
- Centered content group within button when min-width exceeds content width

**Preview updates:**
- `ButtonPreview` conditionally renders based on `content` variant: `label` shows text/icon+text buttons, `icon-only` shows icon-only + disabled
