/**
 * Centralized CSS Variable Name Builder
 *
 * Single source of truth for all CSS variable name construction.
 * Rules:
 *   1. `_` separates JSON tree nodes
 *   2. `-` separates compound names within a single node
 *   3. Prefix is always `--recursica_`
 *
 * This module exports two categories of functions:
 *   - **Specific** names: full paths including theme/mode, used by resolvers
 *   - **Generic** names: scoped names without theme/mode, used by consumers
 *     (the CSS cascade resolves the theme via data attributes)
 */

const P = '--recursica_'

/** Exported prefix for token-level CSS variables: `--recursica_tokens_` */
export const TOKEN_PREFIX = `${P}tokens_`

/** Exported prefix for brand-level CSS variables: `--recursica_brand_` */
export const BRAND_PREFIX = `${P}brand_`

// ─── Tokens ──────────────────────────────────────────────────────────────────

/** Generic token: `--recursica_tokens_{category}_{name}` */
export function token(category: string, name: string): string {
  return `${P}tokens_${category}_${name}`
}

/**
 * New color token: `--recursica_tokens_colors_{scale}_{level}`
 * Example: `tokenColors('scale-01', '500')` → `--recursica_tokens_colors_scale-01_500`
 */
export function tokenColors(scale: string, level: string): string {
  return `${P}tokens_colors_${scale}_${level}`
}

/**
 * Color scale family name: `--recursica_tokens_colors_{scale}_family-name`
 * Stores the user-facing display name for the color scale.
 * Example: `tokenColorFamilyName('scale-05')` → `--recursica_tokens_colors_scale-05_family-name`
 */
export function tokenColorFamilyName(scale: string): string {
  return `${P}tokens_colors_${scale}_family-name`
}

/**
 * Old color token (backwards compat): `--recursica_tokens_color_{family}_{level}`
 * Example: `tokenColor('gray', '500')` → `--recursica_tokens_color_gray_500`
 */
export function tokenColor(family: string, level: string): string {
  return `${P}tokens_color_${family}_${level}`
}

/** `--recursica_tokens_opacities_{name}` */
export function tokenOpacity(name: string): string {
  return `${P}tokens_opacities_${name}`
}

/** `--recursica_tokens_sizes_{name}` */
export function tokenSize(name: string): string {
  return `${P}tokens_sizes_${name}`
}

/** `--recursica_tokens_font_{category}_{key}` e.g. `tokenFont('sizes', 'md')` */
export function tokenFont(category: string, key: string): string {
  return `${P}tokens_font_${category}_${key}`
}

// ─── Brand: Typography ──────────────────────────────────────────────────────

/**
 * `--recursica_brand_typography_{style}-{property}`
 *
 * Typography uses a hyphen between style and property because the style name
 * is a single JSON node (e.g. "caption", "body-small") and the property
 * (e.g. "font-size", "line-height") is another single JSON node. They are
 * joined with `-` because the resolver flattens them into one segment.
 */
export function brandTypography(style: string, property: string): string {
  return `${P}brand_typography_${style}-${property}`
}

// ─── Brand: Dimensions ──────────────────────────────────────────────────────

/** `--recursica_brand_dimensions_{...segments joined with _}` */
export function brandDimensions(...segments: string[]): string {
  return `${P}brand_dimensions_${segments.join('_')}`
}

// ─── Brand: Palettes (specific, theme-scoped) ───────────────────────────────

/**
 * `--recursica_brand_themes_{mode}_palettes_{pk}_{level}_{prop}`
 *
 * @param prop - e.g. 'tone', 'on-tone', 'high-emphasis', 'low-emphasis'
 */
export function palette(
  mode: string,
  pk: string,
  level: string,
  prop: string
): string {
  return `${P}brand_themes_${mode}_palettes_${pk}_${level}_${prop}`
}

/** `--recursica_brand_themes_{mode}_palettes_core_{...rest joined with _}` */
export function paletteCore(mode: string, ...rest: string[]): string {
  return `${P}brand_themes_${mode}_palettes_core_${rest.join('_')}`
}

