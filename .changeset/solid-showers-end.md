---
"recursica-forge": patch
---

Fix theme token persistence, plural token specifications, and elevation variables bugs

- Strictly enforced pluralization for token paths (`sizes`, `opacities`, `colors`) across the application, completely removing legacy fallbacks to singular syntax in alignment with the latest system spec.
- Fixed a bug where editing dimension (Size) and Opacity tokens via the UI Kit editor would fail to persist across mode switching. Edits are now properly dispatched to `varsStore` instead of just utilizing ephemeral CSS variable DOM injections.
- Addressed a critical bug in `varsStore` where customizing an elevation variable with the slider would result in invalid CSS output. Modified the logic so that customized elevations properly inject their explicit configuration rather than attempting to reference deleted base token references.
