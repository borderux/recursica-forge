# Header, Sidebar, and Page Redesign Plan

Based on the Figma design, this document outlines the plan to update the header navigation, sidebar navigation, and page layout to match the design specifications.

## Overview

The design shows:
- **Header**: Logo + brand name, navigation tabs (Tokens, Theme, Components), action buttons (refresh, download, upload), framework dropdown (Mantine), theme toggle
- **Sidebar**: "Tokens" heading, vertical navigation (Color, Font, Opacity & Size), footer links (Visit Recursica.com, Read documentation, Help), copyright
- **Main Content**: Color scales with numerical scale (1000-000) on the left

## Current State Analysis

### Header (MantineShell.tsx, MaterialShell.tsx, CarbonShell.tsx)
- ✅ Logo and brand name already implemented
- ✅ Navigation buttons (Tokens, Theme, Components) exist
- ✅ Action buttons (refresh, download, upload) exist
- ✅ Framework dropdown exists
- ✅ Theme toggle exists
- ⚠️ Styling needs refinement to match design (active states, spacing, colors)

### Sidebar (Currently in TokensPage.tsx)
- ✅ Navigation items (Color, Font, Opacity, Size) exist
- ❌ Sidebar is embedded in TokensPage, not in Shell
- ❌ Missing "Tokens" heading
- ❌ Missing footer links (Visit Recursica.com, Read documentation, Help)
- ❌ Missing copyright notice
- ⚠️ Styling needs update (active indicator, spacing, colors)

### Main Content (ColorTokens.tsx)
- ✅ Color scales exist
- ⚠️ Layout may need adjustment to match design spacing

## Implementation Plan

### Phase 1: Sidebar Extraction and Enhancement

#### 1.1 Create Shared Sidebar Component
- **File**: `src/modules/app/Sidebar.tsx` (new)
- **Purpose**: Extract sidebar logic from TokensPage and make it reusable
- **Features**:
  - "Tokens" heading at top
  - Vertical navigation items (Color, Font, Opacity & Size)
  - Active state indicator (red vertical bar on left)
  - Footer links section
  - Copyright notice
- **CSS Variables to Use**:
  - `--recursica-brand-{mode}-layer-layer-1-property-surface` (background)
  - `--recursica-brand-{mode}-layer-layer-1-property-border-color` (borders)
  - `--recursica-brand-{mode}-layer-layer-1-property-element-text-color` (text)
  - `--recursica-brand-{mode}-palettes-core-interactive` (active state)
  - `--recursica-brand-dimensions-spacer-*` (spacing)

#### 1.2 Update Shell Components
- **Files**: `src/modules/app/shells/MantineShell.tsx`, `MaterialShell.tsx`, `CarbonShell.tsx`
- **Changes**:
  - Add sidebar to shell layout (left side)
  - Use AppShell or equivalent layout component if available
  - Pass current route and sub-route to Sidebar component
  - Ensure sidebar is only visible on `/tokens` route

#### 1.3 Update TokensPage
- **File**: `src/modules/tokens/TokensPage.tsx`
- **Changes**:
  - Remove sidebar navigation (moved to Shell)
  - Keep only the main content area
  - Update layout to work with sidebar in Shell

### Phase 2: Header Styling Updates

#### 2.1 Navigation Tabs Styling
- **Files**: All Shell components
- **Changes**:
  - Update Button component styling for navigation tabs
  - Ensure active tab uses solid variant with proper color
  - Use CSS variables for all colors and spacing
  - Match design spacing and typography

#### 2.2 Action Buttons Styling
- **Files**: All Shell components
- **Changes**:
  - Ensure icon buttons use proper CSS variables
  - Match icon sizes and spacing from design
  - Use outline variant with proper styling

#### 2.3 Theme Toggle Styling
- **Files**: All Shell components
- **Changes**:
  - Update Switch component styling
  - Use sun/moon icons (check if available or use emoji/unicode)
  - Ensure proper active state styling

### Phase 3: Sidebar Navigation Styling

#### 3.1 Navigation Items
- **File**: `src/modules/app/Sidebar.tsx`
- **Changes**:
  - Style navigation items with proper spacing
  - Add active state indicator (red vertical bar on left)
  - Use CSS variables for all styling
  - Ensure proper hover states

#### 3.2 Footer Links
- **File**: `src/modules/app/Sidebar.tsx`
- **Changes**:
  - Add footer links section at bottom
  - Style links with red color (use interactive color CSS variable)
  - Add proper spacing

