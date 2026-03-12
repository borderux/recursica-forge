---
trigger: always_on
---

1. No Fallbacks or Workarounds
Direct Solutions Only: Never implement "fail-safe" fallbacks or "graceful degradation" workarounds that mask underlying architectural flaws.

Error Visibility: If a required dependency or data point is missing, the application should fail loudly. Do not write "if-else" logic to provide dummy data or bypass broken components.

No "Hack" Comments: Code containing "TODO: fix this later" or "Workaround for X" is strictly prohibited. Address the root cause in the initial changeset.

2. Logic Preservation
Zero Preservation: Do not attempt to preserve "legacy" logic or "just-in-case" code blocks when refactoring.

Clean Slate: If a function or component is being updated, remove all previous logic that is no longer 100% essential to the new requirement. Do not comment out old code; delete it.

3. CSS First, JavaScript Last
Declarative over Imperative: Always prioritize CSS features (Flexbox, Grid, CSS Variables, @support, :has(), Media Queries) over JavaScript-based layout or state calculations.

Animations: Use CSS Transitions and Keyframes for all UI animations. Only use JS for animations if they require complex, non-linear mathematical synchronized data points.

State UI: Use CSS pseudo-classes (:focus-within, :target, :checked) to handle UI states before reaching for useState or DOM manipulation.

4. Pre-Commit Cleanup
Instrumentation Removal: Before finalizing any changeset, scan all modified files for debugging artifacts.

Prohibited Items:

console.log, console.warn, console.error

debugger statements

Performance markers or manual timers

Dev-only labels or "breadcrumbs"

Automated Verification: The agent must verify that no "temporary" code used during the development of the feature remains in the final submission.