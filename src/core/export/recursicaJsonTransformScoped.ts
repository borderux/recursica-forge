/**
 * Recursica JSON Transform - Scoped CSS
 *
 * Self-contained transform: takes tokens, brand, uikit JSON and produces
 * recursica_variables_scoped.css. No imports from the project.
 * Portable to other projects or standalone npm package.
 *
 * Architecture: See docs/SCOPED_CSS_ARCHITECTURE.md.
 * - :root holds ALL variables with specific (full-path) names so every ref resolves at root.
 * - Theme and layer blocks only set generic names that alias to root (var(specificNameOnRoot)).
 * - No generic names on root; no values in blocks that reference vars outside root.
 */

const FILENAME = 'recursica_variables_scoped.css'
const PREFIX = '--recursica_'
const TRANSFORM_VERSION = '1.1.0'

/** Maps brand.typography $value keys (camelCase) to CSS property names. */
const TYPOGRAPHY_JSON_TO_CSS_PROP: Record<string, string> = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  fontStyle: 'font-style',
  letterSpacing: 'letter-spacing',
  lineHeight: 'line-height',
  textCase: 'text-transform',
  textDecoration: 'text-decoration'
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

/** Scope for CSS variable placement: root, theme-only, or theme+layer. */
type ScopeKind = 'root' | { theme: 'light' | 'dark' } | { theme: 'light' | 'dark'; layer: string }

/**
 * Converts a JSON path to a CSS variable name.
 * Underscores in key names are escaped as __ to avoid ambiguity with segment separators.
 * @param path - Dot-separated path (e.g. tokens.colors.scale-02.500)
 * @returns CSS var name (e.g. --recursica_tokens_colors_scale-02_500)
 */
function pathToVarName(path: string): string {
  const segments = path.split('.').filter(Boolean)
  if (segments.length === 0) return ''
  const escaped = segments.map((seg) => seg.replace(/_/g, '__'))
  return PREFIX + escaped.join('_')
}

/**
 * Returns the var name for a path in a scoped context. For theme/layer scopes,
 * strips the theme and layer from the path so the selector provides context.
 * Underscores in key names are escaped as __.
 * @param path - Full JSON path
 * @param scope - Where this var will be emitted (root, theme, or theme+layer)
 */
function pathToScopedVarName(path: string, scope: ScopeKind): string {
  if (scope === 'root') return pathToVarName(path)
  const escapeSegments = (s: string) => s.split('.').map((seg) => seg.replace(/_/g, '__')).join('_')
  if ('layer' in scope) {
    const layerPrefix = `brand.themes.${scope.theme}.layers.layer-${scope.layer}.`
    if (path.startsWith(layerPrefix)) {
      const rest = path.slice(layerPrefix.length)
      return PREFIX + 'brand_layer_' + scope.layer + '_' + escapeSegments(rest)
    }
  }
  if ('theme' in scope && !('layer' in scope)) {
    const themePrefix = `brand.themes.${scope.theme}.`
    if (path.startsWith(themePrefix)) {
      const rest = path.slice(themePrefix.length)
      if (rest.startsWith('layers.') && /^layers\.layer-\d+\./.test(rest)) return pathToVarName(path)
      const restWithoutLayers = rest.replace(/^layers\.layer-\d+\./, '')
      if (restWithoutLayers !== rest) return pathToVarName(path)
      return PREFIX + 'brand_' + escapeSegments(rest)
    }
  }
  return pathToVarName(path)
}

/**
 * Returns the root (specific) variable name for a layer-specific ui-kit path.
 * Includes theme and layer in the name so root has one var per (theme, layer).
 * Example: ui-kit.components.Modal.properties.colors.layer-0.background, theme 'dark'
 *   → --recursica_ui-kit_themes_dark_layer_0_components_Modal_properties_colors_background
 */
function pathToRootVarNameLayerSpecificUIKit(path: string, theme: 'light' | 'dark'): string {
  const layer = getLayerFromUIKitPath(path)
  if (layer == null) return pathToVarName(path)
  const canonicalPath = getCanonicalUIKitPath(path)
  const canonicalVarName = pathToVarName(canonicalPath)
  const withoutPrefix = canonicalVarName.slice(PREFIX.length)
  return PREFIX + 'ui-kit_themes_' + theme + '_layer_' + layer + '_' + withoutPrefix
}

