---
"recursica-forge": patch
---

This update focuses on the implementation and integration of the new Modal and Dropdown component adapters across all theme shells (Material, Carbon, and Mantine), along with several UI refinements and stability fixes:

- **Universal UI Adapters**: Standardized use of `Modal` and `Dropdown` components across the application, replacing various library-specific implementations with flexible adapters.
- **Merge Conflict Resolution**: Resolved complex merge conflicts across core modules including PropControl, Shell components, and theme data files.
- **Refined Property Controls**: Refactored `PropControl` to use a delegation pattern for better maintainability and resolved styling bugs in label and color selectors.
- **Theme Data Fixes**: Corrected JSON syntax errors in `UIKit.json` and refined dimension tokens for dropdowns and fields.
- **Typography & Color Tools**: 
  - Updated Google Fonts modal with improved variant selection and sequence management.
  - Enhanced color scale visualizations and fixed color picker contrast logic.
- **Build & Stability**: Fixed TypeScript errors in shells and store logic, and ensured clean production builds.
