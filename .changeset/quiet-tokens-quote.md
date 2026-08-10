---
"recursica-forge": patch
---

Fixed CSS export incorrectly quoting literal string token values that are valid bare CSS keywords or numeric strings (e.g. `text-decoration: "underline"` and `font-weight: "400"` instead of `underline` and `400`). Affects both `recursica_variables_scoped.css` and `recursica_variables_specific.css`.
