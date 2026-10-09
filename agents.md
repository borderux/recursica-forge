# AGENTS.md

This file provides dedicated context and instructions for AI coding agents working on this project.

## Project Context
Recursica Forge is a design system and UI component builder. It uses a token-based architecture where components read styles from CSS variables defined in `recursica_ui-kit.json`.

## Core Instructions

### Component Usage
- **Prioritize Adapters:** Whenever a component exists as an adapter in `src/components/adapters/`, you MUST use that adapter instead of raw implementations or library-specific components directly.
  - Examples: `Slider`, `TextField`, `Label`, `Button`, `Chip`, `Switch`, `Badge`.
  - Path: `src/components/adapters/*.tsx`
- **Slider Component:** Always use the `Slider` adapter from `src/components/adapters/Slider.tsx` for all slider controls in toolbars and forms.

### Design System (recursica_tokens.json, recursica_brand.json, recursica_ui-kit.json)
- **DTCG Specification Compliance:** Any modifications to `recursica_tokens.json`, `recursica_brand.json`, or `recursica_ui-kit.json` MUST follow the latest stable **Design Tokens Community Group (DTCG)** technical report (e.g., v2025.10).
  - **Structure:**
    - Objects with a **`$value`** property are design tokens.
    - Objects without a `$value` property are groups.
  - **Reserved Properties:**
    - Use **`$value`** (mandatory for tokens), **`$type`** (mandatory for tokens/groups), **`$description`**, **`$extensions`**, **`$deprecated`**, and **`$extends`**.
  - **Naming Conventions:**
    - Token and group names MUST NOT start with `$`.
    - Names MUST NOT contain `{`, `}`, or `.` characters.
  - **Referencing (Aliases):**
    - Use curly brace syntax for references: `{path.to.token}`.
- **Always index properties:** Always refer to `recursica_ui-kit.json` to understand the structure of component properties, layers, and tokens.
- **Token Resolution:** Use provided utilities (like `readCssVar`, `readCssVarResolved`) to handle CSS variables and tokens correctly.

### Toolbar Implementation
- **Grouped Properties:** Follow the pattern of grouping related properties (e.g., `unselected-item`, `selected-item`) in toolbar configurations (`*.toolbar.json`).
- **PropControlContent:** Use `src/modules/toolbar/menu/floating-palette/PropControlContent.tsx` as the central place for rendering property controls. Follow existing patterns for handling different property types (`color`, `dimension`, `number`).

## Code Standards
- **TypeScript:** Use strict TypeScript. Define interfaces for props and state.
- **CSS Variables:** Favor CSS variables for theming. Build names with `buildComponentCssVarPath` from `src/components/utils/cssVarNames.ts`, passing explicit path segments. `getComponentCssVar` in the same file is deprecated — it guesses variant names out of the property string — so do not reach for it in new code.
- **Variable naming:** Segments are separated with underscores, e.g. `--recursica_ui-kit_components_button_variants_styles_solid_properties_colors_layer-0_background-color`. Hyphens appear only inside a single segment (`background-color`, `layer-0`) and in the handful of local helper variables in `src/styles/interactive-states.css`. A name spelled `--recursica-ui-kit-...` throughout does not exist.
- **Two name sets — do not mix them.** The app resolves its own variables at runtime; the export transform writes consumer CSS in a deliberately different scheme. In-app code uses the runtime form (`..._colors_layer-0_background-color`, `--recursica_brand_typography_body-font-weight`); the exported file uses the tidier one (`..._colors_background-color`, `--recursica_brand_typography_body_fontWeight`). Copying a name from an exported stylesheet into component code yields a variable that silently does not resolve. See the CSS Variable Guidelines in `src/components/COMPONENT_DEVELOPMENT_GUIDE.md`.
- **Patterns:** Prefer documented patterns from Knowledge Items (KIs) and existing codebase.