/**
 * Determines which scope block a path belongs to.
 * tokens, brand.typography, brand.dimensions, ui-kit (except layer-specific) → root.
 * Layer-specific ui-kit paths (ui-kit.*.layer-N.*) are handled separately: emitted in theme+layer blocks only.
 * brand.themes.{light|dark}.* (excluding layers) → theme.
 * brand.themes.{light|dark}.layers.layer-N.* → theme+layer.
 */
function getScope(path: string): ScopeKind {
  if (path.startsWith('tokens.') || path.startsWith('brand.typography.') || path.startsWith('brand.dimensions.')) return 'root'
  if (path.startsWith('ui-kit.')) return 'root'
  const themeLayer = path.match(/^brand\.themes\.(light|dark)\.layers\.layer-(\d+)\./)
  if (themeLayer) return { theme: themeLayer[1] as 'light' | 'dark', layer: themeLayer[2] }
  const themeOnly = path.match(/^brand\.themes\.(light|dark)\./)
  if (themeOnly) return { theme: themeOnly[1] as 'light' | 'dark' }
  return 'root'
}

/**
 * Type guard: true if value is a JSON reference string like {path.to.thing}.
 */
function isRef(val: unknown): val is string {
  return typeof val === 'string' && /^\{[^}]+\}$/.test(val.trim())
}

/**
 * Extracts the path from a reference string.
 * @param ref - e.g. "{brand.palettes.neutral.100.color.tone}"
 * @returns e.g. "brand.palettes.neutral.100.color.tone"
 */
function extractRefPath(ref: string): string {
  return ref.trim().slice(1, -1).trim()
}

/** Default palette levels when ref uses .default. */
const DEFAULT_LEVELS: Record<string, Record<string, string>> = {
  light: { neutral: '200', 'palette-1': '400', 'palette-2': '400' },
  dark: { neutral: '800', 'palette-1': '600', 'palette-2': '600' }
}

/**
 * Expands theme-relative refs using the current path as context.
 * e.g. brand.palettes.neutral.100 → brand.themes.light.palettes.neutral.100 when currentPath is in light theme.
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
  const coreBlackWhiteShort = path.match(/^brand\.themes\.(light|dark)\.palettes\.core-(black|white)$/)
  if (coreBlackWhiteShort) candidates.push(`brand.themes.${coreBlackWhiteShort[1]}.palettes.core-colors.${coreBlackWhiteShort[2]}.tone`)
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

/** Options when formatting a value for root (use specific names for refs, optional theme for ui-kit ref expansion). */
type FormatValueRootOptions = {
  refNamer: (path: string) => string
  themeForExpand?: 'light' | 'dark'
}

/**
 * Formats a value for CSS output. Validates refs and values; pushes errors to the errors array.
 * When options.refNamer is provided (for root output), refs use that namer and options.themeForExpand
 * controls which theme expandRefPath uses for theme-relative refs.
 */
