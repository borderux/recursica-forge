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
