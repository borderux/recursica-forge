---
"recursica-forge": patch
---

- Created a JSON import migration utility to seamlessly upgrade legacy JSON file structures (e.g., `tokens.opacity` -> `tokens.opacities`) and convert raw CSS variable injections back to DTCG format upon import.
- Fixed 40+ false-positive errors in the CSS variable audit tool by properly parsing and allowing expected synthetic fallback variables (`interactive_hover_tone`, `interactive_default_on-tone`, etc.) in stylesheet traces.
- Suppressed false-positive undefined variable errors for components (like `Switch`) by adding inline computed style evaluation to `deepAuditCssVars`, accurately reflecting variables injected dynamically via React `style` props.
