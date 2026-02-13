/**
 * Recursica JSON Transform - Specific CSS
 *
 * Self-contained transform: takes tokens, brand, uikit JSON and produces
 * recursica_variables_specific.css. No imports from the project.
 * Portable to other projects or standalone npm package.
 *
 * See docs/EXPORT_PIPELINE_REFACTOR_PLAN.md for design principles and approach.
 *
 * Approach:
 * - Traverse JSON, collect path/value pairs
 * - Path → var name: --recursica_ + segments joined by underscore
 * - Refs {path.to.x} → var(--recursica_path_to_x), no resolution
 * - Validate refs and values; throw with all errors if invalid
 */

const FILENAME = 'recursica_variables_specific.css'
const PREFIX = '--recursica_'
const TRANSFORM_VERSION = '1.1.0'

/**
 * Workaround: Incorrect refs in the JSON. These rules map invalid ref paths to the correct paths.
 * TODO: Remove when JSON is fixed. Console.warn when applied; not treated as validation errors.
 */
const REF_CORRECTIONS: Array<{ pattern: RegExp; replacement: string; comment: string }> = [
  {
    // Ref uses {brand.palettes.core-black} / {brand.palettes.core-white} but actual path is
    // brand.themes.{theme}.palettes.core-colors.{black|white}.tone. Found in palette level
    // color.on-tone (e.g. brand.themes.light.palettes.neutral.100.color.on-tone).
    pattern: /^brand\.themes\.(light|dark)\.palettes\.core-(black|white)$/,
    replacement: 'brand.themes.$1.palettes.core-colors.$2.tone',
    comment: 'Use core-colors.black.tone / core-colors.white.tone instead of core-black / core-white. Fix in palette level color.on-tone.'
  }
]

function applyRefCorrection(expandedPath: string, ref: string, currentPath: string): string | null {
  for (const { pattern, replacement, comment } of REF_CORRECTIONS) {
    if (pattern.test(expandedPath)) {
      const corrected = expandedPath.replace(pattern, replacement)
      console.warn(
        `[recursica transform] Correcting invalid ref "${ref}"\n` +
          `  JSON path to fix: ${currentPath}\n` +
          `  Corrected to: ${corrected}\n` +
          `  Issue: ${comment}`
      )
      return corrected
    }
  }
  return null
}

/** Output file from the transform. */
export type ExportFile = { filename: string; contents: string }

/** Input JSON: tokens, brand, and uikit design tokens. */
export interface RecursicaJsonInput {
  tokens: Record<string, unknown>
  brand: Record<string, unknown>
  uikit: Record<string, unknown>
}

/** Validation error: JSON path where the problem was found and description. */
export interface TransformError {
  path: string
  message: string
}

/**
 * Converts a JSON path to a CSS variable name.
 * Underscores in key names are escaped as __ to avoid ambiguity with segment separators.
 * @param path - Dot-separated path (e.g. tokens.colors.scale-02.500 or ui-kit.globals.label_field_gap)
 * @returns CSS var name (e.g. --recursica_tokens_colors_scale-02_500)
 */
function pathToVarName(path: string): string {
  const segments = path.split('.').filter(Boolean)
  if (segments.length === 0) return ''
  const escaped = segments.map((seg) => seg.replace(/_/g, '__'))
  return PREFIX + escaped.join('_')
}

/**
 * Type guard: true if value is a JSON reference string like {path.to.thing}.
 */
function isRef(val: unknown): val is string {
  return typeof val === 'string' && /^\{[^}]+\}$/.test(val.trim())
}

/**
 * Extracts the path from a reference string.
 * @param ref - e.g. "{brand.palettes.neutral.100.tone}"
 * @returns e.g. "brand.palettes.neutral.100.tone"
 */
function extractRefPath(ref: string): string {
  return ref.trim().slice(1, -1).trim()
}

/** Default palette levels when ref uses .default (e.g. brand.palettes.neutral.default). */
const DEFAULT_LEVELS: Record<string, Record<string, string>> = {
  light: { neutral: '200', 'palette-1': '400', 'palette-2': '400' },
  dark: { neutral: '800', 'palette-1': '600', 'palette-2': '600' }
}

