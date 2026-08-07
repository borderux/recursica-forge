/**
 * Runtime Scoped CSS Engine
 *
 * Generates a <style> element that creates generic-name CSS variable aliases
 * inside theme/layer selectors, pointing at specific-name vars on :root.
 *
 * This lets forge dogfood its own scoped CSS export:
 * - :root holds all vars with specific (full-path) names
 * - Theme selectors set generic (short) aliases → var(specificNameOnRoot)
 * - Consumer code reads generic names; cascade resolves the theme/layer
 */

import type { CssVarMap } from './apply'

const STYLE_ID = 'recursica-scoped'
const PREFIX = '--recursica_'

/** Scoped alias: a generic var name that aliases a specific var name. */
interface ScopedAlias {
  genericName: string
  specificName: string
  /** Theme the alias belongs to. */
  theme: 'light' | 'dark'
  /** Layer the alias belongs to, when it is layer-scoped rather than theme-only. */
  layer?: string
}

/**
 * Classifies a specific CSS var name and returns the generic alias info,
 * or null if no scoping applies (tokens, brand.typography, etc. stay on :root only).
 *
 * Mappings (using underscore-delimited format):
 * - brand_themes_{theme}_palettes_... → brand_palettes_...  (theme scope)
 * - brand_themes_{theme}_layers_layer-{N}_... → brand_layer_{N}_...  (theme+layer scope)
 * - brand_themes_{theme}_states_... → brand_states_...  (theme scope)
 * - brand_themes_{theme}_text-emphasis_... → brand_text-emphasis_...  (theme scope)
 * - brand_themes_{theme}_elevations_... → brand_elevations_...  (theme scope)
 * - ui-kit_themes_{theme}_layer_{N}_... → ui-kit_...  (theme+layer scope, canonical name)
 */
function classifyVar(specificName: string): {
  theme: 'light' | 'dark'
  layer?: string
  genericName: string
} | null {
  // (see aliasesFor below — this returns the primary alias only)
  // Brand theme-scoped vars: --recursica_brand_themes_{theme}_{rest}
  const brandThemeMatch = specificName.match(
    /^--recursica_brand_themes_(light|dark)_(.+)$/
  )
  if (brandThemeMatch) {
    const theme = brandThemeMatch[1] as 'light' | 'dark'
    const rest = brandThemeMatch[2]

    // Check if it's a layer var: layers_layer-{N}_{rest}
    const layerMatch = rest.match(/^layers_layer-(\d+)_(.+)$/)
    if (layerMatch) {
      const layerNum = layerMatch[1]
      const layerRest = layerMatch[2]
      return {
        theme,
        layer: layerNum,
        genericName: `${PREFIX}brand_layer_${layerNum}_${layerRest}`,
      }
    }

    // Theme-only brand var (palettes, states, text-emphasis, elevations, etc.)
    return {
      theme,
      genericName: `${PREFIX}brand_${rest}`,
    }
  }

  // UI-kit layer-specific: --recursica_ui-kit_themes_{theme}_layer_{N}_{rest}
  const uikitLayerMatch = specificName.match(
    /^--recursica_ui-kit_themes_(light|dark)_layer_(\d+)_(.+)$/
  )
  if (uikitLayerMatch) {
    const theme = uikitLayerMatch[1] as 'light' | 'dark'
    const layerNum = uikitLayerMatch[2]
    const rest = uikitLayerMatch[3]
    return {
      theme,
      layer: layerNum,
      genericName: `${PREFIX}ui-kit_${rest}`,
    }
  }

  // UI-kit theme-scoped (components, globals, etc.): --recursica_ui-kit_themes_{theme}_{rest}
  const uikitThemeMatch = specificName.match(
    /^--recursica_ui-kit_themes_(light|dark)_(.+)$/
  )
  if (uikitThemeMatch) {
    const theme = uikitThemeMatch[1] as 'light' | 'dark'
    const rest = uikitThemeMatch[2]
    return {
      theme,
      genericName: `${PREFIX}ui-kit_${rest}`,
    }
  }

  // Not scoped (tokens, brand.typography, brand.dimensions)
  return null
}

/**
 * Matches a layer segment embedded inside a ui-kit path, e.g.
 * `..._properties_colors_layer-0_background-color` or a trailing `..._elevation_layer-0`.
 */
const EMBEDDED_LAYER = /_layer-(\d+)(?=_|$)/

/**
 * Returns every alias a specific var should produce.
 *
 * Most vars produce exactly one, as before. The extra case is a ui-kit var whose *name*
 * carries the layer (`..._colors_layer-0_background-color`): consumers read a layer-FREE
 * name and let `[data-recursica-layer="N"]` pick the value — that is how the published
 * adapter and Forge's own export both work. So such a var also produces a second alias
 * with the layer segment removed, emitted into the matching theme+layer block.
 *
 * Both aliases are emitted rather than replacing the layered one:
 *   - Toast authors elevation as `..._elevation_layer-0..3` and consumers read it WITH the
 *     layer in the name, so removing that form would break it.
 *   - Keeping it costs only stylesheet size and cannot break an existing reader.
 */
