---
"recursica-forge": minor
---

Improve AA compliance checker with suggest tones, undo support, and opacity-aware contrast calculations

- Add "Suggest Tones" modal that generates alternative palette tones meeting WCAG AA contrast requirements, using actual on-tone colors from the theme for accurate contrast ratio predictions
- Add undo support for both "Fix" and "Suggest Tones" actions in the compliance report, with consistent disabled-style undo buttons
- Fix contrast calculations to account for text emphasis opacity (high and low), ensuring compliance fixes consider blended colors rather than raw hex values
- Add reset confirmation modal in the header with spinner feedback during reset operation
- Replace hand-rolled confirm dialogs (Fix All, Reset All) with proper Modal component usage for consistent header/content/footer layout
- Fix palette splitting for light and dark modes to correctly handle independent palette changes per mode
- Fix tooltip display in compliance report to show correct on-tone values in the "Issue" column
- Add `rawOnToneHex` field to `ComplianceIssue` interface for threading actual on-tone colors through to the Suggest Tones modal
- Fix "All clear" state to hide issue tables and undo buttons when no live compliance issues remain
- Fix null guard on `hexToCssVarRef` calls in `AAComplianceWatcher` and `interactiveColorUpdater` to prevent runtime crashes when token lookup fails
- Improve rescan behavior after reset to properly clear snapshots and re-snapshot fresh issues
