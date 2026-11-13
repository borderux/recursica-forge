---
"recursica-forge": patch
---

Upgraded `@recursica/mantine-adapter` to 0.38.0 to pick up the real `TimePicker` implementation (previously a stub) and the updated `Tree` component. Verified with `npm run report:adapter-wiring`: 100% of the adapter's CSS variable reads still resolve against Forge's exported tokens, with no new drift.

Also removed `@recursica/adapter-common` as a direct dependency and dropped its redundant standalone `style.css` import from `MantineShell.tsx` — `mantine-adapter`'s own `style.css` already bundles `adapter-common`'s shared component styles verbatim, and upstream's own setup docs never call for importing `adapter-common/style.css` separately. It remains installed transitively via `mantine-adapter`.
