---
"recursica-forge": minor
---

### Global Reference Override System

Added a centralized mechanism to detect and handle edits to component properties that are backed by shared `{ui-kit.globals.*}` references.

**New features:**
- When a user edits a property tied to a global reference (e.g., form field border color), a "Shared Property" modal appears after a 500ms debounce asking whether to update the global (affecting all components) or override just the current component.
- "Remember my choice" checkbox allows users to elect always-override or always-update-global, stored in `localStorage`. Preference is cleared on Reset.
- Global updates correctly propagate to all components sharing the reference and persist across page reloads via the CSS delta system.

**New modules:**
- `globalRefInterceptor.ts` — Core interception logic with debounce, preference management, theme-aware CSS variable resolution, and delta/JSON synchronization.
- `GlobalRefModal.tsx` / `GlobalRefModalProvider.tsx` — Modal UI mounted at the app root, using design system typography, layer-1 emphasis colors, and the CheckboxItem adapter.

**UIKit JSON updates:**
- Form component `border-size` properties now reference shared globals (`border-size-default`, `border-size-focus`) instead of hardcoded pixel values.
- `file-upload` `border-radius` and stacked `top-bottom-margin` for 9 form components now use their respective globals instead of direct brand references.
- `transfer-list` decoupled from form field globals — border-color, border-radius, border-size, and background now use direct brand references since transfer-list is not a standard form input.
