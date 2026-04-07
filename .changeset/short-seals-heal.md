---
"recursica-forge": minor
---

Refinement of the token randomization engine and reporting UI. This update excludes non-randomizable font properties (weights, cases, styles, and decorations) from the randomization logic to ensure typeface consistency across generated designs. It implements a precision 'Common Prefix Bolding' algorithm in the results report for clearer node-level diffing of changed token paths. Additionally, it refactors all 46 component randomizers to use a standardized factory pattern and path-selection logic, synchronized with the latest design system constraints. Includes maintenance for JSON export tests and cleanup of temporary refactoring utilities.
