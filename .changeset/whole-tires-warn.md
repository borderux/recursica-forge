---
"recursica-forge": patch
---

**Font delete reassignment modal** — when a user deletes a font family, a confirmation modal now appears (mirroring the existing palette delete flow) that lets them redirect any existing references to the disappearing position slot to a remaining font position. The last position slot (e.g. Tertiary when three fonts are defined) always becomes the stale reference after renumbering; all other positions shift automatically and require no intervention.

- `varsStore.deleteFont(fontIdToDelete, fallbackPositionId)` — new store method that: removes the deleted font from `localStorage`, renumbers kept fonts, replaces all `{brand.fonts.<lastPosition>}` references in the serialized state with the chosen fallback position, clears stale CSS vars from the DOM, and calls `syncFontsToTokens` to rebuild brand and token JSON.
- `FontFamiliesTokens` — trash button now opens a delete-confirmation modal with a dropdown of remaining font positions (labeled with their new sequence name and family, e.g. "Secondary — Quattrocento") rather than deleting immediately. A `saveStoredFonts` call before deletion seeds the `recursica_fonts` localStorage key when fonts were being served from the `getDefaultFonts()` fallback (empty key caused `deleteFont` to silently no-op).
