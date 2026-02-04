---
"recursica-forge": patch
---

Fix CI validation failures and optimize build size.

- Suppressed CSS variable validation error logging in test environment to prevent CI failures.
- Isolated `runCssVarAudit` utility to development environment only using dynamic imports, excluding it from production builds.
- Fixed a build error in `GitHubExportModal` by importing missing `API_ENDPOINTS`.
