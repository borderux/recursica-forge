---
"recursica-forge": patch
---

- **Import Validation & Compatibility**:
  - Fixed an issue where importing older 1.x JSON files (tokens, brand, or ui-kit) was rejected because validation was performed on the raw file structure before migration. The import flow now validates the migrated, upgraded 2.x data structures.
- **UI-Kit Structural Migration**:
  - Introduced `mapOldUikitPath` and `overlayOldUikit` in `migrateImportedJson.ts` to automatically map legacy 1.x ui-kit structures (including chip styles, flat checkbox colors, and timeline selection-states) and overlay them onto the current 2.x schema.
  - Supported promoting legacy `default` interaction states to component-level properties, splitting shared color properties (such as disabled states), and handling renaming of key properties.
- **Tests & Validation**:
  - Added comprehensive unit tests in `migrateImportedJson.test.ts` to verify mapping path resolutions and ensure migrated 1.x brand and ui-kit structures pass current schema validations.

