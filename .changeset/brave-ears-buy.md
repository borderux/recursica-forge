---
"recursica-forge": minor
---

Implemented a global undo/redo history stack for design tokens, themes, and UI kit overrides using fast-json-patch, debounced by 1 second to group active user interactions. Exposed via VarsContext and keyboard shortcuts (Cmd+Z/Ctrl+Z/Ctrl+Y).

Key bug fixes and synchronization improvements:
- Added `cssVarsReset` event listeners to all major custom toolbar controls (border size, typography properties, elevation options, icon sizes, dimensions, and opacity sliders) so they refresh instantly on undo/redo.
- Fixed a race condition where DOM computed styles were read before browser recalculation by deferring reset events and introducing component-level `refreshKey` triggers.
- Resolved an issue on the very first undo where inline CSS variable overrides remained in the DOM by directly inspecting `document.documentElement.style` to identify and prune deleted overrides.
- Fixed accordion toolbar sliders failing to parse CSS variables with underscores (e.g. `--recursica_brand_dimensions_general_md`) by correcting the string matching patterns.
- Fixed elevation color picker synchronization and shadow color unsetting by passing a picker callback to propagate color changes and using the correct `_tone` suffix for core palette matching.
- Ensured all component adapters and segmented controls listen to both reset and update events to keep UI states aligned.
