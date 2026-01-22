# recursica-forge
A tool for managing Recursica variables, themes, and token definitions

## Development

- Start dev server: `npm run dev` (Vite, default: http://localhost:5173)
- Run tests: `npm test` (Vitest)
- Type-check: `npm run type-check`

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and releases.

### Creating a Changeset

When you make changes that should be tracked:

1. Run `npm run changeset` to create a changeset file
2. Select the change type (patch/minor/major) and provide a description
3. Commit the generated changeset file in `.changeset/`

### Making a Public Release

The release process is automated via GitHub Actions:

1. **Create Changeset**: After making your changes, run `npm run changeset` and commit the changeset file
2. **Push to Main**: Push your changes (including the changeset) to the `main` branch
3. **Version Packages PR**: The Changesets workflow automatically creates a "Version Packages" pull request that includes:
   - Version bump in `package.json` (based on changeset types: patch/minor/major)
   - Updated `CHANGELOG.md` with release notes
4. **Review and Merge**: Review the version PR and merge it when ready
5. **Automatic Release**: Once merged, the workflow automatically:
   - Creates a git tag for the release version (e.g., `v1.2.3`)
   - Creates a GitHub release with changelog and links to PRs/commits
   - Deploys the application to GitHub Pages

The entire process is automated—you just need to create changesets and merge the version PR when ready to release.

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

