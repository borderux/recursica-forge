# recursica-forge

A tool for managing Recursica variables, themes, and token definitions

## Development

- Start dev server: `npm run dev` (Vite, default: http://localhost:5173)
- Run tests: `npm test` (Vitest)
- Type-check: `npm run type-check`
- Lint: `npm run lint` (ESLint)
- Lint & fix: `npm run lint:fix` (ESLint with auto-fix)
- Format: `npm run format` (Prettier)
- Format check: `npm run format:check` (Prettier, no changes)

### Code Quality Tools

- **ESLint**: Code linting with TypeScript and React support
- **Prettier**: Code formatting
- **Husky**: Git hooks (pre-commit runs linting, formatting, and type-checking)

## Versioning and Releases

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and releases. For detailed information about:

- **Creating changesets**: See [CONTRIBUTING.md](./CONTRIBUTING.md#changesets)
- **Release process**: See [RELEASE.md](./RELEASE.md)

## Architecture Overview

- VarsContext (`src/modules/vars/VarsContext.tsx`)
  - Central store for `tokens`, `theme` (Brand), `uikit`, and `palettes`
  - Seeds/persists localStorage, applies core CSS variables
  - Computes minimal `resolvedTheme` for palette mappings (light/dark)
  - Exposes `resetAll()` to restore defaults and clear ephemeral state

- Token Overrides (`src/modules/theme/tokenOverrides.ts`)
  - Read/write overrides in localStorage under `token-overrides`
  - Emits `tokenOverridesChanged` events with `{ name, value, all }`

- Type System
  - `TypePage`: hosts samples and the token editors side panel
  - `TypeSample`: resolves effective style (brand.typography → theme → tokens → overrides) and renders preview
  - `TypeControls`: chips and edit UI; writes per-style choices to `type-token-choices` and emits `typeChoicesChanged`

- Palettes and Layers
  - `PaletteGrid`: maps a chosen color family to a theme palette, applies on-tone and emphasis, enforces AA where possible
  - `LayerModule`: renders a representative layer block using mapped CSS variables

- UI Shells
  - `UiKitContext`: selects Mantine / Material UI / Carbon shell
  - `Layout`: lazily loads the shell and hosts pages
  - Shells provide nav, reset defaults, and import/export of CSS variables

## Key Browser Events

- `tokenOverridesChanged`: fired when token overrides change
- `typeChoicesChanged`: fired when per-style type choices change
- `familyNamesChanged`: fired when color family-friendly names change
- `paletteReset`: fired after `resetAll()` for legacy listeners

## Data Shapes

- Tokens: Nested under `tokens.*` (e.g., `tokens.font.size.md.$value`)
- Brand Theme: `brand.*` (e.g., `brand.light.palette.neutral.500.text['high-emphasis'].$value`)
- UIKit: `src/vars/UIKit.json`
