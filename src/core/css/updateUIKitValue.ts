/**
 * Utility to update UIKit JSON when toolbar changes component properties
 */

import { getVarsStore } from '../store/varsStore'
import { cssVarToRef } from '../css/cssVarBuilder'

/**
 * Converts a UIKit CSS variable name to a JSON path
 * Does a greedy match against the actual UIKit JSON schema to properly
 * handle hyphenated keys like `border-size` or `min-height`.
 * 
 * @example
 * cssVarToUIKitPath('--recursica_ui-kit_themes_light_components_chip_variants_styles_unselected_properties_colors_layer-0_background', currentUIKit)
 */
export function cssVarToUIKitPath(cssVar: string, rootObj: any): string[] | null {
    const match = cssVar.match(/^--recursica_ui-kit_(?:themes_(?:light|dark)_)?(.+)$/)
    if (!match) return null

    const pathString = match[1]
    const parts = pathString.split('_')
    const path: string[] = ['ui-kit']
    let current = rootObj?.['ui-kit'] || rootObj
    let i = 0

    while (i < parts.length) {
        if (!current || typeof current !== 'object') {
            // Reached a leaf or undefined node, append the remaining parts as individual path segments
            path.push(...parts.slice(i))
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
        return false
    }

    const path = cssVarToUIKitPath(cssVar, currentUIKit)
    if (!path) {
        return false
    }

    // IMPORTANT: Use path-based shallow cloning (immutable update)
    // This ensures that React/Zustand detects a state reference change and persists it
    // seamlessly without the massive CPU penalty of deep-cloning an entire JSON structure.
    const updatedUIKit = Array.isArray(currentUIKit) ? [...currentUIKit] : { ...currentUIKit }

    // Navigate to the target location, cloning each node along the path
    let current: any = updatedUIKit
    for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i]
        if (!current[segment]) {
            current[segment] = {}
        } else {
            // Shallow clone the next segment to break reference equality
            current[segment] = Array.isArray(current[segment]) ? [...current[segment]] : { ...current[segment] }
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
        return false
    }

    // ── Component color guard ──────────────────────────────────────────────────
    // Properties under `_properties_colors_` MUST reference brand or ui-kit tokens.
    // Raw values (hex, named colors) and token-level refs ({tokens.*}) are forbidden
    // because component colors must always be driven by the brand design system.
    if (cssVar.includes('_properties_colors_') && typeof tokenValue === 'string' && tokenValue.startsWith('{')) {
        const inner = tokenValue.slice(1, -1)
        if (!inner.startsWith('brand.') && !inner.startsWith('ui-kit.')) {
            throw new Error(
                `[updateUIKitValue] Component color properties must reference brand or ui-kit tokens. ` +
                `Received: "${tokenValue}" at path: ${cssVar}`
            )
        }
    }

    // Parse value if it's a pixel dimension
    let numericValue: string | number = tokenValue
    let isDimensionHint = false
    let isTypographyHint = false

    if (typeof tokenValue === 'string') {
        if (tokenValue.endsWith('px')) {
            const parsed = parseFloat(tokenValue)
            if (!isNaN(parsed)) {
                numericValue = parsed
                isDimensionHint = true
            }
        } else if (tokenValue.includes('.dimensions.')) {
            isDimensionHint = true
        } else if (tokenValue.includes('.typography.')) {
            isTypographyHint = true
        }
    }

    // Detect recursica.component extension tokens:
    // When the parent node carries $extensions.recursica.component, the toolbar's
    // virtual prop (e.g. "style" child of "active-pages") must update
    // $extensions.recursica.component.selected-variants[finalKey] — not create a
    // sibling token node.
    const parentNode = current
    const compExt = parentNode?.['$extensions']?.['recursica.component']
    if (
        compExt &&
        typeof compExt === 'object' &&
        '$value' in parentNode &&
        typeof tokenValue === 'string' &&
        !tokenValue.startsWith('{')
    ) {
        // Shallow-clone the extensions chain so Zustand detects the change.
        parentNode['$extensions'] = { ...parentNode['$extensions'] }
        parentNode['$extensions']['recursica.component'] = { ...compExt }
        const selectedVariants = { ...(compExt['selected-variants'] ?? {}) } as Record<string, string>

        // Reconstruct the full DTCG reference by replacing the leaf of the existing ref.
        // e.g. existing = "{ui-kit.components.button.variants.styles.solid}", newValue = "outline"
        // → "{ui-kit.components.button.variants.styles.outline}"
        const existing = selectedVariants[finalKey]
        if (existing && typeof existing === 'string' && existing.startsWith('{') && existing.endsWith('}')) {
            const inner = existing.slice(1, -1)
            const lastDot = inner.lastIndexOf('.')
            const prefix = lastDot >= 0 ? inner.slice(0, lastDot + 1) : ''
            selectedVariants[finalKey] = `{${prefix}${tokenValue}}`
        } else {
            // No existing reference to derive prefix from; store value as-is.
            selectedVariants[finalKey] = tokenValue
        }

        parentNode['$extensions']['recursica.component']['selected-variants'] = selectedVariants
        getVarsStore().setUiKitSilent(updatedUIKit)
        return true
    }

    // Update the value, preserving $type if it exists
    if (current[finalKey] && typeof current[finalKey] === 'object') {
        const existingType = (current[finalKey] as any).$type
        const hasUnitObject = current[finalKey].$value && typeof current[finalKey].$value === 'object' && 'unit' in current[finalKey].$value

        if (existingType === 'dimension' || hasUnitObject) {
            current[finalKey].$type = existingType || 'dimension'
            if (typeof numericValue === 'string' && numericValue.startsWith('{') && numericValue.endsWith('}')) {
                current[finalKey].$value = numericValue
            } else {
                current[finalKey].$value = { value: numericValue, unit: 'px' }
            }
        } else if (existingType === 'number') {
            current[finalKey].$value = numericValue
        } else if (existingType === 'variant') {
            // Reconstruct the full DTCG alias reference for variant-type tokens.
            // If the incoming value is already a {…} reference, write it directly.
            // Otherwise, derive the full path by replacing only the last segment of the
            // existing reference — e.g. selecting "outline" when the existing value is
            // "{ui-kit.components.button.variants.styles.solid}" produces
            // "{ui-kit.components.button.variants.styles.outline}".
            if (typeof tokenValue === 'string' && tokenValue.startsWith('{') && tokenValue.endsWith('}')) {
                current[finalKey].$value = tokenValue
            } else {
                const existingRef = (current[finalKey] as any).$value
                if (typeof existingRef === 'string' && existingRef.startsWith('{') && existingRef.endsWith('}')) {
                    const inner = existingRef.slice(1, -1)
                    const lastDot = inner.lastIndexOf('.')
                    const prefix = lastDot >= 0 ? inner.slice(0, lastDot + 1) : ''
                    current[finalKey].$value = `{${prefix}${tokenValue}}`
                } else {
                    current[finalKey].$value = tokenValue
                }
            }
        } else {
            // Keep original format (e.g., color, raw string)
            current[finalKey].$value = tokenValue === 'transparent' ? null : tokenValue
        }
    } else {
        // Create new entry
        if (isDimensionHint) {
            current[finalKey] = {
                $type: 'dimension',
                $value: { value: numericValue, unit: 'px' }
            }
        } else if (isTypographyHint) {
            current[finalKey] = {
                $type: 'typography',
                $value: tokenValue
            }
        } else {
            current[finalKey] = {
                $type: 'color', // Fallback
                $value: tokenValue === 'transparent' ? null : tokenValue
            }
        }
    }

    getVarsStore().setUiKitSilent(updatedUIKit)

    return true
}

