/**
 * Recursica JSON Transform - Scoped CSS
 *
 * Self-contained transform: takes tokens, brand, uikit JSON and produces
 * recursica_variables_scoped.css. No imports from the project.
 * Portable to other projects or standalone npm package.
 *
 * See docs/EXPORT_PIPELINE_REFACTOR_PLAN.md for design principles and approach.
 *
 * Approach:
 * - Same traversal, path→var naming, refs as var(), validation as Specific
 * - Vars grouped by theme/layer: :root, [data-recursica-theme], [data-recursica-layer],
 *   [data-recursica-theme][data-recursica-layer]
 * - Var names omit theme/layer in scoped blocks; selector provides context
 */

const FILENAME = 'recursica_variables_scoped.css'
const PREFIX = '--recursica_'
const TRANSFORM_VERSION = '1.1.0'

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

/**
 * Formats a value for CSS output. Validates refs and values; pushes errors to the errors array.
 */
function formatValue(val: unknown, currentPath: string, allVarNames: Set<string>, errors: TransformError[]): string | null {
  if (val == null) return null

  if (isRef(val)) {
    const refPath = extractRefPath(val)
    const expanded = expandRefPath(refPath, currentPath)
    const candidates = resolvePathAlias(expanded)
    const resolved: string | null = candidates.find((p) => allVarNames.has(pathToVarName(p))) ?? null
    if (!resolved) {
      const varName = pathToVarName(expanded)
      errors.push({
        path: currentPath,
        message: `Reference '${val}' targets non-existent var ${varName}`
      })
      return `var(${pathToScopedVarName(expanded, getScope(expanded))})`
    }
    return `var(${pathToScopedVarName(resolved, getScope(resolved))})`
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
      const resolved: string | null = candidates.find((p) => allVarNames.has(pathToVarName(p))) ?? null
      if (!resolved) {
        const varName = pathToVarName(expanded)
        errors.push({
          path: currentPath,
          message: `Reference '${obj.value}' targets non-existent var ${varName}`
        })
      }
      const target = resolved || expanded
      return `var(${pathToScopedVarName(target, getScope(target))})`
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
 * Handles $value wrappers, nested objects, leaf primitives, and dimension objects.
 */
function collectVars(obj: unknown, pathPrefix: string, out: Array<{ path: string; value: unknown }>): void {
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
 * Flattens the input JSON into path/value entries.
 * Handles nested structure, elevation composites, and dark layer-0 interactive aliases.
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
      const scope = getScope(basePath)
      const x = pathToScopedVarName(`${basePath}.x`, scope)
      const y = pathToScopedVarName(`${basePath}.y`, scope)
      const blur = pathToScopedVarName(`${basePath}.blur`, scope)
      const spread = pathToScopedVarName(`${basePath}.spread`, scope)
      const color = pathToScopedVarName(`${basePath}.color`, scope)
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

/**
 * Transforms tokens, brand, and uikit JSON into scoped CSS variables.
 * Vars grouped by :root, [data-recursica-theme], [data-recursica-theme][data-recursica-layer].
 * Throws if validation fails.
 */
export function recursicaJsonTransform(json: RecursicaJsonInput): ExportFile[] {
  const entries = flattenInput(json)
  const allVarNames = new Set(entries.map((e) => pathToVarName(e.path)))
  const errors: TransformError[] = []
  const byScope = new Map<string, Array<{ name: string; value: string }>>()

  for (const { path, value } of entries) {
    const formatted = formatValue(value, path, allVarNames, errors)
    if (formatted == null) continue

    if (isLayerSpecificUIKitPath(path)) {
      const layer = getLayerFromUIKitPath(path)
      if (layer == null) continue
      const canonicalPath = getCanonicalUIKitPath(path)
      const canonicalName = pathToVarName(canonicalPath)
      for (const theme of ['light', 'dark'] as const) {
        const scopeKey = `${theme}+layer-${layer}`
        if (!byScope.has(scopeKey)) byScope.set(scopeKey, [])
        byScope.get(scopeKey)!.push({ name: canonicalName, value: formatted })
      }
      continue
    }

    const scope = getScope(path)
    const scopeKey = getScopeKey(scope)
    const name = pathToScopedVarName(path, scope)

    if (!byScope.has(scopeKey)) byScope.set(scopeKey, [])
    byScope.get(scopeKey)!.push({ name, value: formatted })
  }

  if (errors.length > 0) {
    const msg = `Transform validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):\n` + errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')
    throw new Error(msg)
  }

  const css = formatScopedCss(byScope)
  return [{ filename: FILENAME, contents: css }]
}

/**
 * Builds the final CSS string with header, :root block, theme blocks, and theme+layer blocks.
 */
function formatScopedCss(byScope: Map<string, Array<{ name: string; value: string }>>): string {
  const buildDate = new Date().toUTCString()
  const rootVars = byScope.get('root') ?? []
  const totalVars = [...byScope.values()].reduce((sum, arr) => sum + arr.length, 0)

  let css = `/*\n`
  css += ` * Recursica CSS Variables - Scoped\n`
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
  css += ` * How to apply:\n`
  css += ` * - Set data-recursica-theme="light" or "dark" on root <html> element\n`
  css += ` * - When only theme is set, layer-0 applies by default (no data-recursica-layer needed)\n`
  css += ` * - Set data-recursica-layer="N" on any element to apply that layer to it and its descendants\n`
  css += ` * - Layer can be on the same element as theme, or on a nested descendant (e.g. theme on root, layer on a deep div)\n`
  css += ` * - Nested layers override: a div with layer=2 inside a div with layer=1 applies layer 2 to its descendants\n`
  css += ` *\n`
  css += ` * Usage in your components:\n`
  css += ` * - Reference ui-kit variables (--recursica_ui-kit_*) in your component styles\n`
  css += ` * - Avoid referencing brand layer variables (--recursica_brand_layer_*) directly; ui-kit abstracts these\n`
  css += ` * - ui-kit variables never reference tokens directly; they go through brand for theming\n`
  css += ` *\n`
  css += ` * Integration (layer-specific ui-kit):\n`
  css += ` * - Layer-specific ui-kit vars use one canonical name per semantic (e.g. --recursica_ui-kit_colors_background).\n`
  css += ` * - They are defined only in theme+layer blocks (e.g. [data-recursica-theme="light"][data-recursica-layer="1"]).\n`
  css += ` * - In component styles, use the canonical path only—no layer in the var name; the selector provides layer context.\n`
  css += ` *\n`
  css += ` * WARNING: This CSS is auto-generated from Recursica JSON files (tokens, brand, ui-kit).\n`
  css += ` * NEVER modify this file directly or override its variables in your app. Doing so breaks\n`
  css += ` * Recursica's ability to manage variables and styles. Make changes in the JSON source and re-export.\n`
  css += ` */\n\n`

  const sortVars = (vars: Array<{ name: string; value: string }>) =>
    [...vars].sort((a, b) => a.name.localeCompare(b.name))

  css += `:root {\n`
  for (const { name, value } of sortVars(rootVars)) {
    css += `  ${name}: ${value};\n`
  }
  css += `}\n\n`

  for (const theme of ['light', 'dark'] as const) {
    const themeVars = byScope.get(theme) ?? []
    const layer0Vars = byScope.get(`${theme}+layer-0`) ?? []
    const merged = [...themeVars, ...layer0Vars]
    if (merged.length === 0) continue
    css += `[data-recursica-theme="${theme}"] {\n`
    for (const { name, value } of sortVars(merged)) {
      css += `  ${name}: ${value};\n`
    }
    css += `}\n\n`
  }

  const themeLayerKeys = Array.from(byScope.keys())
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
    const vars = byScope.get(key) ?? []
    if (vars.length === 0) continue
    css += `[data-recursica-theme="${theme}"][data-recursica-layer="${layer}"],\n[data-recursica-theme="${theme}"] [data-recursica-layer="${layer}"] {\n`
    for (const { name, value } of sortVars(vars)) {
      css += `  ${name}: ${value};\n`
    }
    css += `}\n\n`
  }

  return css
}
