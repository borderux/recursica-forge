---
"recursica-forge": patch
---

- Refactored component layout to prevent text descender clipping by standardizing `padding: 0.15em 0` on label elements and using `overflow-y: visible` with `overflow-x: hidden` for ellipsis.
- Resolved token resolution errors in JSON to CSS export pipeline to support direct references to typography groups (e.g., `{brand.typography.h2}`).
- Updated UI Kit components (Card, Panel, Modal, TransferList) to properly use brand typography tokens for `header-style` and `content-style`.
- Fixed build-time TypeScript type mismatches for dynamically generated `textTransform` CSS properties.
