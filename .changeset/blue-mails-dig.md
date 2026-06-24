---
"recursica-forge": patch
---

Fix bug where custom color scale family names would get reset or lost after navigating between pages. Custom names are now properly persisted into the JSON tokens file under the scale's `$extensions` object, ensuring they survive theme recomputes and page reloads.
