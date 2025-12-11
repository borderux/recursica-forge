# Adapter Rules

This document outlines the **mandatory rules** that must be followed when working with component adapters. These rules ensure consistency, maintainability, and proper separation of concerns.

## Core Principle

**Adapters must NEVER modify the underlying component structure. Only CSS overrides are allowed.**

## Rules

### 1. Never Modify Component Structure

- ❌ **DO NOT** wrap components in custom elements (spans, divs, etc.)
- ❌ **DO NOT** create custom wrapper elements for icons, text, or other content
- ❌ **DO NOT** conditionally render different component structures
- ❌ **DO NOT** modify the component's children prop structure
- ✅ **DO** use the component's native props as intended by the library
- ✅ **DO** pass icons through native icon props (e.g., `startIcon`, `leftSection`, etc.)
- ✅ **DO** pass children directly to the component

### 2. Use CSS Overrides Only

- ✅ **DO** use CSS files (`.css`) for all styling overrides
- ✅ **DO** use CSS custom properties (CSS variables) set on the root element for dynamic values
- ✅ **DO** use high-specificity selectors with `!important` when necessary to override library defaults
- ✅ **DO** use the component's native class names and data attributes for targeting
- ❌ **DO NOT** use inline styles for complex styling logic
- ❌ **DO NOT** modify component structure to apply styles

### 3. CSS Custom Properties Pattern

When you need dynamic values that depend on component state or props:

1. Set CSS custom properties on the root element's `style` prop
2. Reference those custom properties in the CSS file
3. Use `calc()` for calculations when needed

**Example:**
```tsx
// In adapter TSX file
style={{
  '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
  '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
  '--button-content-max-width': `var(${contentMaxWidthVar})`,
}}
```

```css
/* In adapter CSS file */
.button-root .button-label {
  max-width: calc(var(--button-content-max-width) - var(--button-icon-size) - var(--button-icon-text-gap)) !important;
}
```

### 4. Component Props Usage

- ✅ **DO** use the component's native props exactly as the library intended
- ✅ **DO** map unified props (from the adapter interface) to library-specific props
- ✅ **DO** use library-specific style props (e.g., Mantine's `styles`, Material's `sx`) only for simple overrides
- ❌ **DO NOT** use style props to create complex wrapper structures
- ❌ **DO NOT** conditionally change component structure based on props

### 5. Icon Handling

- ✅ **DO** pass icons through native icon props (`startIcon`, `leftSection`, `icon`, etc.)
- ✅ **DO** use CSS to size and space icons
- ✅ **DO** set CSS custom properties for icon size and gap
- ❌ **DO NOT** wrap icons in custom span/div elements
- ❌ **DO NOT** create custom icon rendering logic

### 6. Text Truncation

- ✅ **DO** use CSS for text truncation (`overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`)
- ✅ **DO** use CSS `calc()` with custom properties for dynamic max-width calculations
- ✅ **DO** target the component's native text/label elements via CSS
- ❌ **DO NOT** wrap text in custom span elements for truncation
- ❌ **DO NOT** modify children structure for truncation

### 7. CSS File Organization

- ✅ **DO** create a `.css` file alongside each adapter (e.g., `Button.css`)
- ✅ **DO** use high-specificity selectors to override library defaults
- ✅ **DO** use `!important` when necessary to override library styles
- ✅ **DO** add comments explaining why overrides are needed
- ❌ **DO NOT** put complex styling logic in the TSX file

### 8. Browser Compatibility

- ✅ **DO** use modern CSS features when available (e.g., `:has()` selector)
- ✅ **DO** provide fallbacks for older browsers when necessary
- ✅ **DO** test across different browsers and library versions

## Examples

### ✅ Correct: Using Native Props and CSS

```tsx
// Button.tsx
const mantineProps = {
  leftSection: icon ? icon : undefined, // Use native prop
  styles: {
    root: {
      // Only simple style overrides
    },
  },
  style: {
    // Set CSS custom properties for CSS file
    '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
  },
}
return <MantineButton {...mantineProps}>{children}</MantineButton>
```

```css
/* Button.css */
.mantine-Button-root .mantine-Button-leftSection {
  width: var(--button-icon-size) !important;
  height: var(--button-icon-size) !important;
}
```

### ❌ Incorrect: Modifying Component Structure

```tsx
// ❌ DO NOT DO THIS
const iconElement = icon ? (
  <span style={{ /* custom styles */ }}>
    <span>{icon}</span>
  </span>
) : undefined

const buttonChildren = children ? (
  <span style={{ /* truncation styles */ }}>
    {children}
  </span>
) : children

return <MantineButton leftSection={iconElement}>{buttonChildren}</MantineButton>
```

## Enforcement

When working with adapters:

1. **Always ask**: "Am I modifying the component structure?" If yes, refactor to use CSS only.
2. **Always ask**: "Can this be done with CSS?" If yes, move it to the CSS file.
3. **Always ask**: "Am I using the component's native props?" If no, refactor to use native props.

## AI Assistant Instructions

When an AI assistant is asked to modify an adapter:

1. **First check**: Does the change require modifying component structure? If yes, find a CSS-only solution.
2. **Review existing CSS**: Check if the CSS file already handles similar cases.
3. **Use CSS custom properties**: For dynamic values, set them on the root element and reference in CSS.
4. **Test the change**: Ensure the component still works with the library's native API.

## Questions?

If you're unsure whether a change violates these rules, ask:
- Does this modify the component's DOM structure?
- Can this be achieved with CSS only?
- Am I using the component's native props correctly?

If the answer to any of these is unclear, refactor to use CSS overrides only.

