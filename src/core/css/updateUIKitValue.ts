/**
 * Utility to update UIKit JSON when toolbar changes component properties
 */

import { getVarsStore } from '../store/varsStore'
import { BRAND_PREFIX, cssVarToRef } from '../css/cssVarBuilder'

/**
 * Converts a UIKit CSS variable name to a JSON path
 * Does a greedy match against the actual UIKit JSON schema to properly
 * handle hyphenated keys like `border-size` or `min-height`.
 * 
 * @example
 * cssVarToUIKitPath('--recursica_ui-kit_themes_light_components_chip_variants_styles_unselected_properties_colors_layer-0_background', currentUIKit)
 */
function cssVarToUIKitPath(cssVar: string, rootObj: any): string[] | null {
    const match = cssVar.match(/^--recursica_ui-kit_(?:themes_(?:light|dark)_)?(.+)$/)
    if (!match) return null

    const pathString = match[1]
    const parts = pathString.split('_')
    const path: string[] = ['ui-kit']
    let current = rootObj?.['ui-kit'] || rootObj
    let i = 0

    while (i < parts.length) {
        if (!current || typeof current !== 'object') {
            // Reached a leaf or undefined node, assume the rest is one long hyphenated key
            path.push(parts.slice(i).join('_'))
            break
        }

        // Greedy match: try longest possible key combinations
        let matched = false
        for (let j = parts.length; j > i; j--) {
            const candidateKey = parts.slice(i, j).join('-')  // JSON keys use hyphens internally
            if (candidateKey in current) {
                path.push(candidateKey)
                current = current[candidateKey]
                i = j
                matched = true
                break
            }
        }

        // If no match found in schema, fallback to word-by-word
        if (!matched) {
            path.push(parts[i])
            current = current[parts[i]]
            i++
        }
    }

    return path
}

/**
 * Updates a value in the UIKit JSON at the specified path
 * 
 * @param cssVar - The CSS variable name
 * @param value - The new value
 */
export function updateUIKitValue(cssVar: string, value: string): boolean {
    // Get current UIKit JSON
    const currentUIKit = getVarsStore().getState().uikit
    if (!currentUIKit || typeof currentUIKit !== 'object') {
        console.warn('[updateUIKitValue] UIKit state is not available')
        return false
    }

    const path = cssVarToUIKitPath(cssVar, currentUIKit)
    if (!path) {
        console.warn(`[updateUIKitValue] Could not parse CSS var: ${cssVar}`)
        return false
    }

    // IMPORTANT: Mutate currentUIKit directly for performance!
    // Since this runs 60 times a second on slider drags, deep cloning freezes the UI.
    // VarsStore's writeState method now safely debounces the LocalStorage save.
    const updatedUIKit = currentUIKit

    // Navigate to the target location
    let current: any = updatedUIKit
    for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i]
        if (!current[segment]) {
            current[segment] = {}
        }
        current = current[segment]
    }

    // Get the final key
    const finalKey = path[path.length - 1]

    // Convert the value to the proper format
    // If it's a CSS variable reference, resolve it to its DTCG JSON path representation.
    let tokenValue = value
    const resolvedRef = cssVarToRef(value)
    
    if (resolvedRef) {
        tokenValue = resolvedRef
    } else if (value.includes('var(')) {
        // ARCHITECTURAL DECISION:
        // Why we drop unrecognized var() strings here instead of storing them:
        // The GUI sends var(...) because it must execute updateCssVar() to mutate the live DOM
        // for 60FPS realtime responsiveness (sliders, pickers). But it is semantically incorrect
        // to serialize a CSS declaration into the DTCG JSON store. If cssVarToRef fails to
        // securely translate it back to a {reference}, we must hard-reject it at the entry gate 
        // to prevent corrupting the JSON payload and failing the export validator later.
        console.warn(`[updateUIKitValue] Rejected unmapped CSS variable from entering JSON store: ${value}`)
        return false
    }

    // Parse value if it's a pixel dimension
    let numericValue: string | number = tokenValue
    let isDimensionHint = false

    if (typeof tokenValue === 'string') {
        if (tokenValue.endsWith('px')) {
            const parsed = parseFloat(tokenValue)
            if (!isNaN(parsed)) {
                numericValue = parsed
                isDimensionHint = true
            }
        } else if (tokenValue.includes('.dimensions.')) {
            isDimensionHint = true
        }
    }

    // Update the value, preserving $type if it exists
    if (current[finalKey] && typeof current[finalKey] === 'object') {
        const existingType = (current[finalKey] as any).$type
        const hasUnitObject = current[finalKey].$value && typeof current[finalKey].$value === 'object' && 'unit' in current[finalKey].$value

        if (existingType === 'dimension' || hasUnitObject) {
            current[finalKey].$type = existingType || 'dimension'
            current[finalKey].$value = { value: numericValue, unit: 'px' }
        } else if (existingType === 'number') {
            current[finalKey].$value = numericValue
        } else {
            // Keep original format (e.g., color, raw string)
            current[finalKey].$value = tokenValue
        }
    } else {
        // Create new entry
        if (isDimensionHint) {
            current[finalKey] = {
                $type: 'dimension',
                $value: { value: numericValue, unit: 'px' }
            }
        } else {
            current[finalKey] = {
                $type: 'color', // Fallback
                $value: tokenValue
            }
        }
    }

    getVarsStore().setUiKitSilent(updatedUIKit)

    return true
}

/**
 * Removes a UIKit value (resets to default by removing the override)
 * Note: This doesn't actually delete the key, it would need to restore the original default value
 * For now, we'll just document that "None" removes the CSS var but doesn't update JSON
 * 
 * @param cssVar - The CSS variable name
 */
export function removeUIKitValue(cssVar: string): boolean {
    // For now, removing a color just removes the CSS variable
    // The UIKit JSON will still have the default value
    // This is acceptable because recomputeAndApplyAll will regenerate from JSON
    return true
}
