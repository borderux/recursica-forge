/**
 * Utility functions for converting icon names to React components
 * 
 * This file uses the icon library abstraction to get icon components.
 * All icons should be accessed through this utility - no direct imports.
 */

import { getIcon, type IconComponent } from './iconLibrary'

/**
 * Convert icon name (kebab-case) to React component
 * e.g., "paint-brush" -> PaintBrush component
 * 
 * This is the main function to use for getting icons throughout the app.
 * It uses the icon library abstraction, so the underlying library can be
 * changed without updating this function.
 */
export function iconNameToReactComponent(
  iconName: string
): IconComponent | null {
  return getIcon(iconName)
}

/**
 * Legacy function name for backwards compatibility
 * @deprecated Use iconNameToReactComponent instead
 */
export function heroiconsNameToReactComponent(
  iconName: string
): IconComponent | null {
  return iconNameToReactComponent(iconName)
}




