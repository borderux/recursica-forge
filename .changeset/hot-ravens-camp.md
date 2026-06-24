---
"recursica-forge": patch
---

Fix randomizer token injection, resolve DTCG schema validation regressions, and restore Link text properties panel:
- Prevented `.default` references in token color resolution by introducing `tokenColorLevels` to `randomizerFactories.ts`.
- Corrected the dimension reference generation path in `DimensionsPage.tsx` from `{tokens.size.X}` to `{tokens.sizes.X}`, fixing 102 critical `$type` schema validation errors.
- Integrated `validate-export.ts` into the `npm test` script pipeline.
- Removed the restrictive `allowedProps` configuration from `Link.toolbar.json`, restoring the full text styling panel including font, size, and the "show all properties" button.
