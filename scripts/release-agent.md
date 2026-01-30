# Release Agent Script

A comprehensive script to prepare your branch for merging into main by syncing main, resolving conflicts, running all checks, and pushing the branch.

## Usage

```bash
npm run release-agent
```

Or directly:

```bash
./scripts/release-agent.sh
```

## What It Does

1. **Pre-flight Checks**
   - Verifies you're in a git repository
   - Checks for uncommitted changes (offers to stash them)
   - Ensures you're not on main branch

2. **Sync Main**
   - Fetches latest main branch
   - Merges main into your current branch
   - Handles merge conflicts (prompts for manual resolution)

3. **Run Checks** (with retry logic)
   - Type check (`npm run type-check`)
   - Tests (`npm test`)
   - Build (`npm run build`)

4. **Auto-fix Attempts**
   - Installs/updates dependencies if needed
   - Attempts to run lint:fix and format if available
   - Retries up to 5 times

5. **Push Branch**
   - Prompts to push branch to remote
   - Sets upstream tracking

## Features

- **Timeout Protection**: Each check has a 5-minute timeout to prevent hanging
- **Retry Logic**: Automatically retries failed checks up to 5 times
- **Conflict Handling**: Pauses for manual conflict resolution
- **Safe**: Won't push without confirmation
- **Portable**: Works on macOS and Linux (handles timeout command differences)

## Requirements

- Git repository
- Node.js and npm installed
- Current branch (not main)

## Example Output

```
ℹ Release Agent - Preparing branch for PR merge

ℹ Current branch: feature/my-feature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Fetching latest main branch
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Fetched latest main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Merging main into feature/my-feature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Successfully merged main into feature/my-feature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Running TypeScript type check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Type check passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Running tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Tests passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Running build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Build succeeded

✓ All checks passed!
```

## Troubleshooting

### Merge Conflicts
If conflicts occur, the script will pause and show conflicted files. After resolving:
1. Review and fix conflicted files
2. Stage resolved files: `git add <files>`
3. Complete merge: `git commit`
4. Press Enter to continue

### Timeout Issues
If checks timeout:
- Check for hanging processes: `pkill -f "vitest|vite"`
- Increase `TIMEOUT_SECONDS` in the script if needed
- On macOS, install `coreutils` for timeout: `brew install coreutils`

### Failed Checks
The script will attempt to auto-fix common issues:
- Missing dependencies → runs `npm ci`
- Linting issues → runs `npm run lint:fix` (if available)
- Formatting → runs `npm run format` (if available)

If auto-fix doesn't work, fix issues manually and run the script again.