#### 3.3 Copyright Notice
- **File**: `src/modules/app/Sidebar.tsx`
- **Changes**:
  - Add copyright text: "© 2025 Border LLC. All rights reserved."
  - Style with appropriate text color and size

### Phase 4: Main Content Layout Updates

#### 4.1 Color Scales Layout
- **File**: `src/modules/tokens/colors/ColorTokens.tsx`
- **Changes**:
  - Ensure numerical scale (1000-000) is properly aligned on left
  - Match spacing and layout from design
  - Use CSS variables for all spacing

#### 4.2 "Add color scale" Button
- **File**: `src/modules/tokens/colors/ColorTokens.tsx`
- **Changes**:
  - Update button styling to match design (red outline)
  - Use Button component with proper variant
  - Ensure proper positioning

## CSS Variables Reference

### Colors
- Background: `var(--recursica-brand-{mode}-layer-layer-{n}-property-surface)`
- Text: `var(--recursica-brand-{mode}-layer-layer-{n}-property-element-text-color)`
- Border: `var(--recursica-brand-{mode}-layer-layer-{n}-property-border-color)`
- Interactive/Active: `var(--recursica-brand-{mode}-palettes-core-interactive)`

### Spacing
- Small: `var(--recursica-brand-dimensions-spacer-sm)`
- Default: `var(--recursica-brand-dimensions-spacer-default)`
- Medium: `var(--recursica-brand-dimensions-spacer-md)`
- Large: `var(--recursica-brand-dimensions-spacer-lg)`
- Extra Large: `var(--recursica-brand-dimensions-spacer-xl)`

### Typography
- Font sizes: `var(--recursica-brand-dimensions-{sm|md|lg})`
- Font weights: `var(--recursica-brand-typography-*-font-weight)`

## Components to Use

1. **Button Component** (`src/components/adapters/Button.tsx`)
   - Use for navigation tabs, action buttons, and "Add color scale" button
   - Variants: `solid` (active tab), `outline` (action buttons, add button), `text` (inactive tabs)

2. **Tabs Component** (`src/components/adapters/Tabs.tsx`)
   - Consider using for header navigation if it provides better styling options
   - Otherwise, use Button components with proper styling

3. **Select Component** (from UI kit)
   - Use for framework dropdown (Mantine/Material/Carbon)

4. **Switch Component** (from UI kit)
   - Use for theme toggle

## Questions for Clarification

1. **Sidebar Visibility**: Should the sidebar only appear on the `/tokens` route, or should it be visible on other routes too? (Design shows it on Tokens page)

2. **Navigation Items**: The design shows "Opacity & Size" as a single item, but the current implementation has them separate. Should we:
   - Combine them into one navigation item?
   - Keep them separate but styled differently?

3. **Footer Links**: What should the footer links do?
   - "Visit Recursica.com" - external link?
   - "Read documentation" - internal route or external?
   - "Help" - modal, route, or external link?

4. **Active State Indicator**: The design shows a red vertical bar on the left of the active item. Should this use the interactive color CSS variable (`--recursica-brand-{mode}-palettes-core-interactive`)?

5. **Theme Toggle Icons**: Should we use:
   - Heroicons (sun/moon icons)?
   - Unicode characters (☀️/🌙)?
   - SVG icons?

6. **Sidebar Width**: What should be the sidebar width? (Design appears to show ~200-250px)

7. **Responsive Behavior**: How should the sidebar behave on smaller screens? (Collapse, overlay, etc.)

## Implementation Order

1. ✅ Create Sidebar component with basic structure
2. ✅ Extract sidebar from TokensPage
3. ✅ Add sidebar to Shell components
4. ✅ Style sidebar navigation items
5. ✅ Add footer links and copyright
6. ✅ Update header navigation styling
7. ✅ Update action buttons styling
8. ✅ Update theme toggle styling
9. ✅ Refine main content layout
10. ✅ Test across all UI kits (Mantine, Material, Carbon)

## Testing Checklist

- [ ] Sidebar appears correctly on `/tokens` route
- [ ] Navigation items highlight correctly when selected
- [ ] Footer links work as expected
- [ ] Header navigation tabs work correctly
- [ ] Action buttons function properly
- [ ] Theme toggle works and styles correctly
- [ ] All styling uses CSS variables
- [ ] Layout matches design across all UI kits
- [ ] Responsive behavior works (if applicable)

