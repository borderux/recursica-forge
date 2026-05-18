---
"recursica-forge": patch
---

Add client-side version staleness detection and dev-mode improvements.

- **Version check hook** (`useVersionCheck`): polls `/index.html` every 7 minutes in production, comparing the fingerprinted JS entry chunk to detect new deployments. Completely disabled in development. Exposes `checkNow()` (triggered on app reset), `dismissUpdate()` (hides toast until next poll cycle), and `simulateUpdate()` (dev-only toggle).
- **Upgrade toast**: persistent `error`-variant toast with an "Upgrade" action button and a separate dismiss (×) button, rendered in all three shells (Mantine, Material, Carbon). Stacks above the save-reminder toast when both are visible. Width is fully controlled by the Toast design token (`max-width` / `min-width`).
- **Reset integration**: all three shells call `checkNow()` when the user resets to defaults, prompting an immediate version check before starting a fresh session.
- **Dev simulation button**: header button using the `trend-up` Phosphor icon (`outline` / `small`) lets developers toggle the upgrade toast without deploying. Only visible in development.
- **Bug report button**: hidden in development (`!import.meta.env.DEV`); visible in production only.
- **Toast CSS**: added `white-space: nowrap` and `min-width: fit-content` to `.recursica-toast-action` and its button across all three Toast CSS files, preventing text content from squeezing the action button.
- **Icon library**: registered `TrendUp` as `'trend-up'` in the Phosphor icon map.