export function removeUIKitValue(cssVar: string): boolean {
    const currentUIKit = getVarsStore().getState().uikit
    if (!currentUIKit || typeof currentUIKit !== 'object') {
        return false
    }

    const path = cssVarToUIKitPath(cssVar, currentUIKit)
    if (!path) return false

    // Fetch original pristine/imported value
    const baseUIKit = getVarsStore().getImportedUikit()
    let baseCurrent: any = baseUIKit
    for (let i = 0; i < path.length - 1; i++) {
        if (!baseCurrent) break
        baseCurrent = baseCurrent[path[i]]
    }
    const finalKey = path[path.length - 1]
    const baseValue = baseCurrent?.[finalKey]

    const updatedUIKit = Array.isArray(currentUIKit) ? [...currentUIKit] : { ...currentUIKit }
    let current: any = updatedUIKit
    for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i]
        if (!current[segment]) return true // Already removed
        current[segment] = Array.isArray(current[segment]) ? [...current[segment]] : { ...current[segment] }
        current = current[segment]
    }

    if (baseValue !== undefined) {
        // Restore from base value
        current[finalKey] = JSON.parse(JSON.stringify(baseValue))
    } else {
        // If it never existed in base, set to null as fallback
        if (current[finalKey] && typeof current[finalKey] === 'object') {
            current[finalKey].$value = null
        } else {
            current[finalKey] = {
                $type: 'color',
                $value: null
            }
        }
    }

    getVarsStore().setUiKitSilent(updatedUIKit)
    return true
}
