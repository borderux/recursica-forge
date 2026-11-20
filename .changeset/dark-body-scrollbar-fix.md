---
"recursica-forge": patch
---

Fixed the page body (and native scrollbar) sometimes rendering dark regardless of Forge's own light/dark toggle. `@mantine/core/styles.css` paints `body` from `--mantine-color-body` and sets `:root { color-scheme: var(--mantine-color-scheme) }` based on Mantine's own color-scheme state, which is persisted to `localStorage['mantine-color-scheme-value']` — shared by any Mantine app on the same origin and independent of Recursica's theme toggle. A stale "dark" value there (or "auto" following OS preference) leaked a dark background and dark native scrollbar behind the app even while Recursica's own theme was set to light. `body`'s background and `:root`'s `color-scheme` are now pinned to Recursica's own `data-recursica-theme` attribute and layer-0 surface token instead.
