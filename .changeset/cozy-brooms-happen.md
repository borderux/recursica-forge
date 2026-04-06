---
"recursica-forge": patch
---

Standardized CSS variable naming and refined the randomization system:
- **Simplified Palette Variable Paths**: Removed the redundant `color_` segment from brand palette variables (e.g., `_palettes_neutral_500_color_tone` → `_palettes_neutral_500_tone`).
- **Shortened Core Color Segment**: Renamed `core-colors` to `core` in all CSS variable paths for better consistency and readability.
- **Randomization Engine Overhaul**:
    - Simplified `randomizeVariables.ts` to use pure random assignments instead of "adjacent-step" logic, leading to more diverse results.
    - Fixed invalid references for nested core colors (like `interactive.default`) during randomization.
    - Ensured unique scale distribution across named brand palettes.
- **Export & Compliance Improvements**:
    - Simplified `jsonExport.ts` by removing DOM-level syncing, relying instead on clean store-to-JSON mapping.
    - Introduced `src/core/export/aaComplianceCheck.ts` to provide pre-export validation of all tone/on-tone contrast pairs.
    - Synchronized all compliance and resolver logic with the new `core` and palette naming standards.
