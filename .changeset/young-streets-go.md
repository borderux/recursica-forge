---
"recursica-forge": minor
---

- **Brand Modes Architecture (`themes` → `modes`)**:
  - Renamed `brand.themes` to `brand.modes` (`modes.light`, `modes.dark`) across `recursica_brand.json`, schema definitions, variable resolvers, CSS builders, compliance watchers, and UI panels.
  - Added automatic migration in `migrateImportedJson` to seamlessly upgrade imported files using legacy `brand.themes` structures to `brand.modes`.

- **Responsive Breakpoints & Typography Rework**:
  - Replaced the standalone typography page with a unified `TypeAndBreakpointsPage`, featuring real-time responsive viewport simulation, container grid overlays, and breakpoint configuration panels.
  - Added responsive typography utilities and export coverage for breakpoint-dependent typography styles and layout settings.
  - Standardized slider adapter controls across Carbon, Mantine, and Material component implementations.

- **UI Kit Layer Reduction & Layer Cascading**:
  - Compressed `recursica_ui-kit.json` by eliminating redundant layer duplications across components.
  - Implemented `expandLayers` hydration logic so `layer-0` serves as the base layer, with upper layers carrying only sparse overrides and automatically shifting relative layer token references.
  - Optimized Scoped and Specific CSS export transforms to omit duplicate declarations for layer-invariant component properties, significantly reducing emitted CSS variable output.
  - Fixed root CSS variable generation in scoped export transformations to prevent duplicate `ui-kit_` prefixes.

- **Typeface & Token Export Cleanup**:
  - Removed unused font token declarations from `recursica_tokens.json`.
  - Updated typeface export logic so only active fonts referenced by brand typography roles are included in export bundles, preventing orphaned fonts from persisting.
