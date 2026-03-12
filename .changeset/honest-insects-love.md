---
"recursica-forge": patch
---

Fix compliance persistence, pipeline refactors, and suggest tones accuracy

- Fix `checkAllPaletteOnTones` overwriting compliant on-tone token references with non-compliant core colors during recomputation, preventing compliance fixes from being lost on navigation
- Refactor palette color update pipeline: remove redundant recomputation layers in `varsStore`, consolidate CSS var rebuilding, and clean up stale resolver logic
- Add `traceToTokenRef` utility to accurately trace CSS variable chains to terminal tokens, replacing blind hex matching in `findColorFamilyAndLevel` which failed when multiple scales shared the same hex
- Add `toneCssVar` and `rawOnToneHex` fields to all compliance issue types (palette on-tone, core color, layer text, layer interactive) for accurate token resolution and contrast calculation in the Suggest Tones modal
- Fix Suggest Tones modal computing incorrect contrast ratios for layer text low-emphasis issues by adding `emphasis: 'low'` to issue metadata, preventing the modal from offering non-functional fixes
- Suppress Suggest Tones button for issues where adjacent scale levels have identical hex values, showing an informative message instead
