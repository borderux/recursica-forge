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

### Tests Pass Locally But Fail in CI
If tests pass locally but fail in CI, check:

1. **Config Files**: Ensure `vite.config.js` and `vite.config.ts` are in sync
   - Both should have `testTimeout: 60000`
   - Both should have `globalSetup: ['./vitest.global-setup.ts']`
   - Both should have `singleFork: true` for sequential execution

2. **Test Command**: The script runs `npm run test -- --run` (same as CI)
   - If tests pass with `npm test` but fail with `npm run test -- --run`, there's a difference
   - Check for environment-specific issues

3. **Clean State**: CI runs `npm ci` (clean install)
   - The script also runs `npm ci` to match CI state
   - Delete `node_modules` and reinstall if issues persist

4. **Global Setup**: Ensure `vitest.global-setup.ts` exists and preloads components
   - Check console output for "Preloading components..." message
   - Verify components are being preloaded before tests run

### Timeout Issues
If checks timeout:
- Check for hanging processes: `pkill -f "vitest|vite"`
- Increase `TIMEOUT_SECONDS` in the script if needed
- On macOS, install `coreutils` for timeout: `brew install coreutils`
- Verify `testTimeout` in vite config files is set to 60000

### Failed Checks
The script will attempt to auto-fix common issues:
- Missing dependencies → runs `npm ci` (matching CI)
- Linting issues → runs `npm run lint:fix` (if available)
- Formatting → runs `npm run format` (if available)

If auto-fix doesn't work, fix issues manually and run the script again.

### Why Tests Might Pass Locally But Fail in CI
- **Cached Components**: Local runs may have components already loaded from previous runs
- **Parallel Execution**: CI might run tests in parallel if config is wrong
- **Global Setup**: CI might not run global setup if config is missing
- **Timeout Differences**: CI might use different timeout if config files are out of sync

The release agent script runs tests the same way CI does to catch these issues before they reach CI.