/**
 * Expands theme-relative refs using the current path as context.
 * e.g. brand.palettes.neutral.100 → brand.themes.light.palettes.neutral.100 when currentPath is in light theme.
 * Handles palettes.black/white, palettes.neutral.default, etc.
 * @param refPath - The reference path from the JSON
 * @param currentPath - Path where the ref appears (used to infer theme)
 */
function expandRefPath(refPath: string, currentPath: string): string {
  let theme: string | null = null
  const themeMatch = currentPath.match(/^brand\.themes\.(light|dark)\./)
  if (themeMatch) theme = themeMatch[1]
  else if (currentPath.startsWith('ui-kit.')) theme = 'light'
  if (!theme || !refPath.startsWith('brand.')) return refPath

  const afterBrand = refPath.slice(6)
  const themeScoped = ['palettes', 'elevations', 'layers', 'states', 'text-emphasis']
  for (const key of themeScoped) {
    if (afterBrand === key || afterBrand.startsWith(key + '.')) {
      let expanded = `brand.themes.${theme}.${afterBrand}`
      if (afterBrand === 'palettes.black' || afterBrand === 'palettes.white') {
        expanded = `brand.themes.${theme}.palettes.core-colors.${afterBrand.replace('palettes.', '')}.tone`
      } else if (afterBrand.match(/^palettes\.(neutral|palette-1|palette-2)\.default/)) {
        const paletteMatch = afterBrand.match(/^palettes\.(neutral|palette-1|palette-2)\.default(\..*)?$/)
        if (paletteMatch) {
          const palette = paletteMatch[1]
          const rest = paletteMatch[2] || ''
          const level = DEFAULT_LEVELS[theme]?.[palette] ?? '500'
          expanded = `brand.themes.${theme}.palettes.${palette}.${level}${rest}`
        }
      }
      return expanded
    }
  }
  return refPath
}

/**
 * Returns candidate paths for alias resolution (e.g. tokens.size.X → tokens.sizes.X,
 * brand.typography.h3.font-family → brand.typography.h3.fontFamily).
 * Used when validating refs: refs may use kebab-case while JSON uses camelCase.
 * @param path - The reference path to resolve
 * @returns Array of candidate paths to check against emitted vars
 */
