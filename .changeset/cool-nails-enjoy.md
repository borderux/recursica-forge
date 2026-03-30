---
"recursica-forge": patch
---

Fix regression where custom font family names revert to JSON defaults after clicking "Reset all" on the Font Tokens page.

The `handleReset` function in `FontPropertiesTokens.tsx` unconditionally called `clearStoredFonts()`, which deleted `localStorage['rf:fonts']` — the sole persistence layer for user-selected font families. This happened even when resetting unrelated tokens (font size, letter spacing, line height). On the next recompute, `getStoredFonts()` found no entry in localStorage and fell back to `getDefaultFonts()`, restoring the original JSON typeface names (e.g. Inter) in the font family cards.

Removed the `clearStoredFonts()` call and its import from `FontPropertiesTokens.tsx`. Resetting typographic scale tokens is independent of the font family selection and should never clear it.

Files changed:
- `src/modules/tokens/font/FontPropertiesTokens.tsx`
