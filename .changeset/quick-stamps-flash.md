---
"recursica-forge": patch
---

- Fixed a bug causing the color picker overlay to permanently fail to open after detaching a property from a global reference.
- Reworked checkbox group properties by splitting the "selected" state into separate "enabled" and "disabled" groups in the UI Kit schema.
- Updated Mantine, Carbon, and Material checkbox adapters to correctly map split variables for checked, unchecked, and indeterminate disabled/enabled states.
- Expanded global reference controls in component toolbars, adding globe indicator icons and locking inputs when properties are attached to a global reference.
- Validated DTCG JSON export schemas for the newly restructured checkbox variants.
