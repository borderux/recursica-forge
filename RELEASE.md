# Release Process

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and releases. The release process is fully automated via GitHub Actions.

## Overview

The release workflow operates in two modes:

1. **Version Mode**: When changesets are present, creates a "Version Packages" pull request
2. **Publish Mode**: When the version PR is merged, automatically publishes the release

## Making a Public Release

### Step 1: Create Changeset

After making your changes, create a changeset:

```bash
npm run changeset
```

Select the change type:
- **patch**: Bug fixes, minor corrections (e.g., `1.0.0` → `1.0.1`)
- **minor**: New features, additions (backwards compatible) (e.g., `1.0.0` → `1.1.0`)
- **major**: Breaking changes (e.g., `1.0.0` → `2.0.0`)

Provide a clear description of your changes, then commit the generated changeset file in `.changeset/`.

### Step 2: Push to Main

Push your changes (including the changeset) to the `main` branch. This can be done via a pull request or direct push.

### Step 3: Version Packages PR

The Changesets workflow automatically creates a "Version Packages" pull request that includes:
- Version bump in `package.json` (based on changeset types: patch/minor/major)
- Updated `CHANGELOG.md` with release notes from all changesets

### Step 4: Review and Merge

Review the version PR to ensure:
- The version bump is correct
- The changelog accurately describes the changes
- All changesets are included

When ready, merge the version PR.

### Step 5: Automatic Release

Once the version PR is merged, the workflow automatically:
- Creates a git tag for the release version (e.g., `v1.2.3`)
- Creates a GitHub release with changelog and links to PRs/commits
- Publishes to npm (if configured)
- Deploys the application to GitHub Pages

The entire process is automated—you just need to create changesets and merge the version PR when ready to release.

## Creating a Changeset

When you make changes that should be tracked:

1. Run `npm run changeset` to create a changeset file
2. Select the change type (patch/minor/major) and provide a description
3. Commit the generated changeset file in `.changeset/`

For more information about contributing and creating changesets, see [CONTRIBUTING.md](./CONTRIBUTING.md).
