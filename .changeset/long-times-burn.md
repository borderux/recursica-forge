---
"recursica-forge": minor
---

- **New Default Recursica Theme**:
  - Retyped the default brand: `fonts.primary` is now Dongle (was Lexend) and `fonts.secondary` is Nunito Sans (was Bellota Text). The `tertiary` role (Quattrocento) is removed — the default brand now ships two typefaces rather than three. Nothing references `{brand.fonts.tertiary}` any more, so no reference is left dangling.
  - Added the `dongle` and `nunito-sans` typefaces to `recursica_tokens.json`. The previous typefaces remain available as tokens; only the brand's font roles stopped pointing at them.
  - Retuned the line-height scale for a display face with a short default: `default` 1.05 → 1, `short` 1 → 0.9, `shorter` 0.95 → 0.8, `shortest` 0.9 → 0.7, `tall` 1.175 → 1.2, `taller` 1.3 → 1.4, `tallest` 1.4 → 1.6.
  - Opened up the display end of the size ramp: `lg` 18 → 20, `xl` 20 → 24, `2xl` 24 → 32, `3xl` 28 → 40, `4xl` 32 → 48, `5xl` 36 → 56, `6xl` 40 → 64.
  - Brand typography now sets line height per style — headings take the short end of the scale and body/subtitle styles the tall end — instead of every style resolving to `default`.
  - Added `com.recursica.friendlyName` metadata to the colour scales: Gray, Cornflower, Greensheen, Mandarin, Mandy, and Salmon.

- **UI Kit Retuned to the New Type Scale** (74 values, no components added or removed):
  - 47 `font-family` bindings moved from `{brand.fonts.primary}` to `{brand.fonts.secondary}`, so component text sits on Nunito Sans while Dongle stays for display type.
  - 11 line heights, 6 font weights, and 2 font sizes adjusted to suit the new scale, along with a handful of sizing values (avatar height, icon size, icon/text gap, horizontal padding, item gap, stepper indicator/label gap).

- **Components Sidebar Grouping**:
  - Moved **Label** under the "Form inputs" group and moved **Segmented control** back out to the top level. Grouping is visual only — component routes and JSON are unchanged.

Note: all three bundled JSON files change, which alters the computed bundle version. The cached imported ui-kit is cleared once on the first load after upgrading.
