/**
 * Utility functions for converting component names to/from URL slugs
 */

/**
 * Convert a component display name to a URL slug (lowercase with hyphens)
 * Examples:
 * - "Button" → "button"
 * - "Text field" → "text-field"
 * - "Date picker" → "date-picker"
 */
export function componentNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Convert a URL slug back to a component display name
 * Examples:
 * - "button" → "Button"
 * - "text-field" → "Text field"
 * - "date-picker" → "Date picker"
 * - "menu-item" → "Menu item"
 */
export function slugToComponentName(slug: string): string {
  const words = slug.split('-')
  return words
    .map((word, index) => 
      index === 0 
        ? word.charAt(0).toUpperCase() + word.slice(1) // First word: capitalize first letter
        : word.toLowerCase() // Subsequent words: lowercase
    )
    .join(' ')
}
