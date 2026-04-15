---
"recursica-forge": patch
---

- **Brand & UIKit Export Compliance**: Fixed a bug where typography variables (`text-decoration`, `text-transform`, `font-style`) and dimension wrappers were exporting as bare strings or incorrectly structured payloads. They are now correctly mapped to DTCG-compliant structural objects and token aliases (e.g., `{tokens.font...}`) during file export.
- **Randomizer Refinements**: Updated the Randomization Engine to correctly shuffle and apply variations to string-based typography constraints (decorations, styles, cases) and properly target dimension configurations for global `border-size` instead of indiscriminately mapping them to background colors.
- **Production Routing Crash**: Swapped legacy `process.env.NODE_ENV` evaluations with Vite's `import.meta.env.DEV` across all UI Shell modules to resolve a critical Javascript rendering crash that was preventing the DEV routing capabilities from mounting in the production bundle.
- **CSS Delta Persistence**: Narrowed TS configuration typings across the internal Delta parser preventing build-time typing crashes associated with theme-agnostic objects.
