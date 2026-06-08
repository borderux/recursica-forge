---
"recursica-forge": patch
---

- Fixed a mode-awareness bug in the toolbars where editing CSS variables updated the wrong theme mode paths due to stale memoized `mode` values.
- Overhauled the component `handleReset` logic to deeply clone pristine JSON nodes instead of iteratively removing variables, preventing orphaned variables and "null color" UI bugs.
- Standardized typography typestyles (`h2Style`, `pStyle`) across 22 component previews, correctly positioning the spread operator to preserve local overrides.
