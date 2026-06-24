---
"recursica-forge": minor
---
- Split TableHeader and TableFooter divider properties into separate horizontal (`horizontal-divider-size`, `horizontal-divider-color`) and vertical (`vertical-divider-size`, `vertical-divider-color`) settings.
- Added `vertical-margin` property to TableHeader and TableFooter using general brand dimension tokens, bounding the absolute-positioned column dividers within the margins.
- Updated Table row padding property to use general brand dimension tokens.
- Updated TableFooter currency column variants to consume the correct currency text styles.
- Updated TablePreview layouts to hug their actual content height in singleRowMode, resolving empty space issues in Table Cell, Header, and Footer previews.
- Added `table.json` test-exports with unique, fully-valid schema overrides for table components.
- Added temporary scratch/validation script patterns to `.gitignore`.
