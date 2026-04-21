---
"recursica-forge": patch
---

**Fix: UIKit component changes no longer revert to defaults on export after a session reload**

Previously, toolbar edits to UIKit components (e.g. Accordion colors, dimensions) were correctly persisted to localStorage via the CSS delta system and correctly restored to the DOM on every page load — so the preview always looked right. However, the in-memory UIKit JSON was never updated from the delta after a reload, meaning `exportUIKitJson()` always returned the original file values instead of the user's modifications.

**Root cause:** `syncDeltaToJson` only reconciled `tokens` and `theme` (brand) delta entries back to their in-memory JSON objects. UIKit CSS variables (`--recursica_ui-kit_*`) were silently skipped, leaving `state.uikit` pointing at the pristine import after every page reload.

**Changes:**

- `updateUIKitValue.ts` — Exported `cssVarToUIKitPath` (the greedy-match CSS-var-to-JSON-path resolver) so it can be shared with the sync module.
- `deltaToJson.ts` — Extended `syncDeltaToJson` with an optional `uikit` parameter. A new third pass iterates over all `--recursica_ui-kit_*` delta entries and patches their `$value` back into the in-memory UIKit JSON using the same type-aware logic (`dimension`, `number`, `color`) as `updateUIKitValue`. The sync is lazy — it runs only when needed.
- `varsStore.ts` — Added a public `syncUiKitDelta()` method that triggers the new UIKit pass against the current `state.uikit`.
- `exportWithCompliance.tsx` — `handleExport` calls `store.syncUiKitDelta()` as its first action, guaranteeing the UIKit JSON is always current before any validation or export function reads it. This is intentionally on-demand (not at page load) so it runs only when the user initiates an export.

**Fix: Accordion rendering tests no longer time out**

`Accordion.test.tsx` and `Accordion.integration.test.tsx` were timing out at 60 s because three independent issues compounded:

1. **Registry not populated** — `registerComponent()` calls live in `registry/mantine.ts` etc., only imported by `main.tsx`. Tests bypass `main.tsx`, so the registry was empty and `preloadComponent()` was a no-op. Each test file now explicitly imports the relevant registry files.
2. **`UnifiedThemeProvider` async loading gate** — Each sub-provider used `useEffect` + `setState` to dynamically import its library, returning `null` until resolved. All three gates had to clear before the Accordion could mount. Module-level caches (`_MantineProviderCached` etc.) are now populated synchronously from the `useState` initializer when the module is already in cache (pre-warmed by `beforeAll`).
3. **`act()` blocked on Mantine CSS-in-JS** — Wrapping `render()` in `act(async () => {...})` forced the test to synchronously wait ~38 s for Mantine's style injection before returning, consuming the entire timeout before `waitFor` could poll. Replaced with plain `render()` + a 50 s `waitFor` window and explicit 60 s per-test timeouts.
