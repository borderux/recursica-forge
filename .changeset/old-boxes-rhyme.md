---
"recursica-forge": patch
---

Fix global ref modal cancellation logic.

When the global property conflict modal (e.g., "Apply global form changes") was dismissed via the "X" button or by clicking outside, it incorrectly kept the component-level override intact instead of cancelling the action. 

This has been resolved by implementing a strict `cancel` decision flow in the `globalRefInterceptor`. When cancelled, the interceptor now forcibly restores the original CSS variable mapping to follow the global token, restores the original `{ui-kit.globals.*}` DTCG reference in the JSON store, and triggers a UI state update to correctly reset the toolbar controls back to their original values.
