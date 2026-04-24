---
"recursica-forge": patch
---

## Bug fixes

### Palette color selector

- Fixed a race condition where changing a palette color family via the dropdown was immediately reverted by a stale `detectFamilyFromTheme` value still propagating from the previous `setTheme` call. A `userChangedRef` flag now suppresses the sync effect for one cycle after a user-initiated selection, preserving the chosen family until the theme state catches up.

### Compliance page

- All compliance issues (light-mode and dark-mode) are now listed unconditionally regardless of the app's current display mode. Previously, switching between light and dark mode caused issues to appear or disappear because the displayed list was gated on the active mode rather than the full computed set.
- Fixed a secondary issue where running "Fix All" in one mode and then switching modes caused previously fixed issues to reappear. The post-fix snapshot is now taken from the updated issue list (keyed by object identity) rather than from a stale reference.
- Empty-state and issue-table visibility are now driven by `displayIssues` (the filtered/visible list) rather than the raw `issues` array, so filtering still works correctly.

### Elevation panel — multi-selection prop isolation

- When multiple elevations are selected and a single property (blur, spread, offset X, offset Y, or opacity) is changed, only that property is updated across the selected elevations. Previously, `applyFactory` applied all panel values to every selected elevation, overwriting the other elevations' committed values. `applyFactory` now receives a `changedProp` discriminant and reads each elevation's own stored value for every other property.

### Type style panel — multi-selection prop isolation

- Applied the same pattern as the elevation fix: editing a single property on a multi-selected type style no longer overwrites unrelated properties on the other selected styles.

### Type style panel — strikethrough

- The strikethrough option in the text-decoration segmented control now correctly applies `text-decoration: line-through` instead of being silently ignored.

### Font families — non-Latin font rendering

- **Latin coverage detection timing**: The per-card Latin coverage check (`checkLatinCoverage`) previously ran after `document.fonts.ready`, which only fires once at page load and does not track dynamically-added fonts. It now uses `document.fonts.load('400 16px "FontName"')` per font, which explicitly waits for that specific font file to download before measuring canvas glyph widths. This prevents non-Latin fonts (e.g. Noto Sans JP) from being incorrectly classified as having no Latin glyphs simply because the font hadn't loaded yet.
- **Variable-font URL preservation**: When a Google Fonts URL uses the axis range syntax (e.g. `wght@100..900`), the original URL is now kept verbatim instead of being reconstructed with discrete weight values. Rebuilding a range URL into individual weights changes how Google Fonts serves the font (variable font file vs. multiple static files).
- **Range weight pre-selection**: Pasting a range-format URL into the Google Fonts modal now pre-selects all standard weights within the range (e.g. all 9 weights for `100..900`) in normal style, rather than only 400 and 700.
- **`sans-serif` fallback**: Font stack CSS variables now always include a `sans-serif` generic fallback (e.g. `"Noto Sans JP", sans-serif`) matching Google Fonts' own embed CSS. This was previously omitted when no explicit category was stored, leaving font stacks with no fallback while the font file downloads.
- **Inspiration card**: Removed the hardcoded `minHeight: 326px` from the "Need inspiration?" card on the Fonts page so it sizes to its content.

### Label adapter

- Minor rendering fix for the Label adapter component.

### CSS delta

- Isolated a delta-tracking edge case that could cause stale CSS variable values to persist after a theme recompute.

### Randomizer factories

- Fixed a missing case in the randomizer factory that prevented certain token categories from being randomized correctly.

### Tests — Accordion

- **`Accordion.test.tsx`**: Raised the `waitFor` timeout from 50 s to 90 s and the first test's per-test timeout from 60 s to 120 s. Mantine's Emotion CSS-in-JS injection is synchronous in JSDOM and blocks the event loop for ~70 s on a cold render; both timers must exceed that ceiling or they fire the moment the loop unblocks, reporting a false timeout.
- **`Accordion.integration.test.tsx`**: Fixed a race condition where `waitForAccordion` resolved with the default Mantine accordion element before `KitSwitcher`'s `useEffect` fired to switch the kit. The helper now looks for the kit-specific class (`.mantine-accordion`, `.material-accordion`, `.carbon-accordion`) so it only resolves once the correct kit's element is in the DOM. The Mantine per-test timeout was also raised to 120 s.
