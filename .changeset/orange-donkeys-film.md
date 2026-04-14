---
"recursica-forge": patch
---

- **Fix JSON Export Mutation Regression:** Refactored `updateUIKitValue` to utilize an optimized immutable-path shallow clone loop. This ensures that manually dragged properties accurately persist via the global `VarsStore` in production Rollup instances without the exponential CPU penalty or UI freezing brought on by legacy JSON deep-clones.
- **Optimize CSS Variable Debouncing:** Decoupled `updateCssVar` executions. The underlying `root.style.setProperty` DOM rendering processes synchronously to guarantee seamless, instant 60fps visual Live Previews, while deep JSON property updates, delta store synchronization, and runtime AA compliance-scans are throttled behind an isolated 300ms debounce loop to avert unneeded React bottlenecks.
- **Add Production Utility URL:** Deployed a hidden `/random` route logic wrapper directly into `main.tsx` and the core `AppShells` (`Carbon`, `Material`, `Mantine`) enabling direct manual trigger of the `RandomizeOptionsModal` on any production instance via URL matching, bypassing the `<dev />` specific UI access-bars.
