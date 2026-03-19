/**
 * Structural Metadata — read-only schema extracted from JSON files at init.
 *
 * This describes *what* tokens/palettes/layers exist (the keys, the structure)
 * but NOT their values.  Values live exclusively in CSS variables.
 *
 * Components that need to enumerate palette names, token categories, etc.
 * should read from this metadata instead of the full JSON store.
 */

import type { JsonLike } from '../resolvers/tokens'

// ─── Types ───

export interface TokenKeys {
  /** Color scale keys, e.g. ['scale-01', 'scale-02', ...] */
  colorFamilies: string[]
  /** Alias lookup: scaleKey → alias string (e.g. 'scale-01' → 'crimson') */
  colorAliases: Record<string, string>
  /** Standard color levels, e.g. ['000', '050', '100', ..., '1000'] */
  colorLevels: string[]
  /** Font size keys, e.g. ['2xs', 'xs', 'sm', 'md', ...] */
  fontSizeKeys: string[]
  /** Font weight keys, e.g. ['thin', 'light', 'regular', ...] */
  fontWeightKeys: string[]
  /** Font typeface/family keys, e.g. ['primary', 'secondary'] */
  fontTypefaceKeys: string[]
  /** Font letter-spacing keys */
  fontLetterSpacingKeys: string[]
  /** Font line-height keys */
  fontLineHeightKeys: string[]
  /** Font case keys */
  fontCaseKeys: string[]
  /** Font decoration keys */
  fontDecorationKeys: string[]
  /** Opacity keys, e.g. ['transparent', 'faint', 'veiled', 'solid'] */
  opacityKeys: string[]
  /** Size keys, e.g. ['xs', 'sm', 'md', 'lg', ...] */
  sizeKeys: string[]
}

export interface BrandStructure {
  /** Dynamic palette names, e.g. ['neutral', 'palette-1', 'palette-2'] */
  paletteNames: string[]
  /** Core palette color keys, e.g. ['black', 'white', 'alert', 'warning', 'success', 'interactive'] */
  corePaletteKeys: string[]
  /** Number of layers (typically 4: layer-0 through layer-3) */
  layerCount: number
  /** Number of elevation levels (typically 5: elevation-0 through elevation-4) */
  elevationLevels: number
  /** Typography style names, e.g. ['headline', 'body', 'body-small', ...] */
  typographyStyles: string[]
  /** Dimension categories, e.g. ['general', 'border-radii'] */
  dimensionCategories: Record<string, string[]>
}

export interface StructuralMetadata {
  tokenKeys: TokenKeys
  brandStructure: BrandStructure
  /** Original UIKit component names from recursica_ui-kit.json */
  uikitComponents: string[]
}

// ─── Builder ───

/**
 * Extracts structural metadata from the three JSON source files.
 * Called once at init — the result is immutable.
 */
export function buildStructuralMetadata(
  tokens: JsonLike,
  brand: JsonLike,
  uikit: JsonLike
): StructuralMetadata {
  return {
    tokenKeys: extractTokenKeys(tokens),
    brandStructure: extractBrandStructure(brand),
    uikitComponents: extractUIKitComponents(uikit),
  }
}

// ─── Token key extraction ───

function extractTokenKeys(tokens: JsonLike): TokenKeys {
  const root: any = (tokens as any)?.tokens || tokens || {}

  // Colors
  const colorsRoot = root.colors || root.color || {}
  const colorFamilies: string[] = []
  const colorAliases: Record<string, string> = {}
  const levelSet = new Set<string>()

  if (colorsRoot && typeof colorsRoot === 'object') {
    Object.keys(colorsRoot).forEach((key) => {
      if (key.startsWith('$')) return
      const scale = colorsRoot[key]
      if (!scale || typeof scale !== 'object') return
      colorFamilies.push(key)
      if (typeof scale.alias === 'string') {
        colorAliases[key] = scale.alias
      }
      Object.keys(scale).forEach((lvl) => {
        if (lvl === 'alias' || lvl.startsWith('$')) return
        if (/^\d{2,4}$/.test(lvl) || lvl === '000' || lvl === '1000') {
          levelSet.add(lvl)
        }
      })
    })
  }

  // Sort levels numerically
  const colorLevels = Array.from(levelSet).sort((a, b) => {
    const n = (s: string) => (s === '000' ? 0 : s === '050' ? 50 : parseInt(s, 10))
    return n(a) - n(b)
  })

  // Font tokens
  const fontRoot = root.font || {}
  const keysOf = (obj: any): string[] =>
    obj && typeof obj === 'object' ? Object.keys(obj).filter((k) => !k.startsWith('$')) : []

  const fontSizeKeys = keysOf(fontRoot.sizes || fontRoot.size)
  const fontWeightKeys = keysOf(fontRoot.weights || fontRoot.weight)
  const fontTypefaceKeys = keysOf(fontRoot.typefaces || fontRoot.typeface || fontRoot.families || fontRoot.family)
  const fontLetterSpacingKeys = keysOf(fontRoot['letter-spacings'] || fontRoot['letter-spacing'])
  const fontLineHeightKeys = keysOf(fontRoot['line-heights'] || fontRoot['line-height'])
  const fontCaseKeys = keysOf(fontRoot.cases || fontRoot.case)
  const fontDecorationKeys = keysOf(fontRoot.decorations || fontRoot.decoration)

  // Opacities
  const opacityKeys = keysOf(root.opacities || root.opacity)

  // Sizes
  const sizeKeys = keysOf(root.sizes || root.size).filter((k) => !k.startsWith('elevation-'))

  return {
    colorFamilies,
    colorAliases,
    colorLevels,
    fontSizeKeys,
    fontWeightKeys,
    fontTypefaceKeys,
    fontLetterSpacingKeys,
    fontLineHeightKeys,
    fontCaseKeys,
    fontDecorationKeys,
    opacityKeys,
    sizeKeys,
  }
}

