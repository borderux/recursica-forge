---
"recursica-forge": patch
---

## Save Reminder & Toast Component Improvements

### Save Reminder (new feature)
- Added `useSaveReminder` hook (`src/core/hooks/useSaveReminder.ts`) that tracks cumulative CSS variable change batches and elapsed session time via `sessionStorage`
- Triggers a persistent Toast notification after 100 changes or 30 minutes of active editing — whichever comes first; repeats after each subsequent threshold
- Reminder resets on manual export or clicking "Reset All" in the shell header
- Developer shortcut: append `?remind=1` to any shell URL to trigger the toast immediately for QA
- Integrated into `MantineShell`, `MaterialShell`, and `CarbonShell` with shell-specific default positioning (`bottom: 24px, right: 24px`)
- Toast renders with `layer-0`, an "Export" action button (opens the export modal), and a dismiss close button

### Toast Adapter
- Removed the fallback div render path from `Toast.tsx` — the adapter now exclusively delegates to the registered library-specific component (fail-loud on missing registration)
- Cleaned up unused imports (`Button`, `iconNameToReactComponent`, `getComponentCssVar`, etc.) from the adapter

### Toast Component (Mantine)
- Fixed close (×) button visibility: replaced the Button adapter (which was collapsing to zero dimensions due to `--button-icon-size: 0px`) with a properly sized implementation using explicit CSS dimensions
- Fixed close button SVG sizing: added `min-width`, `min-height`, `max-width`, `max-height` overrides to prevent Button adapter icon-size tokens from zeroing out the icon
- Fixed close button color on success/error variants: `stroke` and `color` now explicitly use `--toast-button` to match the Undo button's interactive color
- `--button-icon-size: 16px` set on the close button container to override the default 0px token value

### Toast Previews
- First preview toast now shows message-only (no action, no close) to demonstrate the base component
- Second preview toast shows both an "Undo" action button and a dismiss (×) close button across all variants (default, success, error)
- `onClose` is now always passed to all preview instances (was previously conditional on variant)

### Avatar Variants
- Removed redundant `size` property from Avatar variant definitions in Mantine, Carbon, and Material adapters — `size` is a component prop, not a variant token
- Updated `avatar.json` test export to remove the now-invalid `size` field
