---
"recursica-forge": patch
---

Fixed an issue where "Core/High Contrast" semantic colors failed to hydrate and fell back to 'None' during theme import due to overly restrictive regex parsing. Modified `parsePaletteSelection` to support both nested structured palette references and flat semantic references (e.g. `core-colors`).
