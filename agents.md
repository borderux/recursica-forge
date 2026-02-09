# AGENTS.md

This file provides dedicated context and instructions for AI coding agents working on this project.

## Project Context
Recursica Forge is a design system and UI component builder. It uses a token-based architecture where components read styles from CSS variables defined in `src/vars/UIKit.json`.

## Core Instructions

### Component Usage
- **Prioritize Adapters:** Whenever a component exists as an adapter in `src/components/adapters/`, you MUST use that adapter instead of raw implementations or library-specific components directly.
  - Examples: `Slider`, `TextField`, `Label`, `Button`, `Chip`, `Switch`, `Badge`.
  - Path: `src/components/adapters/*.tsx`
- **Slider Component:** Always use the `Slider` adapter from `src/components/adapters/Slider.tsx` for all slider controls in toolbars and forms.

### Design System (tokens.json, brand.json, UIKit.json)
- **DTCG Specification Compliance:** Any modifications to `tokens.json`, `brand.json`, or `UIKit.json` MUST follow the latest stable **Design Tokens Community Group (DTCG)** technical report (e.g., v2025.10).
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
- **Always index properties:** Always refer to `src/vars/UIKit.json` to understand the structure of component properties, layers, and tokens.
- **Token Resolution:** Use provided utilities (like `readCssVar`, `readCssVarResolved`) to handle CSS variables and tokens correctly.

### Toolbar Implementation
- **Grouped Properties:** Follow the pattern of grouping related properties (e.g., `unselected-item`, `selected-item`) in toolbar configurations (`*.toolbar.json`).
- **PropControlContent:** Use `src/modules/toolbar/menu/floating-palette/PropControlContent.tsx` as the central place for rendering property controls. Follow existing patterns for handling different property types (`color`, `dimension`, `number`).

## Code Standards
- **TypeScript:** Use strict TypeScript. Define interfaces for props and state.
- **CSS Variables:** Favor CSS variables for theming. Use `getComponentCssVar` and related helpers from `src/utils/cssVarNames.ts`.
- **Patterns:** Prefer documented patterns from Knowledge Items (KIs) and existing codebase.
