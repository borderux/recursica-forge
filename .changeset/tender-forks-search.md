---
"recursica-forge": patch
---

Standardized typography usage across component previews:
- Created a centralized `typographyStyles` helper to map `var(--recursica_brand_typography_...)` variables to React style objects.
- Updated `NumberInputPreview`, `ModalPreview`, `CardPreview`, `PanelPreview`, and `HoverCardPopoverPreview` to apply the proper design system typestyles (`h2Style`, `pStyle`) to all semantic `<h2>` and `<p>` tags, replacing hardcoded text formatting.