function formatValue(
  val: unknown,
  currentPath: string,
  allVarNames: Set<string>,
  errors: TransformError[],
  options?: FormatValueRootOptions
): string | null {
  if (val == null) return null
  const pathForExpand = options?.themeForExpand ? `brand.themes.${options.themeForExpand}.layers.layer-0` : currentPath
  const refNamer = options?.refNamer ?? ((path: string) => pathToScopedVarName(path, getScope(path)))

  if (isRef(val)) {
    const refPath = extractRefPath(val)
    const expanded = expandRefPath(refPath, pathForExpand)
    const candidates = resolvePathAlias(expanded)
    const resolved: string | null = candidates.find((p) => allVarNames.has(pathToVarName(p))) ?? null
    if (!resolved) {
      const varName = pathToVarName(expanded)
      errors.push({
        path: currentPath,
        message: `Reference '${val}' targets non-existent var ${varName}`
      })
      return `var(${refNamer(expanded)})`
    }
    return `var(${refNamer(resolved)})`
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
      const expanded = expandRefPath(refPath, pathForExpand)
      const candidates = resolvePathAlias(expanded)
      const resolved: string | null = candidates.find((p) => allVarNames.has(pathToVarName(p))) ?? null
      if (!resolved) {
        const varName = pathToVarName(expanded)
        errors.push({
          path: currentPath,
          message: `Reference '${obj.value}' targets non-existent var ${varName}`
        })
      }
      const target = resolved || expanded
      return `var(${refNamer(target)})`
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

/** Entry from flatten: path, value, and optional $type when the token had a $value wrapper. */
type FlatEntry = { path: string; value: unknown; type?: string }

/**
 * Recursively collects path/value pairs from the JSON structure.
 * Handles $value wrappers, nested objects, leaf primitives, and dimension objects.
 * When a token has $value, we also pass $type so null values can get a type-based fallback.
 */
function collectVars(obj: unknown, pathPrefix: string, out: FlatEntry[]): void {
  if (obj == null) return

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
      const tokenType = typeof record.$type === 'string' ? (record.$type as string) : undefined
      if (v != null && typeof v === 'object' && !Array.isArray(v) && !('value' in v && 'unit' in v)) {
        for (const [k, child] of Object.entries(v)) {
          if (k.startsWith('$')) continue
          collectVars(child, pathPrefix ? `${pathPrefix}.${k}` : k, out)
        }
        return
      }
      out.push({ path: pathPrefix, value: v, type: tokenType })
      return
    }
    for (const [k, v] of Object.entries(record)) {
      if (k.startsWith('$')) continue
      collectVars(v, pathPrefix ? `${pathPrefix}.${k}` : k, out)
    }
  }
}

/**
 * Flattens the input JSON into path/value entries.
 * Handles nested structure, elevation composites, and dark layer-0 interactive aliases.
 */
