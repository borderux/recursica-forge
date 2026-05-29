---
"recursica-forge": patch
---

Fixed an issue in `updateBrandValue` where updates to sub-properties of composite tokens (such as typography and shadows) incorrectly created root-level keys instead of updating the values within the token's `$value` object.
