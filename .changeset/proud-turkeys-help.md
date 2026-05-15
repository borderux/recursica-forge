---
"recursica-forge": patch
---

## Reset Now Clears localStorage

- `localStorage.clear()` is called immediately after `resetAll()` in the reset handler of `MantineShell`, `MaterialShell`, and `CarbonShell`
- This ensures no stale versioned token state, cached overrides, or corrupted data persists after a hard reset to forge defaults
- The save reminder session counters (`sessionStorage`) are also cleared via `resetSaveReminder()` as part of the same reset flow