function resolvePathAlias(path: string): string[] {
  const candidates = [path]
  if (path.startsWith('tokens.size.')) candidates.push(path.replace('tokens.size.', 'tokens.sizes.'))
  if (path.startsWith('tokens.opacity.')) candidates.push(path.replace('tokens.opacity.', 'tokens.opacities.'))
  if (path.startsWith('tokens.font.')) {
    const fontAliases: [RegExp, string][] = [
      [/^tokens\.font\.letter-spacing\./, 'tokens.font.letter-spacings.'],
      [/^tokens\.font\.line-height\./, 'tokens.font.line-heights.'],
      [/^tokens\.font\.size\./, 'tokens.font.sizes.'],
      [/^tokens\.font\.weight\./, 'tokens.font.weights.'],
    ]
    for (const [re, replacement] of fontAliases) {
      if (re.test(path)) candidates.push(path.replace(re, replacement))
    }
    if (path.startsWith('tokens.font.sizes.') && path.endsWith('.me')) {
      candidates.push(path.replace(/\.me$/, '.md'))
    }
  }
  const m = path.match(/^brand\.themes\.(light|dark)\.palettes\.(black|white)$/)
  if (m) candidates.push(`brand.themes.${m[1]}.palettes.core-colors.${m[2]}.tone`)
  const coreBlackWhite = path.match(/^brand\.themes\.(light|dark)\.palettes\.core-colors\.(black|white)$/)
  if (coreBlackWhite) candidates.push(`${path}.tone`)
  const coreColor = path.match(/^brand\.themes\.(light|dark)\.palettes\.core-colors\.(warning|success|alert)$/)
  if (coreColor) candidates.push(`${path}.tone`)
  const typographyProp = path.match(/^brand\.typography\.[^.]+\.(font-family|font-size|font-weight|letter-spacing|line-height|font-style|text-transform|text-case|text-decoration)$/)
  if (typographyProp) {
    const kebabToCamel: Record<string, string> = {
      'font-family': 'fontFamily',
      'font-size': 'fontSize',
      'font-weight': 'fontWeight',
      'letter-spacing': 'letterSpacing',
      'line-height': 'lineHeight',
      'font-style': 'fontStyle',
      'text-transform': 'textCase',
      'text-case': 'textCase',
      'text-decoration': 'textDecoration'
    }
    const camel = kebabToCamel[typographyProp[1]] || typographyProp[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    candidates.push(path.replace(new RegExp(typographyProp[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), camel))
  }
  const paletteLevel = path.match(/^brand\.themes\.(light|dark)\.palettes\.([^.]+)\.(\d{3,4}|default|primary)$/)
  if (paletteLevel) candidates.push(`${path}.color.tone`)

  const layersInteractiveColor = path.match(/^brand\.themes\.(light|dark)\.layers\.(layer-\d+)\.elements\.interactive\.color$/)
  if (layersInteractiveColor) candidates.push(`brand.themes.${layersInteractiveColor[1]}.layers.${layersInteractiveColor[2]}.elements.interactive.tone`)

  if (path.match(/^brand\.dimensions\.border-radii\.md$/)) candidates.push('brand.dimensions.border-radii.default')
  if (path.match(/^brand\.dimensions\.general\.xs$/)) candidates.push('brand.dimensions.general.sm')

  return candidates
}

/**
 * Formats a value for CSS output. Validates refs (must target existing vars) and values.
 * Pushes validation errors to the errors array.
 * @param val - The value (ref, hex, number, dimension, array, etc.)
 * @param currentPath - JSON path where this value appears (for error reporting)
 * @param allVarNames - Set of all emitted var names (for ref validation)
 * @param errors - Accumulator for validation errors
 * @returns CSS-formatted string, or null for null/undefined
 */
function formatValue(val: unknown, currentPath: string, allVarNames: Set<string>, errors: TransformError[]): string | null {
  if (val == null) return null

  if (isRef(val)) {
    const refPath = extractRefPath(val)
    const expanded = expandRefPath(refPath, currentPath)
    const candidates = resolvePathAlias(expanded)
    let resolved: string | null = candidates.find((p) => allVarNames.has(pathToVarName(p))) ?? null
    if (!resolved) {
      const corrected = applyRefCorrection(expanded, val, currentPath)
      if (corrected && allVarNames.has(pathToVarName(corrected))) {
        resolved = corrected
      }
    }
    if (!resolved) {
      const varName = pathToVarName(expanded)
      errors.push({
        path: currentPath,
        message: `Reference '${val}' targets non-existent var ${varName}`
      })
      return `var(${varName})`
    }
    return `var(${pathToVarName(resolved)})`
  }

  if (typeof val === 'string') {
    if (/^#[0-9a-fA-F]{3,8}$/.test(val)) return val
    if (val === 'none' || val === 'normal' || val === 'italic' || val === 'uppercase' || val === 'lowercase') return val
    if (val.includes('var(')) return val
    return `"${val.replace(/"/g, '\\"')}"`
  }

  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      errors.push({ path: currentPath, message: `Invalid number: ${val}` })
      return String(val)
    }
    return String(val)
  }

  if (typeof val === 'object' && val !== null && 'value' in val) {
    const obj = val as { value: unknown; unit?: string }
    if (isRef(obj.value)) {
      const refPath = extractRefPath(obj.value)
      const expanded = expandRefPath(refPath, currentPath)
      const candidates = resolvePathAlias(expanded)
      let resolved: string | null = candidates.find((p) => allVarNames.has(pathToVarName(p))) ?? null
      if (!resolved) {
        const corrected = applyRefCorrection(expanded, String(obj.value), currentPath)
        if (corrected && allVarNames.has(pathToVarName(corrected))) {
          resolved = corrected
        }
      }
      if (!resolved) {
        const varName = pathToVarName(expanded)
        errors.push({
          path: currentPath,
          message: `Reference '${obj.value}' targets non-existent var ${varName}`
        })
      }
      return `var(${pathToVarName(resolved || expanded)})`
    }
    if (typeof obj.value === 'number') {
      const rawUnit = obj.unit || 'px'
      const unit = rawUnit === 'percentage' ? '%' : rawUnit
      if (!Number.isFinite(obj.value)) {
        errors.push({ path: currentPath, message: `Invalid dimension value: ${obj.value}` })
      }
      return `${obj.value}${unit}`
    }
  }

  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === 'string' ? `"${v}"` : String(v))).join(', ')
  }

  errors.push({ path: currentPath, message: `Unsupported value type: ${typeof val}` })
  return String(val)
}

