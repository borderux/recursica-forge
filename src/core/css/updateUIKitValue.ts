/**
 * Utility to update UIKit JSON when toolbar changes component properties
 */

import { getVarsStore } from '../store/varsStore'

/**
 * Converts a UIKit CSS variable name to a JSON path
 * 
 * @example
 * cssVarToUIKitPath('--recursica-ui-kit-themes-light-components-chip-variants-styles-unselected-properties-colors-layer-0-background')
 * => ['ui-kit', 'components', 'chip', 'variants', 'styles', 'unselected', 'properties', 'colors', 'layer-0', 'background']
 */
function cssVarToUIKitPath(cssVar: string): string[] | null {
    // Remove the prefix and mode
    // Format: --recursica-ui-kit-themes-{mode}-components-...
    // But UIKit JSON doesn't have mode in the path, so we strip it
    const match = cssVar.match(/^--recursica-ui-kit-themes-(light|dark)-(.+)$/)
    if (!match) return null

    const pathString = match[2] // e.g., "components-chip-variants-styles-unselected-properties-colors-layer-0-background"

    // Split and reconstruct, handling known multi-word segments
    const parts = pathString.split('-')
    const path: string[] = ['ui-kit']
    let i = 0

    while (i < parts.length) {
        const part = parts[i]

        // Check for known multi-word segments
        if (part === 'layer' && i + 1 < parts.length && /^\d+$/.test(parts[i + 1])) {
            // layer-0, layer-1, etc.
            path.push(`${part}-${parts[i + 1]}`)
            i += 2
        } else if (part === 'border' && i + 1 < parts.length && parts[i + 1] === 'color') {
            // border-color
            path.push('border-color')
            i += 2
        } else {
            path.push(part)
            i++
        }
    }

    return path
}

/**
 * Updates a value in the UIKit JSON at the specified path
 * 
 * @param cssVar - The CSS variable name (e.g., '--recursica-ui-kit-themes-light-components-chip-...')
 * @param value - The new value (e.g., '{brand.palettes.palette-1.500.tone}')
 */
export function updateUIKitValue(cssVar: string, value: string): boolean {
    const path = cssVarToUIKitPath(cssVar)
    if (!path) {
        console.warn(`[updateUIKitValue] Could not parse CSS var: ${cssVar}`)
        return false
    }

    // Get current UIKit JSON
    const currentUIKit = getVarsStore().getState().uikit
    if (!currentUIKit || typeof currentUIKit !== 'object') {
        console.warn('[updateUIKitValue] UIKit state is not available')
        return false
    }

    // Deep clone the UIKit JSON
    const updatedUIKit = JSON.parse(JSON.stringify(currentUIKit))

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
    // If it's a var() reference, extract the token path
    let tokenValue = value
    if (value.startsWith('var(--recursica-brand-themes-')) {
        // Extract: var(--recursica-brand-themes-light-palettes-palette-1-500-tone)
        // Convert to: {brand.themes.light.palettes.palette-1.500.tone}
        const varMatch = value.match(/var\(--recursica-brand-themes-(.+)\)/)
        if (varMatch) {
            // Don't blindly replace all hyphens - need to be smarter
            // The pattern is: mode-section-subsection-...-property
            // e.g., light-palettes-palette-1-500-tone
            const parts = varMatch[1].split('-')
            const tokenParts = ['brand', 'themes']

            let i = 0
            // First part is mode (light/dark)
            if (i < parts.length) {
                tokenParts.push(parts[i])
                i++
            }

            // Rest of the parts - need to handle multi-word segments
            while (i < parts.length) {
                const part = parts[i]

                // Check for known multi-word patterns
                if (part === 'palette' && i + 1 < parts.length && /^\d+$/.test(parts[i + 1])) {
                    // palette-1, palette-2, etc.
                    tokenParts.push(`${part}-${parts[i + 1]}`)
                    i += 2
                } else if (/^\d+$/.test(part) && i + 1 < parts.length && parts[i + 1] === 'tone') {
                    // 500-tone, 100-tone, etc.
                    tokenParts.push(`${part}.tone`)
                    i += 2
                } else if (/^\d+$/.test(part) && i + 1 < parts.length && parts[i + 1] === 'color') {
                    // 500-color
                    tokenParts.push(`${part}.color`)
                    i += 2
                } else {
                    tokenParts.push(part)
                    i++
                }
            }

            tokenValue = `{${tokenParts.join('.')}}`
        }
    } else if (value.startsWith('var(--recursica-tokens-')) {
        // Extract: var(--recursica-tokens-colors-scale-01-500)
        // Convert to: {tokens.colors.scale-01.500}
        const varMatch = value.match(/var\(--recursica-tokens-(.+)\)/)
        if (varMatch) {
            const tokenPath = varMatch[1].replace(/-/g, '.')
            tokenValue = `{tokens.${tokenPath}}`
        }
    }

    // Update the value, preserving $type if it exists
    if (current[finalKey] && typeof current[finalKey] === 'object' && '$type' in current[finalKey]) {
        current[finalKey].$value = tokenValue
    } else {
        // Create new entry with type
        current[finalKey] = {
            $type: 'color', // Assume color for now, could be enhanced
            $value: tokenValue
        }
    }

    // Update the store
    getVarsStore().setUiKit(updatedUIKit)

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
