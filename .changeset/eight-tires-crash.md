---
"recursica-forge": patch
---

**Export: skip compliance modal when there are no issues**
- `exportWithCompliance.tsx` — `handleExport` accepts an optional `knownIssueCount` parameter; when the caller passes `0` the AA compliance re-scan is skipped entirely and the export selection modal opens immediately
- `MantineShell`, `CarbonShell`, `MaterialShell` — export button `onClick` now passes the live `issueCount` from `ComplianceContext` so the shortcut takes effect automatically when the badge shows zero issues