// ─── Brand: Layers (specific, theme-scoped) ─────────────────────────────────

/**
 * `--recursica_brand_themes_{mode}_layers_layer-{N}_properties_{prop}`
 *
 * @param prop - e.g. 'surface', 'border-color', 'padding', 'border-radius'
 */
export function layerProperty(
  mode: string,
  layerNum: string | number,
  prop: string
): string {
  return `${P}brand_themes_${mode}_layers_layer-${layerNum}_properties_${prop}`
}

/**
 * `--recursica_brand_themes_{mode}_layers_layer-{N}_elements_text-{prop}`
 *
 * @param prop - e.g. 'color', 'high-emphasis', 'low-emphasis', 'alert'
 */
export function layerText(
  mode: string,
  layerNum: string | number,
  prop: string
): string {
  return `${P}brand_themes_${mode}_layers_layer-${layerNum}_elements_text-${prop}`
}

/**
 * `--recursica_brand_themes_{mode}_layers_layer-{N}_elements_interactive-{prop}`
 *
 * @param prop - e.g. 'tone', 'tone-hover', 'on-tone', 'on-tone-hover'
 */
export function layerInteractive(
  mode: string,
  layerNum: string | number,
  prop: string
): string {
  return `${P}brand_themes_${mode}_layers_layer-${layerNum}_elements_interactive-${prop}`
}

/**
 * Raw layer element path for non-standard elements.
 * `--recursica_brand_themes_{mode}_layers_layer-{N}_elements_{elementPath}`
 */
export function layerElement(
  mode: string,
  layerNum: string | number,
  elementPath: string
): string {
  return `${P}brand_themes_${mode}_layers_layer-${layerNum}_elements_${elementPath}`
}

// ─── Brand: States (specific, theme-scoped) ─────────────────────────────────

/** `--recursica_brand_themes_{mode}_states_{...parts joined with _}` */
export function state(mode: string, ...parts: string[]): string {
  return `${P}brand_themes_${mode}_states_${parts.join('_')}`
}

// ─── Brand: Text Emphasis (specific, theme-scoped) ──────────────────────────

/** `--recursica_brand_themes_{mode}_text-emphasis_{level}` */
export function textEmphasis(
  mode: string,
  level: 'high' | 'low' | string
): string {
  return `${P}brand_themes_${mode}_text-emphasis_${level}`
}

// ─── Brand: Elevations (specific, theme-scoped) ─────────────────────────────

/**
 * `--recursica_brand_themes_{mode}_elevations_elevation-{N}_{prop}`
 *
 * @param prop - e.g. 'x-axis', 'y-axis', 'blur', 'spread', 'shadow-color'
 */
