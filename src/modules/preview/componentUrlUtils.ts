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
 */
export function slugToComponentName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
