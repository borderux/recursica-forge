---
"recursica-forge": patch
---

## Font token architecture: dimension type for letter-spacing and line-height

### Token schema changes (`recursica_tokens.json`)

- `font.letter-spacings` and `font.line-heights` tokens migrated from `$type: "number"` (bare numeric `$value`) to `$type: "dimension"` with a structured `{ value, unit }` object — matching the existing `font.sizes` pattern.
- Letter-spacing unit changed from implicit `em` to explicit `"em"` in the token value.
- Line-height unit changed from implicit unitless to explicit `"em"` in the token value.
- Added `$extensions.variants` to the `primary` (Lexend) typeface, declaring 9 weight entries all with `style: normal`. Lexend does not ship italic variants; the missing declaration was incorrectly allowing the italic option in the text style toolbar.

### Store and resolver changes

- `varsStore.ts` — `recomputeAndApplyAll`: letter-spacing and line-height emit blocks now read the `{ value, unit }` dimension object and emit `${value}${unit}` (e.g. `-0.03em`) instead of hardcoding `em` or emitting a bare string.
- `varsStore.ts` — `formatFontValue` (inside `updateSingleTokenCssVar`): same structured-object handling added for both categories; line-height broken out of the shared `weight || line-height` branch so it can emit a unit-suffixed string.
- `varsStore.ts` — `updateToken`: when the slider writes a new numeric value back for `letter-spacings` or `line-heights`, the existing `unit` is preserved from the dimension object rather than collapsing back to a bare number.
- `typography.ts` — removed the hardcoded `'em'` unit hint from `emitCategory('letter-spacings')`. The token's own `unit` field now takes precedence via the existing `{ value, unit }` object branch in `emitCategory`.

### Font token UI fixes (`FontLetterSpacingTokens`, `FontLineHeightTokens`, `FontPropertiesTokens`)

- Both components updated to extract `.value` from the `{ value, unit }` dimension object before passing to slider `value` prop. Previously `Number({ value: -0.03, unit: 'em' })` returned `NaN`, freezing thumb position and blanking the value display.
- Slider label for letter-spacing corrected from `px` to `em` (the stored value is an em multiple, not pixels).
- Line-height slider `max` increased from `1.5` to `2`.
- `overflow: hidden` removed from slider cell containers on both pages — was clipping the Mantine floating tooltip above the slider thumb.
- `overflow: hidden` removed from the outer `FontPropertiesTokens` card wrapper for the same reason. Border-radius continues to visually round the card corners without requiring overflow clipping.
- Row layout changed from `alignItems: stretch` to `alignItems: start` on the grid, with `alignItems: flex-start` on the label and slider cells. The sample text column also had its internal flex-centering and conditional `paddingTop` removed so all three columns top-align consistently.
- Reset handler in `FontPropertiesTokens` updated to extract `.value` from dimension objects for both letter-spacing and line-height reset paths.