// ─── Brand structure extraction ───

function extractBrandStructure(brand: JsonLike): BrandStructure {
  const root: any = (brand as any)?.brand || brand || {}
  const themes = root.themes || root

  // Palettes — enumerate from light mode (or first available)
  const modePalettes = themes?.light?.palettes || themes?.Light?.palettes || {}
  const paletteNames: string[] = []
  const corePaletteKeys: string[] = []

  if (modePalettes && typeof modePalettes === 'object') {
    Object.keys(modePalettes).forEach((k) => {
      if (k === 'core' || k === 'core-colors') {
        // Extract core color keys
        const core = modePalettes[k]
        if (core && typeof core === 'object') {
          const coreValue = core.$value || core
          Object.keys(coreValue).forEach((ck) => {
            if (!ck.startsWith('$')) corePaletteKeys.push(ck)
          })
        }
      } else {
        paletteNames.push(k)
      }
    })
  }

  // Supply default core keys if none found
  if (corePaletteKeys.length === 0) {
    corePaletteKeys.push('black', 'white', 'alert', 'warning', 'success', 'interactive')
  }

  // Layers — count from light mode
  let layerCount = 0
  const layers = themes?.light?.layers || themes?.light?.layer || {}
  if (layers && typeof layers === 'object') {
    Object.keys(layers).forEach((k) => {
      const m = k.match(/layer[- ]?(\d+)/i)
      if (m) {
        const n = parseInt(m[1], 10) + 1
        if (n > layerCount) layerCount = n
      }
    })
  }
  if (layerCount === 0) layerCount = 4 // default

  // Elevations — count from brand structure
  let elevationLevels = 0
  const elevations = root.elevations || themes?.light?.elevations || {}
  if (elevations && typeof elevations === 'object') {
    Object.keys(elevations).forEach((k) => {
      const m = k.match(/elevation[- ]?(\d+)/i)
      if (m) {
        const n = parseInt(m[1], 10) + 1
        if (n > elevationLevels) elevationLevels = n
      }
    })
  }
  if (elevationLevels === 0) elevationLevels = 5 // default

  // Typography styles
  const typographyStyles: string[] = []
  const typography = root.typography || themes?.light?.typography || {}
  if (typography && typeof typography === 'object') {
    Object.keys(typography).forEach((k) => {
      if (!k.startsWith('$')) typographyStyles.push(k)
    })
  }

  // Dimensions
  const dimensionCategories: Record<string, string[]> = {}
  const dimensions = root.dimensions || themes?.light?.dimensions || {}
  if (dimensions && typeof dimensions === 'object') {
    Object.keys(dimensions).forEach((cat) => {
      if (cat.startsWith('$')) return
      const group = dimensions[cat]
      if (group && typeof group === 'object') {
        dimensionCategories[cat] = Object.keys(group).filter((k) => !k.startsWith('$'))
      }
    })
  }

  return {
    paletteNames,
    corePaletteKeys,
    layerCount,
    elevationLevels,
    typographyStyles,
    dimensionCategories,
  }
}

// ─── UIKit component extraction ───

function extractUIKitComponents(uikit: JsonLike): string[] {
  const root: any = (uikit as any)?.['ui-kit'] || (uikit as any)?.uikit || uikit || {}
  const components = root.components || {}
  return Object.keys(components).filter((k) => !k.startsWith('$'))
}