function flattenInput(json: RecursicaJsonInput): FlatEntry[] {
  const out: FlatEntry[] = []
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
 * Dark theme layers use color/hover-color but ui-kit expects tone/on-tone/tone-hover/on-tone-hover.
 * Adds synthetic entries so dark layer-0..3 emit the same semantic names as light (refs resolve on root).
 */
function injectDarkLayer0InteractiveAliases(out: Array<{ path: string; value: unknown }>): void {
  const paths = new Set(out.map((e) => e.path))
  for (const layer of ['0', '1', '2', '3']) {
    const base = `brand.themes.dark.layers.layer-${layer}.elements.interactive`
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
}

/**
 * Injects composite box-shadow vars for each elevation in brand.themes.{light,dark}.elevations.
 * The composite is built from var refs to the part vars (x, y, blur, spread, color).
 */
function injectElevationComposites(brand: Record<string, unknown>, out: Array<{ path: string; value: unknown }>): void {
  const themes = (brand as Record<string, unknown>)?.themes as Record<string, unknown> | undefined
  if (!themes) return
  for (const [theme, themeData] of Object.entries(themes)) {
    const elevations = (themeData as Record<string, unknown>)?.elevations as Record<string, unknown> | undefined
    if (!elevations) continue
    for (const [name, elev] of Object.entries(elevations)) {
      const v = elev as Record<string, unknown> | undefined
      const val = v?.$value as Record<string, unknown> | undefined
      if (!val || typeof val !== 'object') continue
      const basePath = `brand.themes.${theme}.elevations.${name}`
      const x = pathToVarName(`${basePath}.x`)
      const y = pathToVarName(`${basePath}.y`)
      const blur = pathToVarName(`${basePath}.blur`)
      const spread = pathToVarName(`${basePath}.spread`)
      const color = pathToVarName(`${basePath}.color`)
      const composite = `var(${x}) var(${y}) var(${blur}) var(${spread}) var(${color})`
      out.push({ path: basePath, value: composite })
    }
  }
}

/**
 * Returns the map key for a scope (root, light, dark, light+layer-0, etc.).
 */
function getScopeKey(scope: ScopeKind): string {
  if (scope === 'root') return 'root'
  if ('layer' in scope) return `${scope.theme}+layer-${scope.layer}`
  return scope.theme
}

/** True if path is a ui-kit path that includes a layer segment (e.g. ...colors.layer-0.background). */
function isLayerSpecificUIKitPath(path: string): boolean {
  return path.startsWith('ui-kit.') && /\.layer-\d+\./.test(path)
}

/** Removes the .layer-N. segment so one canonical name is used for all layers. */
function getCanonicalUIKitPath(path: string): string {
  return path.replace(/\.layer-\d+\./, '.')
}

/** Extracts the layer number from a ui-kit path (e.g. layer-1 from ...colors.layer-1.background). */
function getLayerFromUIKitPath(path: string): string | null {
  const m = path.match(/\.layer-(\d+)\./)
  return m ? m[1] : null
}

const LAYER_SPECIFIC_ROOT_PATTERN = /^--recursica_ui-kit_themes_(light|dark)_layer_(\d+)_(.+)$/

/** Extract canonical var name from a root layer-specific var name, or null if not layer-specific. */
function rootLayerSpecificNameToCanonical(rootName: string): string | null {
  const m = rootName.match(LAYER_SPECIFIC_ROOT_PATTERN)
  if (!m) return null
  return PREFIX + 'ui-kit_' + m[3]
}

/**
 * Builds root var name for layer-specific ui-kit from canonical name and theme/layer.
 */
function pathToRootVarNameFromCanonical(
  canonicalVarName: string,
  theme: 'light' | 'dark',
  layer: string
): string {
  const rest = canonicalVarName.slice((PREFIX + 'ui-kit_').length)
  return PREFIX + 'ui-kit_themes_' + theme + '_layer_' + layer + '_' + rest
}

/**
 * Validates that every canonical layer-specific ui-kit var is defined in the JSON for every layer.
 * Pushes to errors when a var appears in only some layers (incomplete JSON).
 */
function validateLayerSpecificUIKitRootComplete(
  entries: FlatEntry[],
  errors: TransformError[]
): void {
  const layersByCanonical = new Map<string, Set<string>>()
  for (const { path } of entries) {
    if (!isLayerSpecificUIKitPath(path)) continue
    const layer = getLayerFromUIKitPath(path)
    if (layer == null) continue
    const canonicalPath = getCanonicalUIKitPath(path)
    const canonicalName = pathToVarName(canonicalPath)
    if (!layersByCanonical.has(canonicalName)) layersByCanonical.set(canonicalName, new Set())
    layersByCanonical.get(canonicalName)!.add(layer)
  }

  const sortedLayers = ['0', '1', '2', '3']
  for (const [canonical, layers] of layersByCanonical) {
    if (layers.size === sortedLayers.length) continue
    const missing = sortedLayers.filter((l) => !layers.has(l))
    const definedIn = [...layers].sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).join(', ')
    const pathHint = canonical.replace(PREFIX, '').replace(/_/g, '.')
    errors.push({
      path: pathHint,
      message: `Layer-specific ui-kit var is defined only in layer(s) ${definedIn}; missing in layer(s) ${missing.join(', ')}. Add explicit values in UIKit.json for every layer.`
    })
  }
}

/**
 * Ensures every canonical layer-specific ui-kit var has all 8 root vars (2 themes × 4 layers).
 * Missing (theme, layer) combinations get a type-appropriate fallback from an existing value.
 */
function fillMissingLayerSpecificUIKitRootVars(rootVarsMap: Map<string, string>): void {
  const canonicalToExampleValue = new Map<string, string>()
  for (const [rootName, value] of rootVarsMap) {
    const canonical = rootLayerSpecificNameToCanonical(rootName)
    if (canonical == null) continue
    if (!canonicalToExampleValue.has(canonical)) canonicalToExampleValue.set(canonical, value)
  }

  const themes: Array<'light' | 'dark'> = ['light', 'dark']
  const layers = ['0', '1', '2', '3']
  for (const canonical of canonicalToExampleValue.keys()) {
    const exampleValue = canonicalToExampleValue.get(canonical) ?? 'transparent'
    const fallback = fallbackForMissingLayerVar(exampleValue)
    for (const theme of themes) {
      for (const layer of layers) {
        const name = pathToRootVarNameFromCanonical(canonical, theme, layer)
        if (!rootVarsMap.has(name)) rootVarsMap.set(name, fallback)
      }
    }
  }
}

/** Returns layer numbers (0–3) referenced in a CSS value string (e.g. var(--recursica_brand_layer_1_...)). */
function getReferencedBrandLayers(value: string): number[] {
  const matches = value.matchAll(/--recursica_brand_layer_(\d+)_/g)
  const layers = new Set<number>()
  for (const m of matches) {
    const n = parseInt(m[1], 10)
    if (Number.isInteger(n) && n >= 0) layers.add(n)
  }
  return [...layers]
}

/** True if the CSS value references any brand_layer_N variable. */
function valueReferencesBrandLayer(value: string): boolean {
  return /--recursica_brand_layer_\d+_/.test(value)
}

/** True if the CSS value references brand_layer_1, _2, or _3 (not layer-0). */
function valueReferencesHigherBrandLayer(value: string): boolean {
  return /var\(--recursica_brand_layer_[123]_/.test(value)
}

/**
 * Returns a type-appropriate CSS fallback when the token $value is null.
 * Used for layer-specific ui-kit vars so we emit a valid value per type.
 */
function fallbackForNullByType(type: string | undefined): string {
  if (!type) return 'transparent'
  const t = type.toLowerCase()
  if (t === 'color') return 'transparent'
  if (t === 'dimension' || t === 'length') return '0'
  if (t === 'number') return '0'
  if (t === 'elevation') return 'none'
  if (t === 'string') return '""'
  if (t === 'fontFamily' || t === 'font-family') return '""'
  return 'transparent'
}

/**
 * Returns a type-appropriate fallback for a missing layer-specific ui-kit var,
 * inferred from an example value (from a layer that defines it).
 */
function fallbackForMissingLayerVar(exampleValue: string): string {
  const v = exampleValue.trim()
  if (/^#[0-9a-fA-F]{3,8}$/.test(v) || v === 'transparent' || /^rgba?\(/.test(v) || /^hsla?\(/.test(v)) return 'transparent'
  if (v.startsWith('var(')) return 'transparent'
  if (/^-?\d+(\.\d+)?(px|rem|em|%|ex|ch)$/.test(v)) return '0'
  if (/^-?\d+(\.\d+)?$/.test(v)) return '0'
  if (v === 'none' || v === 'normal') return v
  if (/^"[^"]*"$/.test(v)) return '""'
  return 'transparent'
}

/**
 * Transforms tokens, brand, and uikit JSON into scoped CSS variables.
 * Architecture: root has all specific (full-path) names; theme/layer blocks have only generic aliases.
 * See docs/SCOPED_CSS_ARCHITECTURE.md.
 */
export function recursicaJsonTransform(json: RecursicaJsonInput): ExportFile[] {
  const entries = flattenInput(json)
  const errors: TransformError[] = []

  // 1. Build set of all root var names (so refs validate and we know what exists on root)
  const allRootNames = new Set<string>()
  for (const entry of entries) {
    const { path } = entry
    if (isLayerSpecificUIKitPath(path)) {
      allRootNames.add(pathToRootVarNameLayerSpecificUIKit(path, 'light'))
      allRootNames.add(pathToRootVarNameLayerSpecificUIKit(path, 'dark'))
    } else {
      allRootNames.add(pathToVarName(path))
    }
  }

  // 2. Build root vars: every entry with specific name, values use pathToVarName for refs
  const rootVarsMap = new Map<string, string>()
  const rootOptions = { refNamer: pathToVarName }

  for (const entry of entries) {
    const { path, value, type: tokenType } = entry
    if (isLayerSpecificUIKitPath(path)) {
      const layer = getLayerFromUIKitPath(path)
      if (layer == null) continue
      for (const theme of ['light', 'dark'] as const) {
        let formatted = formatValue(value, path, allRootNames, errors, {
          ...rootOptions,
          themeForExpand: theme
        })
        if (formatted == null) formatted = fallbackForNullByType(tokenType)
        if (formatted == null) continue
        const rootName = pathToRootVarNameLayerSpecificUIKit(path, theme)
        rootVarsMap.set(rootName, formatted)
      }
      continue
    }

    let formatted = formatValue(value, path, allRootNames, errors, rootOptions)
    if (formatted == null) continue
    const rootName = pathToVarName(path)
    rootVarsMap.set(rootName, formatted)
  }

  // Validate layer coverage in JSON (each canonical must be defined in all 4 layers)
  validateLayerSpecificUIKitRootComplete(entries, errors)

  if (errors.length > 0) {
    const msg = `Transform validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):\n` + errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')
    throw new Error(msg)
  }

  fillMissingLayerSpecificUIKitRootVars(rootVarsMap)

  // 3. Build theme and theme+layer alias lists: genericName -> rootName (only aliases in blocks)
  const themeAliases = new Map<string, Array<{ genericName: string; rootName: string }>>()
  const themeLayerAliases = new Map<string, Array<{ genericName: string; rootName: string }>>()

  for (const entry of entries) {
    const { path, value, type: tokenType } = entry
    if (isLayerSpecificUIKitPath(path)) {
      const layer = getLayerFromUIKitPath(path)
      if (layer == null) continue
      const canonicalName = pathToVarName(getCanonicalUIKitPath(path))
      for (const theme of ['light', 'dark'] as const) {
        const rootName = pathToRootVarNameLayerSpecificUIKit(path, theme)
        const key = `${theme}+layer-${layer}`
        if (!themeLayerAliases.has(key)) themeLayerAliases.set(key, [])
        themeLayerAliases.get(key)!.push({ genericName: canonicalName, rootName })
      }
      continue
    }

    const scope = getScope(path)
    const scopeKey = getScopeKey(scope)
    const rootName = pathToVarName(path)
    const genericName = pathToScopedVarName(path, scope)

    if (scopeKey === 'root') continue
    if (scope !== 'root' && 'layer' in scope) {
      if (!themeLayerAliases.has(scopeKey)) themeLayerAliases.set(scopeKey, [])
      themeLayerAliases.get(scopeKey)!.push({ genericName, rootName })
    } else {
      if (!themeAliases.has(scopeKey)) themeAliases.set(scopeKey, [])
      themeAliases.get(scopeKey)!.push({ genericName, rootName })
    }
  }

  // Theme block: merge theme-only + layer-0 aliases (so "theme without layer" gets layer-0)
  for (const theme of ['light', 'dark'] as const) {
    const themeOnly = themeAliases.get(theme) ?? []
    const layer0 = themeLayerAliases.get(`${theme}+layer-0`) ?? []
    const merged = [...themeOnly, ...layer0]
    themeAliases.set(theme, merged)
  }

  const css = formatScopedCss(rootVarsMap, themeAliases, themeLayerAliases)
  return [{ filename: FILENAME, contents: css }]
}

const BRAND_TYPOGRAPHY_VAR_PREFIX = PREFIX + 'brand_typography_'

/**
 * Collects typography types from root vars: each key like --recursica_brand_typography_<typeName>_<property>
 * is grouped by typeName. Returns a map of type name to list of { cssProp, varName } for building helper classes.
 */
function collectTypographyHelpers(
  rootVarsMap: Map<string, string>
): Map<string, Array<{ cssProp: string; varName: string }>> {
  const byType = new Map<string, Array<{ cssProp: string; varName: string }>>()
  for (const varName of rootVarsMap.keys()) {
    if (!varName.startsWith(BRAND_TYPOGRAPHY_VAR_PREFIX)) continue
    const rest = varName.slice(BRAND_TYPOGRAPHY_VAR_PREFIX.length)
    const segments = rest.split('_')
    if (segments.length < 2) continue
    const property = segments[segments.length - 1]
    const cssProp = TYPOGRAPHY_JSON_TO_CSS_PROP[property]
    if (!cssProp) continue
    const typeName = segments.slice(0, -1).join('_')
    if (!byType.has(typeName)) byType.set(typeName, [])
    byType.get(typeName)!.push({ cssProp, varName })
  }
  return byType
}

/**
 * Builds the final CSS string: :root (all specific vars), then theme and theme+layer blocks (aliases only),
 * then typography helper classes. See docs/SCOPED_CSS_ARCHITECTURE.md.
 */
function formatScopedCss(
  rootVarsMap: Map<string, string>,
  themeAliases: Map<string, Array<{ genericName: string; rootName: string }>>,
  themeLayerAliases: Map<string, Array<{ genericName: string; rootName: string }>>
): string {
  const buildDate = new Date().toUTCString()

  let css = `/*\n`
  css += ` * Recursica CSS Variables - Scoped\n`
  css += ` * Transform version: ${TRANSFORM_VERSION}\n`
  css += ` * Generated: ${buildDate}\n`
  css += ` *\n`
  css += ` * --- How to integrate this file ---\n`
  css += ` *\n`
  css += ` * 1. Set theme on the document root\n`
  css += ` *    Set data-recursica-theme="light" or data-recursica-theme="dark" on <html> (e.g. in a theme\n`
  css += ` *    provider). When only theme is set, layer 0 applies by default.\n`
  css += ` *\n`
  css += ` * 2. Set layer on an ancestor when needed\n`
  css += ` *    To use layers 1, 2, or 3, set data-recursica-layer="N" (N = 0, 1, 2, or 3) on a wrapper\n`
  css += ` *    element that contains the components that should use that layer. Descendants inherit that\n`
  css += ` *    layer's variables. A nested element with a different data-recursica-layer applies its layer\n`
  css += ` *    to its own descendants.\n`
  css += ` *\n`
  css += ` * 3. In your component CSS, use only generic variable names\n`
  css += ` *    Generic names have no theme or layer in the name. They are the only names your components\n`
  css += ` *    should reference.\n`
  css += ` *\n`
  css += ` *    Use (generic; correct):\n`
  css += ` *      var(--recursica_ui-kit_components_button_variants_styles_solid_properties_colors_background)\n`
  css += ` *      var(--recursica_brand_layer_0_properties_surface)\n`
  css += ` *\n`
  css += ` *    Do not use (specific; wrong in component CSS):\n`
  css += ` *      var(--recursica_ui-kit_themes_light_layer_0_...)\n`
  css += ` *      var(--recursica_brand_themes_light_layers_layer-0_...)\n`
  css += ` *\n`
  css += ` *    The correct value for the generic name is set by the theme and layer of the element's\n`
  css += ` *    ancestors. Your component does not need to know theme or layer; it just uses the generic\n`
  css += ` *    name and inherits the right value.\n`
  css += ` *\n`
  css += ` * 4. Do not reference data-recursica-layer or data-recursica-theme in component selectors\n`
  css += ` *    Your component styles should not match on these attributes. Theme on root and layer on an\n`
  css += ` *    ancestor are enough; the cascade applies the right generic vars to your component.\n`
  css += ` *\n`
  css += ` * 5. Prefer ui-kit variables over brand layer variables in components\n`
  css += ` *    Use --recursica_ui-kit_* for component styling when a suitable token exists. Use\n`
  css += ` *    --recursica_brand_layer_N_* only when you need layer surface/border/elevation directly\n`
  css += ` *    (e.g. for a Layer container).\n`
  css += ` *\n`
  css += ` * 6. Optional: use typography helper classes for type styles\n`
  css += ` *    Classes like .recursica_brand_typography_h1 and .recursica_brand_typography_body apply the\n`
  css += ` *    full type definition (family, size, weight, line-height, etc.) from brand.typography.\n`
  css += ` *    Class names follow the path: brand.typography.<typeName>.\n`
  css += ` *\n`
  css += ` * --- Disabled state (implicit rule) ---\n`
  css += ` * The brand theme exposes a single disabled token: --recursica_brand_states_disabled (generic\n`
  css += ` * name; resolves per theme to an opacity value, e.g. from opacities_ghost). Use this for disabled\n`
  css += ` * styling when a component has no explicit disabled state variables: apply\n`
  css += ` * opacity: var(--recursica_brand_states_disabled) to the disabled component (e.g. :disabled or\n`
  css += ` * [aria-disabled="true"]). If a component has its own disabled state variables (e.g. ui-kit form\n`
  css += ` * components with disabled background, border, or text colors), use those tokens for the disabled\n`
  css += ` * look and do not apply the global opacity, since the design already defines the disabled state.\n`
  css += ` *\n`
  css += ` * --- How this file is structured ---\n`
  css += ` * :root defines every variable with a specific (full-path) name so every reference resolves.\n`
  css += ` * Theme and theme+layer blocks ([data-recursica-theme="light"], [data-recursica-theme="light"][data-recursica-layer="1"], etc.)\n`
  css += ` * define only generic names that alias to those root variables. Components use the generic names;\n`
  css += ` * the block that matches the element (via theme and layer on ancestors) determines which root\n`
  css += ` * value that generic name resolves to.\n`
  css += ` * At the end, typography helper classes (e.g. .recursica_brand_typography_h1, .recursica_brand_typography_body)\n`
  css += ` * are provided for each type in brand.typography. Apply one class to get the full type style.\n`
  css += ` * Class names follow the path: brand.typography.<typeName> → .recursica_brand_typography_<typeName>.\n`
  css += ` *\n`
  css += ` * --- WARNING ---\n`
  css += ` * This file is auto-generated. Do not modify it or override its variables in your app.\n`
  css += ` * Make changes in the Recursica JSON source and re-export.\n`
  css += ` */\n\n`

  const rootVars = [...rootVarsMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  css += `:root {\n`
  for (const [name, value] of rootVars) {
    css += `  ${name}: ${value};\n`
  }
  css += `}\n\n`

  for (const theme of ['light', 'dark'] as const) {
    const aliases = themeAliases.get(theme) ?? []
    if (aliases.length === 0) continue
    const sorted = [...aliases].sort((a, b) => a.genericName.localeCompare(b.genericName))
    css += `[data-recursica-theme="${theme}"] {\n`
    for (const { genericName, rootName } of sorted) {
      css += `  ${genericName}: var(${rootName});\n`
    }
    css += `}\n\n`
  }

  const themeLayerKeys = [...themeLayerAliases.keys()]
    .filter((k) => k.includes('+layer-'))
    .sort((a, b) => {
      const [, layerA] = a.split('+layer-')
      const [, layerB] = b.split('+layer-')
      const nA = parseInt(layerA ?? '', 10)
      const nB = parseInt(layerB ?? '', 10)
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB
      return (layerA ?? '').localeCompare(layerB ?? '')
    })

  for (const key of themeLayerKeys) {
    const [theme, layerPart] = key.split('+layer-')
    const layer = layerPart ?? '0'
    const aliases = themeLayerAliases.get(key) ?? []
    if (aliases.length === 0) continue
    const sorted = [...aliases].sort((a, b) => a.genericName.localeCompare(b.genericName))
    css += `[data-recursica-theme="${theme}"][data-recursica-layer="${layer}"],\n[data-recursica-theme="${theme}"] [data-recursica-layer="${layer}"] {\n`
    for (const { genericName, rootName } of sorted) {
      css += `  ${genericName}: var(${rootName});\n`
    }
    css += `}\n\n`
  }

  /* Typography helper classes (utils): one class per brand.typography type, following path naming. */
  const typographyHelpers = collectTypographyHelpers(rootVarsMap)
  if (typographyHelpers.size > 0) {
    const classPrefix = 'recursica_brand_typography_'
    css += `/* --- Typography helper classes ---\n`
    css += ` * One class per type in brand.typography. Apply the class to get the full type style\n`
    css += ` * (family, size, weight, line-height, etc.) from your design tokens. Class names follow\n`
    css += ` * the path: brand.typography.<typeName> → .recursica_brand_typography_<typeName>\n */\n\n`
    const sortedTypes = [...typographyHelpers.keys()].sort((a, b) => a.localeCompare(b))
    for (const typeName of sortedTypes) {
      const props = typographyHelpers.get(typeName)!
      const className = '.' + classPrefix + typeName
      css += `/* Typography style "${typeName}" (brand.typography.${typeName}): applies full type definition.\n`
      css += ` * Generated so you can use one class instead of referencing each variable separately. */\n`
      css += `${className} {\n`
      for (const { cssProp, varName } of props.sort((a, b) => a.cssProp.localeCompare(b.cssProp))) {
        css += `  ${cssProp}: var(${varName});\n`
      }
      css += `}\n\n`
    }
  }

  return css
}