/**
 * Recursively collects path/value pairs from the JSON structure.
 * Handles $value wrappers, nested objects (e.g. typography with fontFamily, fontSize),
 * leaf primitives, and dimension objects {value, unit}.
 * @param obj - Current node in the JSON tree
 * @param pathPrefix - Accumulated path so far (e.g. brand.typography.h3)
 * @param out - Accumulator for collected {path, value} entries
 */
function collectVars(obj: unknown, pathPrefix: string, out: Array<{ path: string; value: unknown }>): void {
  if (obj == null) return

  // Leaf values from recursing into $value children (e.g. typography.fontFamily)
  if (typeof obj === 'string' || typeof obj === 'number') {
    out.push({ path: pathPrefix, value: obj })
    return
  }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj) && 'value' in obj && 'unit' in (obj as object)) {
    out.push({ path: pathPrefix, value: obj })
    return
  }

  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>
    if ('$value' in record) {
      const v = record.$value
      if (v != null && typeof v === 'object' && !Array.isArray(v) && !('value' in v && 'unit' in v)) {
        for (const [k, child] of Object.entries(v)) {
          if (k.startsWith('$')) continue
          collectVars(child, pathPrefix ? `${pathPrefix}.${k}` : k, out)
        }
        return
      }
      out.push({ path: pathPrefix, value: v })
      return
    }
    for (const [k, v] of Object.entries(record)) {
      if (k.startsWith('$')) continue
      collectVars(v, pathPrefix ? `${pathPrefix}.${k}` : k, out)
    }
  }
}

/**
 * Flattens the input JSON into path/value entries. Handles nested structure
 * (tokens.tokens, brand.brand, uikit['ui-kit']), elevation composites, and dark layer-0 aliases.
 */
function flattenInput(json: RecursicaJsonInput): Array<{ path: string; value: unknown }> {
  const out: Array<{ path: string; value: unknown }> = []
  const tokens = (json.tokens as Record<string, unknown>)?.tokens ?? json.tokens
  const brand = (json.brand as Record<string, unknown>)?.brand ?? json.brand
  const uikit = (json.uikit as Record<string, unknown>)?.['ui-kit'] ?? json.uikit

  if (tokens) collectVars(tokens, 'tokens', out)
  if (brand) collectVars(brand, 'brand', out)
  if (uikit) collectVars(uikit, 'ui-kit', out)

  if (brand) injectElevationComposites(brand as Record<string, unknown>, out)
  injectDarkLayer0InteractiveAliases(out)
  return out
}

/**
 * Dark theme layer-0 uses color/hover-color but ui-kit expects tone/on-tone/tone-hover/on-tone-hover.
 * Adds synthetic entries so dark layer-0 emits the same semantic names as light.
 */
function injectDarkLayer0InteractiveAliases(out: Array<{ path: string; value: unknown }>): void {
  const paths = new Set(out.map((e) => e.path))
  const base = 'brand.themes.dark.layers.layer-0.elements.interactive'
  const hasColor = paths.has(`${base}.color`)
  const hasHoverColor = paths.has(`${base}.hover-color`)
  const hasTone = paths.has(`${base}.tone`)
  if (!hasTone && (hasColor || hasHoverColor)) {
    if (hasColor) out.push({ path: `${base}.tone`, value: `{${base}.color}` })
    if (hasHoverColor) out.push({ path: `${base}.tone-hover`, value: `{${base}.hover-color}` })
    out.push({ path: `${base}.on-tone`, value: '{brand.palettes.palette-1.default.color.on-tone}' })
    out.push({ path: `${base}.on-tone-hover`, value: '{brand.palettes.palette-1.600.color.on-tone}' })
  }
}

/**
 * Injects composite box-shadow vars for each elevation in brand.themes.{light,dark}.elevations.
 * The composite is built from var refs to the part vars (x, y, blur, spread, color), so consumers
 * can override individual parts. Parts are collected by normal traversal; we add the composite.
 */
