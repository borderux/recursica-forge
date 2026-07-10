/**
 * Path Resolver Utility for Component Toolbars
 * Handles modern dot-notation keys (e.g., properties.colors.background-color)
 * and legacy keys with full backward compatibility.
 */

import type { ComponentName } from '../../../components/registry/types'

// Legacy flat property key to relative path mapping
const LEGACY_PROP_TO_PATH: Record<string, string> = {
  'background': 'properties.colors.background-color',
  'background-color': 'properties.colors.background-color',
  // NOTE: no bare 'text' alias — in the current config model a top-level bare "text" entry
  // means the text-STYLE group (properties.text.*), and text COLOR is always written
  // explicitly as "properties.colors.text-color". Aliasing 'text' to the color path hijacked
  // every component's "text style" control. Colors are addressed by their dotted path.
  'text-color': 'properties.colors.text-color',
  'icon': 'properties.colors.icon-color',
  'icon-color': 'properties.colors.icon-color',
  'border': 'properties.colors.border-color',
  'border-color': 'properties.colors.border-color',
  'hover-color': 'properties.colors.hover-color',
  'hover-opacity': 'properties.colors.hover-opacity',
  'disabled-opacity': 'properties.opacity',
  'opacity': 'properties.opacity',
  'elevation': 'properties.elevation',
  'hover-elevation': 'properties.elevation',
  'disabled-elevation': 'properties.elevation',
  
  // Dimensions and sizes
  'border-radius': 'properties.border-radius',
  'border-size': 'properties.border-size',
  'height': 'properties.height',
  'min-width': 'properties.min-width',
  'max-label-width': 'properties.max-label-width',
  'horizontal-padding': 'properties.horizontal-padding',
  'padding': 'properties.horizontal-padding',
  'icon-size': 'properties.icon-size',
  'icon-text-gap': 'properties.icon-text-gap',
  'text-style': 'properties.text-style',
}

/**
 * Normalizes any legacy or modern toolbar key to a standard dot-notation relative path.
 * e.g., "background" -> "properties.colors.background-color"
 */
export function normalizeToolbarKey(key: string): string {
  const cleanKey = key.trim().toLowerCase()
  if (cleanKey.startsWith('properties.')) {
    return cleanKey
  }
  return LEGACY_PROP_TO_PATH[cleanKey] || `properties.${cleanKey}`
}

/**
 * Resolves a standardized relative path to the fully qualified path inside recursica_ui-kit.json.
 * Automatically injects the selected layer, handles style variants, and state tabs.
 * 
 * @param componentName Component name (e.g. "Button")
 * @param relativePath Standardized path (e.g. "properties.colors.background-color")
 * @param selectedLayer Active layer (e.g. "layer-0")
 * @param activeVariantStyle Active style variant (e.g., "solid")
 * @param activeState Active state tab ("base", "hover", "focus", "disabled")
 * @returns Array of path segments to query / write in UIKit JSON
 */
export function resolveFullUIPath(
  componentName: ComponentName,
  relativePath: string,
  selectedLayer: string,
  activeVariantStyle: string | undefined,
  activeState: string = 'base'
): string[] {
  let compKey = componentName.toLowerCase().replace(/\s+/g, '-')
  if (compKey === 'checkbox-group-item') compKey = 'checkbox-item'
  if (compKey === 'radio-button-group-item') compKey = 'radio-button-item'
  if (compKey === 'switch-group-item') compKey = 'switch-item'
  if (compKey === 'switchitem') compKey = 'switch-item'
  if (compKey === 'hover-card-/-popover') compKey = 'hover-card-popover'

  // 1. Resolve normalized path segments
  const normPath = normalizeToolbarKey(relativePath)
  const segments = normPath.split('.')

  // 2. Inject layer reference where "colors" is followed by a color property
  const layerInjected: string[] = []
  for (let i = 0; i < segments.length; i++) {
    layerInjected.push(segments[i])
    if (segments[i] === 'colors' && i < segments.length - 1 && segments[i + 1] !== selectedLayer) {
      layerInjected.push(selectedLayer)
    }
  }

  // If layer-0 or another layer was hardcoded, deduplicate it
  const finalSegments: string[] = []
  for (const seg of layerInjected) {
    if (seg.startsWith('layer-') && seg !== selectedLayer) {
      continue // Skip other hardcoded layers
    }
    finalSegments.push(seg)
  }

  // 3. Construct the path depending on style variants and active interaction states:
  const isState = activeState && activeState !== 'base'

  if (isState) {
    // State tab is active (e.g. "hover", "focus", "disabled")
    if (activeVariantStyle) {
      return [
        'components',
        compKey,
        'variants',
        'styles',
        activeVariantStyle,
        'variants',
        'states',
        activeState,
        ...finalSegments
      ]
    } else {
      return [
        'components',
        compKey,
        'variants',
        'states',
        activeState,
        ...finalSegments
      ]
    }
  } else {
    // Base tab
    if (activeVariantStyle) {
      return [
        'components',
        compKey,
        'variants',
        'styles',
        activeVariantStyle,
        ...finalSegments
      ]
    } else {
      return [
        'components',
        compKey,
        ...finalSegments
      ]
    }
  }
}
