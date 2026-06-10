---
"recursica-forge": patch
---

Fix issues with exporting and importing custom elevation (shadow) configurations. Ensure level-specific shadow directions are properly parsed from theme JSON on import, resolve direct color token references, and properly reconstruct the elevation state during bulk imports rather than resetting controls to empty.