function injectElevationComposites(brand: Record<string, unknown>, out: Array<{ path: string; value: unknown }>): void {
  const themes = brand?.themes as Record<string, unknown> | undefined
  if (!themes) return
  for (const [theme, themeData] of Object.entries(themes)) {
    const elevations = (themeData as Record<string, unknown>)?.elevations as Record<string, unknown> | undefined
    if (!elevations) continue
    for (const [name, elev] of Object.entries(elevations)) {
      const v = elev as Record<string, unknown> | undefined
      const val = v?.$value as Record<string, unknown> | undefined
      if (!val || typeof val !== 'object') continue
      const basePath = `brand.themes.${theme}.elevations.${name}`
      const composite = `var(${pathToVarName(`${basePath}.x`)}) var(${pathToVarName(`${basePath}.y`)}) var(${pathToVarName(`${basePath}.blur`)}) var(${pathToVarName(`${basePath}.spread`)}) var(${pathToVarName(`${basePath}.color`)})`
      out.push({ path: basePath, value: composite })
    }
  }
}

/**
 * Transforms tokens, brand, and uikit JSON into specific CSS variables.
 * All vars emitted on :root. Throws if validation fails (invalid refs, bad values).
 */
export function recursicaJsonTransform(json: RecursicaJsonInput): ExportFile[] {
  const entries = flattenInput(json)
  const allVarNames = new Set(entries.map((e) => pathToVarName(e.path)))
  const errors: TransformError[] = []
  const varMap: Array<{ name: string; value: string }> = []

  for (const { path, value } of entries) {
    const formatted = formatValue(value, path, allVarNames, errors)
    if (formatted != null) {
      varMap.push({ name: pathToVarName(path), value: formatted })
    }
  }

  if (errors.length > 0) {
    const msg = `Transform validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):\n` + errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')
    throw new Error(msg)
  }

  const sorted = varMap.sort((a, b) => a.name.localeCompare(b.name))
  const css = formatCss(sorted)
  return [{ filename: FILENAME, contents: css }]
}

/**
 * Builds the final CSS string with header and :root block.
 */
function formatCss(vars: Array<{ name: string; value: string }>): string {
  const buildDate = new Date().toUTCString()
  let css = `/*\n`
  css += ` * Recursica CSS Variables - Specific\n`
  css += ` * Transform version: ${TRANSFORM_VERSION}\n`
  css += ` * Generated: ${buildDate}\n`
  css += ` *\n`
  css += ` * About Recursica:\n`
  css += ` * Recursica is a design token system that manages variables across three layers: tokens (primitives),\n`
  css += ` * brand (themes, palettes, layers), and ui-kit (component-level styles). Variables have semantic\n`
  css += ` * meaning—tokens define raw values, brand applies theming and layering, ui-kit exposes component\n`
  css += ` * properties. Use the variables as intended for consistent theming and easy updates.\n`
  css += ` *\n`
  css += ` * Multi-layer approach:\n`
  css += ` * - Tokens: Primitive values (colors, sizes, typography). Foundation layer.\n`
  css += ` * - Brand: Applies tokens to themes (light/dark), palettes, and elevation layers (0-3).\n`
  css += ` * - UI-kit: Component-specific variables that reference brand; abstract surface, text, border colors.\n`
  css += ` *\n`
  css += ` * Format: All variables are on :root. Include this file and apply via CSS custom properties.\n`
  css += ` *\n`
  css += ` * Usage in your components:\n`
  css += ` * - Reference ui-kit variables (--recursica_ui-kit_*) in your component styles\n`
  css += ` * - Avoid referencing brand layer variables (--recursica_brand_themes_*_layers_*) directly; ui-kit abstracts these\n`
  css += ` * - ui-kit variables never reference tokens directly; they go through brand for theming\n`
  css += ` *\n`
  css += ` * WARNING: This CSS is auto-generated from Recursica JSON files (tokens, brand, ui-kit).\n`
  css += ` * NEVER modify this file directly or override its variables in your app. Doing so breaks\n`
  css += ` * Recursica's ability to manage variables and styles. Make changes in the JSON source and re-export.\n`
  css += ` */\n\n`
  css += `:root {\n`
  for (const { name, value } of vars) {
    css += `  ${name}: ${value};\n`
  }
  css += `}\n`
  return css
}