function aliasesFor(specificName: string): ScopedAlias[] {
  const primary = classifyVar(specificName)
  if (!primary) return []

  const aliases: ScopedAlias[] = [
    {
      genericName: primary.genericName,
      specificName,
      theme: primary.theme,
      layer: primary.layer,
    },
  ]

  // Only ui-kit names embed the layer mid-path. Brand layer vars already use the
  // `brand_layer_N_` form that consumers read directly, so they are left alone.
  if (primary.genericName.startsWith(`${PREFIX}ui-kit_`)) {
    const embedded = EMBEDDED_LAYER.exec(primary.genericName)
    if (embedded) {
      aliases.push({
        genericName: primary.genericName.replace(EMBEDDED_LAYER, ''),
        specificName,
        theme: primary.theme,
        layer: embedded[1],
      })
    }
  }

  return aliases
}

/**
 * Generates the CSS text for scoped alias blocks.
 */
function generateScopedCss(allSpecificVars: CssVarMap): string {
  // Collect aliases by scope
  const themeOnly: Map<string, ScopedAlias[]> = new Map()
  const themePlusLayer: Map<string, ScopedAlias[]> = new Map()

  for (const specificName of Object.keys(allSpecificVars)) {
    for (const alias of aliasesFor(specificName)) {
      if (alias.layer != null) {
        const key = `${alias.theme}+${alias.layer}`
        if (!themePlusLayer.has(key)) themePlusLayer.set(key, [])
        themePlusLayer.get(key)!.push(alias)
      } else {
        if (!themeOnly.has(alias.theme)) themeOnly.set(alias.theme, [])
        themeOnly.get(alias.theme)!.push(alias)
      }
    }
  }

  let css = '/* Generated by scopedCssEngine — do not edit */\n\n'

  // Theme-only blocks
  for (const theme of ['light', 'dark'] as const) {
    const aliases = themeOnly.get(theme)
    if (!aliases || aliases.length === 0) continue
    css += `[data-recursica-theme="${theme}"] {\n`
    for (const { genericName, specificName } of aliases) {
      css += `  ${genericName}: var(${specificName});\n`
    }
    css += '}\n\n'
  }

  // Theme + layer blocks
  for (const theme of ['light', 'dark'] as const) {
    for (const layer of ['0', '1', '2', '3']) {
      const key = `${theme}+${layer}`
      const aliases = themePlusLayer.get(key)
      if (!aliases || aliases.length === 0) continue
      css += `[data-recursica-theme="${theme}"][data-recursica-layer="${layer}"],\n`
      css += `[data-recursica-theme="${theme}"] [data-recursica-layer="${layer}"] {\n`
      for (const { genericName, specificName } of aliases) {
        css += `  ${genericName}: var(${specificName});\n`
      }
      css += '}\n\n'
    }
  }

  return css
}

/**
 * Order-sensitive hash of the var NAMES in the map (values are ignored).
 *
 * A wrong-but-different hash only causes a needless regeneration, which is harmless; the
 * dangerous direction — two different name sets hashing the same — would require the exact
 * same name sequence. Hashing without building an intermediate string keeps this cheap
 * enough to run on every recompute.
 */
function nameSetSignature(vars: CssVarMap): string {
  let hash = 0x811c9dc5 // FNV-1a offset basis
  let count = 0
  for (const name in vars) {
    count++
    for (let i = 0; i < name.length; i++) {
      hash ^= name.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    // Separator so ['ab','c'] and ['a','bc'] cannot collide.
    hash ^= 0x2c
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `${count}:${hash.toString(16)}`
}

let lastSignature: string | null = null

/**
 * Updates the runtime scoped CSS <style> element.
 * Call this after applyCssVars() with the full var map.
 *
 * Every line this generates has the form `genericName: var(specificName)` — it maps names
 * to names and never embeds a value. Editing a token therefore changes only the specific
 * var on :root (applyCssVars' job), leaving this stylesheet byte-identical. So the sheet is
 * regenerated only when the SET OF NAMES changes — a variant or component being added or
 * removed — which makes an ordinary prop edit cost one hash instead of rebuilding ~1MB of
 * CSS and reparsing it.
 */
export function updateScopedCss(allSpecificVars: CssVarMap): void {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
    document.head.appendChild(styleEl)
  }

  const signature = nameSetSignature(allSpecificVars)
  if (signature === lastSignature && styleEl.textContent) return

  styleEl.textContent = generateScopedCss(allSpecificVars)
  lastSignature = signature
}

/** Clears the memoized name-set signature. Exposed for tests. */
export function resetScopedCssCache(): void {
  lastSignature = null
}

/**
 * Sets the current theme on the document root element.
 */
export function setThemeAttribute(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-recursica-theme', theme)
}

/**
 * Sets the layer attribute on a given element.
 */
export function setLayerAttribute(element: HTMLElement, layer: string): void {
  element.setAttribute('data-recursica-layer', layer)
}

/**
 * Gets the current theme from the document root, defaulting to 'light'.
 */
export function getThemeAttribute(): 'light' | 'dark' {
  const val = document.documentElement.getAttribute('data-recursica-theme')
  return val === 'dark' ? 'dark' : 'light'
}
