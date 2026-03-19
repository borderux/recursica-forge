/**
 * Delta → JSON Sync
 *
 * After restoreDelta() applies CSS var changes to the DOM, this module
 * syncs those changes back into the in-memory JSON state so that export
 * and other JSON-reading code sees the user's saved modifications.
 *
 * This bridges the gap between the delta system (CSS var persistence)
 * and the in-memory JSON state (used by export, compliance, etc.).
 *
 * Supports both:
 * - **Value-level changes**: patching existing JSON entries with new values
 * - **Structural additions**: creating new color scales that were added by the user
 */

import { getDelta } from './cssDelta'
import { parseTokenCssVar, parseBrandCssVar } from '../css/cssVarBuilder'
import type { JsonLike } from '../resolvers/tokens'

/**
 * Apply the current CSS delta back into the in-memory JSON state objects.
 * Mutates `tokens` and `theme` in place.
 *
 * Handles:
 * - Value-level changes (colors, opacities, sizes, fonts, brand paths)
 * - Structural additions (new color scales added by the user)
 *
 * @returns An object with `syncedCount` and `structuralAdditions` (true if new scales were created).
 */
export function syncDeltaToJson(
  tokens: JsonLike,
  theme: JsonLike,
): { syncedCount: number; structuralAdditions: boolean } {
  const delta = getDelta()
  const entries = Object.entries(delta)
  if (entries.length === 0) return { syncedCount: 0, structuralAdditions: false }

  let syncedCount = 0
  const tokensRoot: any = (tokens as any)?.tokens || {}

  // ── First pass: collect entries for scales that don't exist in the JSON ──
  // These represent user-added color scales that need structural creation.
  const pendingNewScales: Record<string, Record<string, string>> = {}
  const pendingFamilyNames: Record<string, string> = {}

  for (const [cssVarName, cssValue] of entries) {
    // ── Family-name CSS vars (special case — not parsed by parseTokenCssVar) ──
    const familyNameMatch = cssVarName.match(/^--recursica_tokens_colors_(scale-\d+)_family-name$/)
    if (familyNameMatch) {
      const scaleKey = familyNameMatch[1]
      const colorsGroup = tokensRoot.colors
      if (colorsGroup?.[scaleKey]) {
        colorsGroup[scaleKey].alias = cssValue.toLowerCase().replace(/\s+/g, '-')
        syncedCount++
      } else {
        // Scale doesn't exist yet — stash the family name for creation below
        pendingFamilyNames[scaleKey] = cssValue
      }
      continue
    }

    // ── Token CSS vars ──
    const tokenParsed = parseTokenCssVar(cssVarName)
    if (tokenParsed) {
      switch (tokenParsed.type) {
        case 'color': {
          const colorsGroup = tokensRoot.colors || tokensRoot.color
          if (colorsGroup?.[tokenParsed.family]?.[tokenParsed.level]) {
            const existing = colorsGroup[tokenParsed.family][tokenParsed.level]
            if (typeof existing === 'object' && '$value' in existing) {
              existing.$value = cssValue
              syncedCount++
            }
          } else if (tokenParsed.family.startsWith('scale-') && !colorsGroup?.[tokenParsed.family]) {
            // Scale doesn't exist in JSON — collect for structural creation
            if (!pendingNewScales[tokenParsed.family]) pendingNewScales[tokenParsed.family] = {}
            pendingNewScales[tokenParsed.family][tokenParsed.level] = cssValue
          }
          break
        }
        case 'opacity': {
          const opacitiesGroup = tokensRoot.opacities || tokensRoot.opacity
          if (opacitiesGroup?.[tokenParsed.key]) {
            const existing = opacitiesGroup[tokenParsed.key]
            if (typeof existing === 'object' && '$value' in existing) {
              const num = parseFloat(cssValue)
              if (Number.isFinite(num)) {
                existing.$value = num
                syncedCount++
              }
            }
          }
          break
        }
        case 'size': {
          const sizesGroup = tokensRoot.sizes || tokensRoot.size
          if (sizesGroup?.[tokenParsed.key]) {
            const existing = sizesGroup[tokenParsed.key]
            if (typeof existing === 'object' && '$value' in existing) {
              const pxMatch = cssValue.match(/^(-?\d+(?:\.\d+)?)px$/)
              if (pxMatch) {
                existing.$value = { value: parseFloat(pxMatch[1]), unit: 'px' }
              } else {
                existing.$value = cssValue
              }
              syncedCount++
            }
          }
          break
        }
        case 'font': {
          const fontGroup = tokensRoot.font
          if (fontGroup?.[tokenParsed.category]?.[tokenParsed.key]) {
            const existing = fontGroup[tokenParsed.category][tokenParsed.key]
            if (typeof existing === 'object' && '$value' in existing) {
              if (tokenParsed.category === 'sizes') {
                const pxMatch = cssValue.match(/^(-?\d+(?:\.\d+)?)px$/)
                if (pxMatch) {
                  existing.$value = { value: parseFloat(pxMatch[1]), unit: 'px' }
                } else {
                  existing.$value = cssValue
                }
              } else if (tokenParsed.category === 'weights' || tokenParsed.category === 'line-heights' || tokenParsed.category === 'letter-spacings') {
                const num = parseFloat(cssValue)
                if (Number.isFinite(num)) {
                  existing.$value = num
                } else {
                  existing.$value = cssValue
                }
              } else {
                existing.$value = cssValue
              }
              syncedCount++
            }
          }
          break
        }
      }
      continue
    }

    // ── Brand CSS vars ──
    const brandParsed = parseBrandCssVar(cssVarName)
    if (!brandParsed) continue

    const brandRoot: any = (theme as any)?.brand ? (theme as any).brand : theme
    const themes: any = brandRoot?.themes || brandRoot

    switch (brandParsed.type) {
      case 'palette': {
        const paletteGroup = themes?.[brandParsed.mode]?.palettes?.[brandParsed.paletteName]
        if (!paletteGroup) break
        const levelObj = paletteGroup[brandParsed.level]
        if (!levelObj) break

        const propParts = brandParsed.prop.split('_')
        let target: any = levelObj
        for (let i = 0; i < propParts.length - 1; i++) {
          target = target?.[propParts[i]]
          if (!target) break
        }
        if (target) {
          const leaf = propParts[propParts.length - 1]
          if (target[leaf] && typeof target[leaf] === 'object' && '$value' in target[leaf]) {
            target[leaf].$value = cssValue
            syncedCount++
          }
        }
        break
      }
      case 'core-color': {
        const coreGroup = themes?.[brandParsed.mode]?.palettes?.core
        if (!coreGroup) break

        const pathParts = brandParsed.path.split('_')
        let target: any = coreGroup
        for (let i = 0; i < pathParts.length - 1; i++) {
          target = target?.[pathParts[i]]
          if (!target) break
        }
        if (target) {
          const leaf = pathParts[pathParts.length - 1]
          if (target[leaf] && typeof target[leaf] === 'object' && '$value' in target[leaf]) {
            target[leaf].$value = cssValue
            syncedCount++
          }
        }
        break
      }
      case 'layer': {
        const layerObj = themes?.[brandParsed.mode]?.layers?.[`layer-${brandParsed.layerNum}`]
        if (!layerObj) break

        const sectionObj = layerObj[brandParsed.section]
        if (!sectionObj) break

        if (sectionObj[brandParsed.prop] && typeof sectionObj[brandParsed.prop] === 'object' && '$value' in sectionObj[brandParsed.prop]) {
          sectionObj[brandParsed.prop].$value = cssValue
          syncedCount++
        }
        break
      }
      case 'elevation': {
        const elevObj = themes?.[brandParsed.mode]?.elevations?.[`elevation-${brandParsed.level}`]
        if (!elevObj) break

        if (elevObj[brandParsed.prop] && typeof elevObj[brandParsed.prop] === 'object' && '$value' in elevObj[brandParsed.prop]) {
          elevObj[brandParsed.prop].$value = cssValue
          syncedCount++
        }
        break
      }
      case 'dimension': {
        const dimGroup = brandRoot?.dimensions?.[brandParsed.category]
        if (!dimGroup) break

        if (dimGroup[brandParsed.key] && typeof dimGroup[brandParsed.key] === 'object' && '$value' in dimGroup[brandParsed.key]) {
          dimGroup[brandParsed.key].$value = cssValue
          syncedCount++
        }
        break
      }
      case 'typography': {
        break
      }
    }
  }

  // ── Second pass: create new color scales from collected pending entries ──
  const newScaleKeys = Object.keys(pendingNewScales)
  if (newScaleKeys.length > 0) {
    if (!tokensRoot.colors) tokensRoot.colors = {}
    const colorsGroup = tokensRoot.colors

    for (const scaleKey of newScaleKeys) {
      const levels = pendingNewScales[scaleKey]
      // Derive alias from the family-name CSS var, or fall back to the scale key
      const familyName = pendingFamilyNames[scaleKey]
      const alias = familyName
        ? familyName.toLowerCase().replace(/\s+/g, '-')
        : scaleKey

      // Build scale entry: { alias: '...', '000': { $type, $value }, ... }
      const scaleEntry: Record<string, any> = { alias }
      for (const [level, hex] of Object.entries(levels)) {
        scaleEntry[level] = { $type: 'color', $value: hex }
      }
      colorsGroup[scaleKey] = scaleEntry
      syncedCount += Object.keys(levels).length
    }
  }

  return { syncedCount, structuralAdditions: newScaleKeys.length > 0 }
}
