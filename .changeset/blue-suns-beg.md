---
"recursica-forge": patch
---

- Removed all instrumentation and debugging tooling from the codebase
- Fixed TypeScript type errors by updating `componentName` prop type from `string` to `ComponentName` in:
  - `ElevationToolbar.tsx`
  - `PropControlContent.tsx`
  - `ComponentToolbar.tsx`
  - `ComponentDetailPage.tsx`
- Fixed component name comparisons to use `ComponentName` union type values (e.g., "MenuItem" instead of "Menu item")
- Improved type safety throughout the toolbar component chain
