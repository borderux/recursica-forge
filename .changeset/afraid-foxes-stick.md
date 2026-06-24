---
"recursica-forge": patch
---

- **Slider Input Typing Fix:** typing multiple digits in any slider input (like token sizes) was failing because the `onChange` event instantly clamped the first typed digit. This was updated across all Slider components (Mantine, Material, Carbon, and generic) to allow free typing, only clamping on `blur` or when pressing `Enter`.
- **App Update Notification:** The polling mechanism wasn't detecting new versions in production because CDNs were caching the `fetch('/index.html')` requests. This was fixed by appending a cache-buster query string `?t=${Date.now()}`.
- **Avatar Width Overrides:** Removed `!important` tags from `width` and `height` properties inside the CSS files for Avatar adapters (Mantine, Material, and Carbon). Also directly passed our design system size via `--avatar-size` to Mantine. This allows users to pass standard styling props like `w` or `width` that will correctly override default sizes without being aggressively crushed by the component's internal CSS.
- **Font Size Max:** Increased the max allowed font size in the token selector from 72px to 120px.