export function elevation(
  mode: string,
  level: string | number,
  prop: string
): string {
  return `${P}brand_themes_${mode}_elevations_elevation-${level}_${prop}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// Generic (consumer-level) names — no theme prefix, resolved by CSS cascade
// ═══════════════════════════════════════════════════════════════════════════════

/** `--recursica_brand_palettes_{pk}_{level}_{prop}` */
export function genericPalette(pk: string, level: string, prop: string): string {
  return `${P}brand_palettes_${pk}_${level}_${prop}`
}

/** `--recursica_brand_palettes_core_{...rest joined with _}` */
export function genericPaletteCore(...rest: string[]): string {
  return `${P}brand_palettes_core_${rest.join('_')}`
}

/** `--recursica_brand_layer_{N}_properties_{prop}` */
export function genericLayerProperty(
  layerNum: string | number,
  prop: string
): string {
  return `${P}brand_layer_${layerNum}_properties_${prop}`
}

/** `--recursica_brand_layer_{N}_elements_text-{prop}` */
export function genericLayerText(
  layerNum: string | number,
  prop: string
): string {
  return `${P}brand_layer_${layerNum}_elements_text-${prop}`
}

/** `--recursica_brand_layer_{N}_elements_interactive-{prop}` */
export function genericLayerInteractive(
  layerNum: string | number,
  prop: string
): string {
  return `${P}brand_layer_${layerNum}_elements_interactive-${prop}`
}

/** `--recursica_brand_states_{...parts joined with _}` */
export function genericState(...parts: string[]): string {
  return `${P}brand_states_${parts.join('_')}`
}

/** `--recursica_brand_text-emphasis_{level}` */
export function genericTextEmphasis(level: 'high' | 'low' | string): string {
  return `${P}brand_text-emphasis_${level}`
}

/** `--recursica_brand_elevations_elevation-{N}_{prop}` */
export function genericElevation(
  level: string | number,
  prop: string
): string {
  return `${P}brand_elevations_elevation-${level}_${prop}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// Parsers — reverse-direction functions that decompose CSS var names
//
// All CSS var name parsing MUST go through these functions.
// Consumer code must NEVER use ad-hoc regex to parse CSS var names.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unwrap a `var(...)` expression, returning the raw CSS variable name.
 * Returns `null` if the input is not a `var(...)` expression.
 *
 * @example unwrapVar('var(--recursica_tokens_colors_scale-05_500)') → '--recursica_tokens_colors_scale-05_500'
 * @example unwrapVar('var(--foo, fallback)') → '--foo'
 */
export function unwrapVar(value: string): string | null {
  if (!value) return null
  const m = value.match(/var\s*\(\s*(--[^),]+)/)
  return m ? m[1].trim() : null
}

/**
 * Resolves a CSS variable string back into its JSON DTCG reference format.
 * Dynamically handles any recursica namespace structure.
 * 
 * @example cssVarToRef('var(--recursica_brand_palettes_palette-2_500_color_tone)')
 *   → '{brand.palettes.palette-2.500.color.tone}'
 * @example cssVarToRef('--recursica_tokens_colors_scale-05_500')
 *   → '{tokens.colors.scale-05.500}'
 */
export function cssVarToRef(value: string): string | null {
  if (!value) return null
  
  let unwrapped = value.trim()
  if (unwrapped.startsWith('var(') || unwrapped.startsWith('var (')) {
    const extracted = unwrapVar(unwrapped)
    if (!extracted) return null
    unwrapped = extracted
  }

  if (unwrapped.startsWith(P)) {
    const stripped = unwrapped.slice(P.length)
    const parts = stripped.split('_')
    return `{${parts.join('.')}}`
  }

  return null
}

// ─── Token CSS var parsers ──────────────────────────────────────────────────

export interface ParsedTokenColor {
  type: 'color'
  /** Scale key, e.g. 'scale-05' or family name like 'gray' */
  family: string
  /** Numeric level, e.g. '500', '050', '000', '1000' */
  level: string
}

export interface ParsedTokenOpacity {
  type: 'opacity'
  /** Opacity key, e.g. 'solid', 'veiled', 'smoky' */
  key: string
}

export interface ParsedTokenSize {
  type: 'size'
  /** Size key, e.g. 'default', 'sm', 'lg' */
  key: string
}

export interface ParsedTokenFont {
  type: 'font'
  /** Font subcategory: 'sizes', 'weights', 'letter-spacings', 'line-heights', 'typefaces', 'families', etc. */
  category: string
  /** Font key within the category, e.g. 'md', 'bold', 'tight' */
  key: string
}

export type ParsedToken = ParsedTokenColor | ParsedTokenOpacity | ParsedTokenSize | ParsedTokenFont

/**
 * Parse a token CSS variable name into its constituent parts.
 * Accepts both raw CSS var names (`--recursica_tokens_...`) and
 * `var()` wrapped values (`var(--recursica_tokens_...)`).
 *
 * @example parseTokenCssVar('--recursica_tokens_colors_scale-05_500')
 *   → { type: 'color', family: 'scale-05', level: '500' }
 * @example parseTokenCssVar('var(--recursica_tokens_opacities_solid)')
 *   → { type: 'opacity', key: 'solid' }
 * @example parseTokenCssVar('var(--recursica_tokens_font_sizes_md)')
 *   → { type: 'font', category: 'sizes', key: 'md' }
 */
export function parseTokenCssVar(input: string): ParsedToken | null {
  if (!input) return null
  // Unwrap var() if present
  let name = input.trim()
  if (name.startsWith('var(') || name.startsWith('var (')) {
    const unwrapped = unwrapVar(name)
    if (!unwrapped) return null
    name = unwrapped
  }

  // Must start with token prefix
  if (!name.startsWith(TOKEN_PREFIX)) return null
  const rest = name.slice(TOKEN_PREFIX.length) // e.g. 'colors_scale-05_500'

  // Split on underscores — these are the segment delimiters in CSS var names
  const segments = rest.split('_')
  if (segments.length < 2) return null

  const category = segments[0]

  // colors_scale-05_500 or color_gray_500
  if ((category === 'colors' || category === 'color') && segments.length >= 3) {
    return {
      type: 'color',
      family: segments[1],
      level: segments[2]
    }
  }

  // opacities_solid or opacity_veiled
  if ((category === 'opacities' || category === 'opacity') && segments.length >= 2) {
    return {
      type: 'opacity',
      key: segments[1]
    }
  }

  // sizes_default or size_sm
  if ((category === 'sizes' || category === 'size') && segments.length >= 2) {
    return {
      type: 'size',
      key: segments[1]
    }
  }

  // font_sizes_md or font_weights_bold
  if (category === 'font' && segments.length >= 3) {
    return {
      type: 'font',
      category: segments[1],
      key: segments[2]
    }
  }

  return null
}

// ─── Brand CSS var parsers ──────────────────────────────────────────────────

export interface ParsedBrandPalette {
  type: 'palette'
  mode: string
  paletteName: string
  level: string
  prop: string
}

export interface ParsedBrandCoreColor {
  type: 'core-color'
  mode: string
  /** Remaining path segments after 'core_', joined by '_' */
  path: string
}

export interface ParsedBrandTypography {
  type: 'typography'
  /** Style name, e.g. 'body', 'caption', 'body-small' */
  style: string
  /** Property name, e.g. 'font-size', 'font-weight', 'line-height' */
  property: string
}

export interface ParsedBrandDimension {
  type: 'dimension'
  /** Category, e.g. 'general', 'icons', 'border-radii', 'text-size' */
  category: string
  /** Key within category, e.g. 'sm', 'default', 'lg' */
  key: string
}

export interface ParsedBrandLayer {
  type: 'layer'
  mode: string
  layerNum: number
  section: 'properties' | 'elements'
  prop: string
}

export interface ParsedBrandElevation {
  type: 'elevation'
  mode: string
  level: number
  prop: string
}

export type ParsedBrand = ParsedBrandPalette | ParsedBrandCoreColor | ParsedBrandTypography | ParsedBrandDimension | ParsedBrandLayer | ParsedBrandElevation

/**
 * Parse a brand CSS variable name into its constituent parts.
 * Accepts both raw CSS var names (`--recursica_brand_...`) and
 * `var()` wrapped values (`var(--recursica_brand_...)`).
 *
 * @example parseBrandCssVar('--recursica_brand_themes_light_palettes_core_interactive_default_tone')
 *   → { type: 'core-color', mode: 'light', path: 'interactive_default_tone' }
 * @example parseBrandCssVar('--recursica_brand_typography_body-font-size')
 *   → { type: 'typography', style: 'body', property: 'font-size' }
 * @example parseBrandCssVar('--recursica_brand_dimensions_general_sm')
 *   → { type: 'dimension', category: 'general', key: 'sm' }
 */
export function parseBrandCssVar(input: string): ParsedBrand | null {
  if (!input) return null
  let name = input.trim()
  if (name.startsWith('var(') || name.startsWith('var (')) {
    const unwrapped = unwrapVar(name)
    if (!unwrapped) return null
    name = unwrapped
  }

  if (!name.startsWith(BRAND_PREFIX)) return null
  const rest = name.slice(BRAND_PREFIX.length)
  const segments = rest.split('_')
  if (segments.length < 2) return null

  // typography_{style}-{property}
  if (segments[0] === 'typography' && segments.length >= 2) {
    // The style-property is joined with hyphens in one or more segments
    // e.g. 'body-font-size' or 'body-small-font-size'
    const full = segments.slice(1).join('_')
    // Find the property suffix (font-size, font-weight, font-family, font-letter-spacing, line-height)
    const propertyPatterns = ['font-size', 'font-weight', 'font-family', 'font-letter-spacing', 'line-height']
    for (const prop of propertyPatterns) {
      if (full.endsWith(`-${prop}`)) {
        const style = full.slice(0, -(prop.length + 1))
        return { type: 'typography', style, property: prop }
      }
    }
    // Fallback: split on last hyphen
    const lastHyphen = full.lastIndexOf('-')
    if (lastHyphen > 0) {
      return { type: 'typography', style: full.slice(0, lastHyphen), property: full.slice(lastHyphen + 1) }
    }
    return null
  }

  // dimensions_{category}_{key}
  if (segments[0] === 'dimensions' && segments.length >= 3) {
    return { type: 'dimension', category: segments[1], key: segments.slice(2).join('_') }
  }

  // themes_{mode}_palettes_core_{...path}
  if (segments[0] === 'themes' && segments.length >= 4) {
    const mode = segments[1]
    const section = segments[2]

    if (section === 'palettes') {
      const pk = segments[3]
      if (pk === 'core' && segments.length >= 5) {
        return { type: 'core-color', mode, path: segments.slice(4).join('_') }
      }
      if (segments.length >= 6) {
        return { type: 'palette', mode, paletteName: pk, level: segments[4], prop: segments.slice(5).join('_') }
      }
    }

    if (section === 'layers' && segments.length >= 6) {
      const layerMatch = segments[3].match(/^layer-(\d+)$/)
      if (layerMatch) {
        const layerNum = parseInt(layerMatch[1], 10)
        const subSection = segments[4] as 'properties' | 'elements'
        return { type: 'layer', mode, layerNum, section: subSection, prop: segments.slice(5).join('_') }
      }
    }

    if (section === 'elevations' && segments.length >= 5) {
      const elevMatch = segments[3].match(/^elevation-(\d+)$/)
      if (elevMatch) {
        return { type: 'elevation', mode, level: parseInt(elevMatch[1], 10), prop: segments.slice(4).join('_') }
      }
    }
  }

  return null
}

/**
 * Extract a color token's family and level from a CSS var value.
 * This is the single authorized way to parse color token references
 * from CSS variable names. Handles both `var(...)` wrapped and raw names,
 * and both old format (`color_family_level`) and new format (`colors_scale_level`).
 *
 * @returns `{ family, level }` or `null` if not a color token CSS var
 *
 * @example extractColorToken('var(--recursica_tokens_colors_scale-05_500)')
 *   → { family: 'scale-05', level: '500' }
 * @example extractColorToken('--recursica_tokens_color_gray_500')
 *   → { family: 'gray', level: '500' }
 */
export function extractColorToken(input: string): { family: string; level: string } | null {
  const parsed = parseTokenCssVar(input)
  if (!parsed || parsed.type !== 'color') return null
  return { family: parsed.family, level: parsed.level }
}

/**
 * Extract a color token from a `color-mix()` expression.
 * Finds the first `var(--recursica_tokens_color...)` inside the expression.
 *
 * @example extractColorTokenFromColorMix('color-mix(in srgb, var(--recursica_tokens_colors_scale-05_500) 80%, transparent)')
 *   → { family: 'scale-05', level: '500' }
 */
export function extractColorTokenFromColorMix(input: string): { family: string; level: string } | null {
  if (!input) return null
  const varMatch = input.match(/var\s*\(\s*(--recursica_tokens_colors?_[^)]+)\s*\)/)
  if (!varMatch) return null
  return extractColorToken(varMatch[1])
}

/**
 * Convert a parsed token color back to a token path like `colors/scale-05/500`.
 * Convenience function for consumers that need the token path format.
 */
export function colorTokenToPath(family: string, level: string): string {
  // Normalize level but preserve 000 and 1000
  const normalizedLevel = level === '000' ? '000' : level === '1000' ? '1000' : String(Number(level))
  return `colors/${family}/${normalizedLevel}`
}
