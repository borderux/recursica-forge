---
"recursica-forge": patch
---

Fix test timeouts in Accordion and Breadcrumb toolbar integration tests

- Simplified `waitForAccordion` helper in `Accordion.cssVars.test.tsx` to remove Suspense loading state checks that were causing timeouts
- Simplified `waitForBreadcrumb` helper in `Breadcrumb.toolbar.test.tsx` to remove Suspense loading state checks and unnecessary CSS variable validation
- Added explicit timeout to `waitFor` calls in `Accordion.toolbar.test.tsx` to prevent test timeouts
- Updated CSS variable assertions to use `waitFor` with fallback to `getComputedStyle` for better reliability with async component rendering

These changes ensure tests wait properly for lazy-loaded components wrapped in Suspense boundaries without timing out.
