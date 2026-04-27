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
import { parseTokenCssVar, parseBrandCssVar, cssVarToRef } from '../css/cssVarBuilder'
import { cssVarToUIKitPath } from '../css/updateUIKitValue'
import type { JsonLike } from '../resolvers/tokens'
import baseTokensImport from '../../../recursica_tokens.json'
import { DELETED_SCALES_KEY } from './varsStore'

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
  uikit?: JsonLike,
): { syncedCount: number; structuralAdditions: boolean } {
/**
 * Write a CSS value back into a DTCG token node, preserving the existing $value format.
 * If the existing $value is a {value, unit} dimension object, convert the CSS string accordingly.
 * Otherwise write the raw string.
 */
function writeJsonValue(token: any, cssValue: string): void {
  const existing = token.$value
  if (existing !== null && typeof existing === 'object' && 'value' in existing && 'unit' in existing) {
    // Preserve {value, unit} format — parse the CSS string and keep the existing unit
    const unit = existing.unit as string
    const match = cssValue.match(/^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/)
    if (match) {
      token.$value = { value: parseFloat(match[1]), unit: match[2] || unit }
    } else {
      const num = parseFloat(cssValue)
      if (Number.isFinite(num)) {
        token.$value = { value: num, unit }
      } else {
        token.$value = cssValue
      }
    }
  } else {
    token.$value = cssValue
  }
}



  const delta = getDelta()
  const entries = Object.entries(delta)
  if (entries.length === 0) return { syncedCount: 0, structuralAdditions: false }

  let syncedCount = 0
  const tokensRoot: any = (tokens as any)?.tokens || {}

  // Build set of deleted palette keys from brand delta markers.
  const deletedPaletteKeys = new Set<string>()
  for (const [k, v] of entries) {
    const m = k.match(/^--recursica_brand_palette_deleted_(.+)$/)
    if (m && v === 'true') deletedPaletteKeys.add(m[1])
  }

  // Read the list of user-deleted color scale aliases.
  // Any delta entries for these scales must be skipped to prevent resurrection.
  const deletedAliases = new Set<string>()
  try {
    const raw = localStorage.getItem(DELETED_SCALES_KEY)
    if (raw) {
      const list = JSON.parse(raw) as string[]
      list.forEach(a => deletedAliases.add(a))
    }
  } catch { }

  // Build set of deleted scale keys from three sources:
  // 1. Scales still in the (possibly-stripped) tokens
  // 2. Family-name entries found in the delta
  // 3. The original base tokens JSON (for scales that applyDeletedScales already stripped)
  const deletedScaleKeys = new Set<string>()

  // Source 1: Still-present tokens
  const colorsRootInit: any = tokensRoot?.colors || {}
  for (const [scaleKey, scale] of Object.entries(colorsRootInit)) {
    if (!scaleKey.startsWith('scale-')) continue
    const alias = (scale as any)?.alias
    if (alias && typeof alias === 'string' && deletedAliases.has(alias.trim())) {
      deletedScaleKeys.add(scaleKey)
    }
  }

  // Source 2: Family-name CSS vars in the delta (scale may already be removed from tokens)
  for (const [cssVarName, cssValue] of entries) {
    const familyMatch = cssVarName.match(/^--recursica_tokens_colors_(scale-\d+)_family-name$/)
    if (familyMatch) {
      const alias = cssValue.toLowerCase().replace(/\s+/g, '-')
      if (deletedAliases.has(alias)) {
        deletedScaleKeys.add(familyMatch[1])
      }
    }
  }

  // Source 3: Look up scale keys from the original base JSON import for base scales
  // that were deleted (applyDeletedScales already removed them from the in-memory tokens)
  try {
    const baseTokensRoot: any = (baseTokensImport as any)?.tokens || {}
    const baseColorsRoot: any = baseTokensRoot?.colors || {}
    for (const [scaleKey, scale] of Object.entries(baseColorsRoot)) {
      if (!scaleKey.startsWith('scale-')) continue
      const alias = (scale as any)?.alias
      if (alias && typeof alias === 'string' && deletedAliases.has(alias.trim())) {
        deletedScaleKeys.add(scaleKey)
      }
    }
  } catch { }

  // ── First pass: collect entries for scales that don't exist in the JSON ──
  // These represent user-added color scales that need structural creation.
  const pendingNewScales: Record<string, Record<string, string>> = {}
  const pendingFamilyNames: Record<string, string> = {}

  for (const [cssVarName, rawCssValue] of entries) {
    let cssValue = cssVarToRef(rawCssValue) || rawCssValue

    // ── Family-name CSS vars (special case — not parsed by parseTokenCssVar) ──
    const familyNameMatch = cssVarName.match(/^--recursica_tokens_colors_(scale-\d+)_family-name$/)
    if (familyNameMatch) {
      const scaleKey = familyNameMatch[1]
      // Skip if this scale was deleted by the user
      if (deletedScaleKeys.has(scaleKey)) continue
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
          // Skip CSS var entries for deleted scales
          if (deletedScaleKeys.has(tokenParsed.family)) break
          if (deletedAliases.has(tokenParsed.family)) break
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
              } else if (tokenParsed.category === 'weights') {
                const num = parseFloat(cssValue)
                if (Number.isFinite(num)) {
                  existing.$value = num
                } else {
                  existing.$value = cssValue
                }
              } else if (tokenParsed.category === 'line-heights' || tokenParsed.category === 'letter-spacings') {
                // These tokens use {value, unit:'em'} dimension objects — preserve the unit.
                const existingUnit = (typeof existing.$value === 'object' && existing.$value?.unit) ? existing.$value.unit : 'em'
                const emMatch = cssValue.match(/^(-?\d+(?:\.\d+)?)(em)?$/)
                if (emMatch) {
                  existing.$value = { value: parseFloat(emMatch[1]), unit: existingUnit }
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

    // Automatically inject `.themes.light.` or `.themes.dark.` context scoping into
    // root-level '{brand.xxx}' references if the target JSON destination path belongs to a theme.
    // The CSS delta engine works globally without themes, so they must be reattached here.
    if (typeof cssValue === 'string' && cssValue.startsWith('{brand.') && !cssValue.startsWith('{brand.themes.') && 'mode' in brandParsed) {
      cssValue = cssValue.replace('{brand.', `{brand.themes.${brandParsed.mode}.`)
    }

    const brandRoot: any = (theme as any)?.brand ? (theme as any).brand : theme
    const themes: any = brandRoot?.themes || brandRoot

    switch (brandParsed.type) {
      case 'palette': {
        // Skip vars for palettes the user has deleted (tracked via deletion marker in delta).
        if (deletedPaletteKeys.has(brandParsed.paletteName)) break
        // Ensure the palette path exists in themes JSON — creates it if this is a user-added palette
        // (e.g. palette-3 not present in the static brand JSON).
        if (!themes[brandParsed.mode]) themes[brandParsed.mode] = {}
        if (!themes[brandParsed.mode].palettes) themes[brandParsed.mode].palettes = {}
        if (!themes[brandParsed.mode].palettes[brandParsed.paletteName]) {
          themes[brandParsed.mode].palettes[brandParsed.paletteName] = {}
        }
        const paletteGroup = themes[brandParsed.mode].palettes[brandParsed.paletteName]

        if (!paletteGroup[brandParsed.level]) paletteGroup[brandParsed.level] = {}
        const levelObj = paletteGroup[brandParsed.level]

        const propParts = brandParsed.prop.split('_')
        let target: any = levelObj
        for (let i = 0; i < propParts.length - 1; i++) {
          const seg = propParts[i]
          if (!target[seg]) target[seg] = {}
          target = target[seg]
        }
        const leaf = propParts[propParts.length - 1]
        // cssValue has already been converted by cssVarToRef (line 131) from
        // var(--recursica_tokens_colors_scale-03_500) → {tokens.colors.scale-03.500}
        // so this writes a valid DTCG ref, not a raw CSS var.
        //
        // Migrate stale on-tone refs: old code used {brand.*.palettes.core.black.tone}
        // Current code uses {brand.*.palettes.core-colors.black.tone}.
        // Silently fix stale delta entries so the export is always valid.
        let valueToWrite = cssValue
        if (leaf === 'on-tone' || leaf === 'on_tone') {
          valueToWrite = cssValue
            .replace(/\{(brand\.themes\.\w+\.palettes)\.core\.(black|white)\.tone\}/g, '{$1.core-colors.$2.tone}')
            .replace(/\{(brand\.palettes)\.core\.(black|white)\.tone\}/g, '{$1.core-colors.$2.tone}')
        }
        if (!target[leaf]) target[leaf] = {}
        if (typeof target[leaf] === 'object' && !('$type' in target[leaf])) {
          target[leaf].$type = 'color'
        }
        target[leaf].$value = valueToWrite
        syncedCount++
        break
      }
      case 'core-color': {
        const coreGroup = themes?.[brandParsed.mode]?.palettes?.['core-colors']
        if (!coreGroup) break

        // Translate flat hyphenated CSS variable paths back into nested JSON path segments
        const p = brandParsed.path
        let pathParts: string[] = []
        if (p === 'interactive-default-on-tone') pathParts = ['interactive', 'default', 'on-tone']
        else if (p === 'interactive-default-tone') pathParts = ['interactive', 'default', 'tone']
        else if (p === 'interactive-hover-on-tone') pathParts = ['interactive', 'hover', 'on-tone']
        else if (p === 'interactive-hover-tone') pathParts = ['interactive', 'hover', 'tone']
        else if (p.endsWith('-on-tone')) pathParts = [p.replace('-on-tone', ''), 'on-tone']
        else if (p.endsWith('-tone')) pathParts = [p.replace('-tone', ''), 'tone']
        else if (p.endsWith('-interactive')) pathParts = [p.replace('-interactive', ''), 'interactive']
        else pathParts = p.split('_')
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

        // The CSS var name flattens a two-level JSON path with a hyphen.
        // `properties` keys are flat with $value directly (surface, border-color, etc.)
        // `elements` keys are nested two levels deep (text.color, interactive.tone, etc.)
        // Strategy: try flat lookup first, then fall back to split-on-first-hyphen navigation.
        if (sectionObj[brandParsed.prop] && typeof sectionObj[brandParsed.prop] === 'object' && '$value' in sectionObj[brandParsed.prop]) {
          // Flat key found with $value — covers all `properties` entries and any flat `elements` entries
          writeJsonValue(sectionObj[brandParsed.prop], cssValue)
          syncedCount++
          break
        }
        // No flat match — try splitting on the first hyphen to navigate nested `elements` structure.
        // e.g. 'text-color' → elements.text.color.$value
        //      'interactive-tone-hover' → elements.interactive['tone-hover'].$value
        const firstHyphen = brandParsed.prop.indexOf('-')
        if (firstHyphen !== -1) {
          const groupKey = brandParsed.prop.slice(0, firstHyphen)
          const leafKey = brandParsed.prop.slice(firstHyphen + 1)
          const group = sectionObj[groupKey]
          if (group && typeof group === 'object' && group[leafKey] && typeof group[leafKey] === 'object' && '$value' in group[leafKey]) {
            writeJsonValue(group[leafKey], cssValue)
            syncedCount++
          }
        }
        break
      }
      case 'elevation': {
        const elevObj = themes?.[brandParsed.mode]?.elevations?.[`elevation-${brandParsed.level}`]
        if (!elevObj) break

        if (elevObj[brandParsed.prop] && typeof elevObj[brandParsed.prop] === 'object' && '$value' in elevObj[brandParsed.prop]) {
          writeJsonValue(elevObj[brandParsed.prop], cssValue)
          syncedCount++
        }
        break
      }
      case 'dimension': {
        // Dimension $values are always DTCG token references (e.g. {tokens.sizes.none}).
        // Writing a resolved pixel string back would corrupt the JSON and fail schema validation.
        // Dimension CSS vars update automatically when the referenced token value changes.
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

  // ── Third pass: sync UIKit CSS var changes back into the in-memory UIKit JSON ──
  // restoreDelta() re-applies these vars to the DOM (so the preview looks correct),
  // but without this pass the in-memory uikit JSON stays pristine and exportUIKitJson()
  // returns the original file values instead of the user's modifications.
  if (uikit) {
    // If the stored uikit already has a 'ui-kit' wrapper use it as-is; otherwise the
    // object itself IS the 'ui-kit' root. In either case mutations must land on the
    // original `uikit` reference so the caller sees the changes.
    const hasWrapper = !!(uikit as any)?.['ui-kit']
    // The object we navigate with cssVarToUIKitPath — always has a 'ui-kit' key at depth 0.
    const uikitRoot: any = hasWrapper ? uikit : { 'ui-kit': uikit }

    for (const [cssVarName, rawCssValue] of entries) {
      if (!cssVarName.startsWith('--recursica_ui-kit_')) continue

      const path = cssVarToUIKitPath(cssVarName, uikitRoot)
      if (!path || path.length < 2) continue

      // Resolve var() references back to DTCG token refs
      let tokenValue: string = cssVarToRef(rawCssValue) || rawCssValue

      // Navigate to the parent node along the resolved path, using the original object.
      // When there is no wrapper, path[0] is 'ui-kit' but the actual root IS `uikit`,
      // so we skip that first segment and start directly on `uikit`.
      const startIndex = hasWrapper ? 0 : 1
      let current: any = hasWrapper ? uikitRoot : uikit
      let navigated = true
      for (let i = startIndex; i < path.length - 1; i++) {
        const segment = path[i]
        if (!current[segment] || typeof current[segment] !== 'object') {
          navigated = false
          break
        }
        current = current[segment]
      }
      if (!navigated) continue

      const finalKey = path[path.length - 1]
      const existing = current[finalKey]

      if (existing && typeof existing === 'object' && '$value' in existing) {
        const existingType = existing.$type
        const hasUnitObject = existing.$value && typeof existing.$value === 'object' && 'unit' in existing.$value

        if (existingType === 'dimension' || hasUnitObject) {
          if (typeof tokenValue === 'string' && tokenValue.startsWith('{') && tokenValue.endsWith('}')) {
            existing.$value = tokenValue
          } else {
            const pxMatch = tokenValue.match(/^(-?\d+(?:\.\d+)?)px$/)
            existing.$value = pxMatch
              ? { value: parseFloat(pxMatch[1]), unit: 'px' }
              : { value: parseFloat(tokenValue) || 0, unit: 'px' }
          }
        } else if (existingType === 'number') {
          const num = parseFloat(tokenValue)
          if (Number.isFinite(num)) existing.$value = num
        } else {
          existing.$value = tokenValue
        }
        syncedCount++
      }
    }
  }

  return { syncedCount, structuralAdditions: newScaleKeys.length > 0 }
}
