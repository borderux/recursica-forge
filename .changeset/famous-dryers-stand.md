---
"recursica-forge": patch
---

Update test exports to match latest UI Kit schema:
- Deep-merged test export structures against the master UI Kit definition.
- Randomized token assignments while maintaining strict DTCG validation paths.
- Extracted and enforced strict number constraints mapped dynamically from Toolbar Component UI ranges.
- Refactored test JSON structures to exclusively encapsulate `ui-kit.components` specific definitions, dropping external `globals` objects.
- Cleaned up invalid, legacy token references by enforcing fallback randomization during updates.
