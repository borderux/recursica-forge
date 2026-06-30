/**
 * Runtime JSON Schema Validation Utility
 *
 * Validates recursica_brand.json, recursica_tokens.json, and recursica_ui-kit.json against their schemas
 * and throws errors on critical validation failures.
 *
 * DTCG compliance is enforced via validateDtcgStructure which checks:
 *  - No unrecognised $-prefixed keys (e.g. $metadata must be in $extensions.recursica.metadata)
 *  - No non-standard $type values (custom types use $extensions.recursica.type + a DTCG base type or no $type)
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import brandSchema from '../../../schemas/brand.schema.json'
import tokensSchema from '../../../schemas/tokens.schema.json'
import uikitSchema from '../../../schemas/uikit.schema.json'
import type { JsonLike } from '../resolvers/tokens'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

// DTCG v2025.10 defined token types
const DTCG_STANDARD_TYPES = new Set([
  'color', 'dimension', 'fontFamily', 'fontWeight', 'fontStyle',
  'number', 'duration', 'cubicBezier', 'boolean', 'string',
  'strokeStyle', 'border', 'transition', 'shadow', 'gradient', 'typography',
])

// DTCG reserved $-prefixed property names
const DTCG_RESERVED_KEYS = new Set([
  '$value', '$type', '$description', '$extensions', '$deprecated', '$extends',
])

/**
 * Shared DTCG structural validator for brand, tokens, and ui-kit JSON.
 * Enforces:
 *   1. No unknown $-prefixed keys (only DTCG reserved keys are allowed)
 *   2. No non-standard $type values — custom types must use $extensions.recursica.type
 *
 * Throws with a summary of all violations found.
 */
export function validateDtcgStructure(json: JsonLike, filename: string): void {
  const unknownKeys: string[] = []
  const nonStandardTypes: string[] = []
  const invalidDimensionValues: string[] = []

  function check(obj: unknown, path: string): void {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return
    const record = obj as Record<string, unknown>

    for (const key of Object.keys(record)) {
      if (key.startsWith('$') && !DTCG_RESERVED_KEYS.has(key)) {
        unknownKeys.push(`${path || '(root)'} → "${key}" (use $extensions.recursica.* instead)`)
      }
    }

    const hasValue = '$value' in record
    if (hasValue) {
      const t = record.$type
      if (typeof t === 'string' && !DTCG_STANDARD_TYPES.has(t)) {
        nonStandardTypes.push(`${path} → $type="${t}" (move to $extensions.recursica.type)`)
      }

      const extType = (record.$extensions as Record<string, unknown> | undefined)?.['recursica.type']
      const resolvedType = typeof t === 'string' ? t : (typeof extType === 'string' ? extType : undefined)

      if (resolvedType === 'dimension') {
        const val = record.$value
        const isNullOrUndefined = val === null || val === undefined
        const isRef = typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')
        const isValidObj = val !== null && typeof val === 'object' && !Array.isArray(val) && 'value' in val && 'unit' in val

        if (!isNullOrUndefined && !isRef && !isValidObj) {
          invalidDimensionValues.push(`${path} → type is "dimension" but value is not an object containing "value" and "unit" (got ${JSON.stringify(val)})`)
        }
      }

      // Do not recurse into token children — $value is the leaf
      return
    }

    for (const [key, value] of Object.entries(record)) {
      if (key.startsWith('$')) continue
      check(value, path ? `${path}.${key}` : key)
    }
  }

  check(json, '')

  const errors: string[] = [
    ...unknownKeys.map(e => `  [unknown-$-key] ${e}`),
    ...nonStandardTypes.map(e => `  [non-standard-$type] ${e}`),
    ...invalidDimensionValues.map(e => `  [invalid-dimension-token] ${e}`),
  ]

  if (errors.length > 0) {
    throw new Error(
      `${filename} DTCG compliance failed (${errors.length} violation(s)):\n${errors.join('\n')}`
    )
  }
}

/**
 * Filters validation errors to only critical ones
 */
function filterCriticalErrors(errors: any[] | null | undefined): any[] {
  if (!errors) return []

  return errors.filter(e => {
    // Ignore additionalProperties errors
    if (e.keyword === 'additionalProperties') return false
    // Ignore errors in typography/grid sections (they're flexible)
    if (e.instancePath?.includes('typography') || e.instancePath?.includes('grid')) return false
    // Ignore enum errors for $type (flexible)
    if (e.keyword === 'enum' && e.instancePath?.includes('$type')) return false
    // Ignore oneOf/required/false schema errors for palette default fields (known structural issue - default can be $value or color object)
    if ((e.keyword === 'oneOf' || e.keyword === 'required' || e.keyword === 'false schema') && e.instancePath?.includes('/default') && e.instancePath?.includes('/palettes/')) return false
    // Ignore oneOf errors for palette pattern properties (known structural flexibility)
    if (e.keyword === 'oneOf' && e.instancePath?.match(/\/palettes\/[^/]+\/\d{2,4}|000|050$/)) return false
    return true
  })
}

/**
 * Validates recursica_brand.json against its schema
 */
export function validateBrandJson(brandJson: JsonLike): void {
  const validate = ajv.compile(brandSchema)
  const valid = validate(brandJson)

  if (!valid && validate.errors) {
    const criticalErrors = filterCriticalErrors(validate.errors)

    if (criticalErrors.length > 0) {
      throw new Error(
        `recursica_brand.json validation failed with ${criticalErrors.length} critical error(s). ` +
        `First error: ${JSON.stringify(criticalErrors[0])}`
      )
    }
  }

  // DTCG structural compliance
  validateDtcgStructure(brandJson, 'recursica_brand.json')
}

/**
 * Validates recursica_tokens.json against its schema
 */
export function validateTokensJson(tokensJson: JsonLike): void {
  const validate = ajv.compile(tokensSchema)
  const valid = validate(tokensJson)

  if (!valid && validate.errors) {
    const criticalErrors = filterCriticalErrors(validate.errors)

    if (criticalErrors.length > 0) {
      throw new Error(
        `recursica_tokens.json validation failed with ${criticalErrors.length} critical error(s). ` +
        `First error: ${JSON.stringify(criticalErrors[0])}`
      )
    }
  }

  // DTCG structural compliance
  validateDtcgStructure(tokensJson, 'recursica_tokens.json')
}

/**
 * Recursively checks for theme references in token references
 * Returns an array of paths where theme references were found
 */
function findThemeReferences(
  obj: any,
  path: string[] = [],
  themeRefs: Array<{ path: string; value: string }> = []
): Array<{ path: string; value: string }> {
  if (obj === null || obj === undefined) {
    return themeRefs
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key]

      if (key === '$value' && typeof value === 'string') {
        // Check if the value contains a token reference with theme
        const themePattern = /\{brand\.themes\.(light|dark)\.[^}]+\}/g
        const matches = value.match(themePattern)

        if (matches) {
          themeRefs.push({
            path: currentPath.join('.'),
            value: value
          })
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          findThemeReferences(item, [...currentPath, String(index)], themeRefs)
        })
      } else if (typeof value === 'object') {
        findThemeReferences(value, currentPath, themeRefs)
      }
    }
  }

  return themeRefs
}

/**
 * The set of known variant dimension category keys used in recursica_ui-kit.json.
 * These keys may appear directly inside a `variants` container as dimension group names.
 * When one of these keys (or any key whose children all look like variant values) appears
 * directly on a variant *value* node, it signals a missing `variants` wrapper.
 */
const UIKIT_VARIANT_CATEGORY_KEYS = new Set([
  'styles', 'sizes', 'layouts', 'orientation', 'width', 'types', 'states', 'content',
])

/**
 * Returns true when a node looks like a variant category: a plain object (not a token)
 * whose every non-$ child itself has a `properties` or `variants` key.
 */
function looksLikeVariantCategory(node: unknown): boolean {
  if (node === null || typeof node !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(node, '$value')) return false
  const children = Object.entries(node as Record<string, unknown>).filter(([k]) => !k.startsWith('$'))
  if (children.length === 0) return false
  return children.every(([, v]) => {
    if (v === null || typeof v !== 'object') return false
    if (Object.prototype.hasOwnProperty.call(v, '$value')) return false
    return (
      Object.prototype.hasOwnProperty.call(v, 'properties') ||
      Object.prototype.hasOwnProperty.call(v, 'variants')
    )
  })
}

/**
 * Validates the structural nesting rule for component variants in recursica_ui-kit.json:
 *
 *   component
 *     └── variants                ← container for dimension groups
 *           └── [dimension-name]  ← e.g. "styles", "sizes", "content"
 *                 └── [value]     ← e.g. "solid", "default", "icon-label"
 *                       ├── properties  ← token values (optional)
 *                       └── variants    ← sub-dimensions (optional, REQUIRED when nesting)
 *
 * A variant value node MUST only have `variants` and/or `properties` as non-$ children.
 * Any other key that looks like a dimension category (its children all have `properties`/`variants`)
 * is a structural error — it should have been wrapped in a `variants` node.
 *
 * Throws if violations are found.
 */
export function validateUIKitVariantStructure(uikitJson: JsonLike): void {
  const components =
    (uikitJson as any)?.['ui-kit']?.components ??
    (uikitJson as any)?.components ??
    {}

  const errors: string[] = []

  function checkVariantValue(path: string, node: unknown): void {
    if (node === null || typeof node !== 'object') return
    if (Object.prototype.hasOwnProperty.call(node, '$value')) return

    const obj = node as Record<string, unknown>
    const nonDollarKeys = Object.keys(obj).filter(k => !k.startsWith('$'))
    const badKeys = nonDollarKeys.filter(k => k !== 'variants' && k !== 'properties')

    for (const bk of badKeys) {
      const bv = obj[bk]
      if (
        UIKIT_VARIANT_CATEGORY_KEYS.has(bk) && looksLikeVariantCategory(bv)
        || (!UIKIT_VARIANT_CATEGORY_KEYS.has(bk) && looksLikeVariantCategory(bv))
      ) {
        errors.push(
          `${path}: key "${bk}" looks like a variant dimension category but is not wrapped in a "variants" node. ` +
          `Expected structure: { variants: { ${bk}: { ... } } }`
        )
      }
    }

    // Recurse into nested variants
    if (obj.variants && typeof obj.variants === 'object' && !Object.prototype.hasOwnProperty.call(obj.variants, '$value')) {
      checkVariantsContainer(`${path}.variants`, obj.variants)
    }
  }

  function checkVariantsContainer(path: string, node: unknown): void {
    if (node === null || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    for (const [catKey, catVal] of Object.entries(obj)) {
      if (catKey.startsWith('$')) continue
      if (catVal === null || typeof catVal !== 'object') continue
      const catObj = catVal as Record<string, unknown>
      for (const [valKey, valVal] of Object.entries(catObj)) {
        if (valKey.startsWith('$')) continue
        checkVariantValue(`${path}.${catKey}.${valKey}`, valVal)
      }
    }
  }

  for (const [compName, compData] of Object.entries(components as Record<string, unknown>)) {
    if (compData === null || typeof compData !== 'object') continue
    const compObj = compData as Record<string, unknown>
    if (compObj.variants) {
      checkVariantsContainer(`components.${compName}.variants`, compObj.variants)
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `recursica_ui-kit.json variant structure validation failed (${errors.length} error(s)):\n` +
      errors.map(e => `  - ${e}`).join('\n')
    )
  }
}

/**
 * Validates `recursica.component` extension tokens in recursica_ui-kit.json.
 *
 * A `recursica.component` token is a DTCG token (has `$value`) whose `$value`
 * references a component group (e.g. `{ui-kit.components.button}`). The
 * component identity is inferred from the `$value` reference path.
 * `$extensions.recursica.component.selected-variants` values are reference
 * strings pointing to variant group nodes (e.g.
 * `{ui-kit.components.button.variants.styles.solid}`).
 *
 * Validates that every `selected-variants` key corresponds to a recognised
 * variant dimension on the target component.
 *
 * Throws if any violation is found.
 */
export function validateUIKitComponentExtensions(uikitJson: JsonLike): void {
  const uikit = (uikitJson as any)?.['ui-kit'] ?? uikitJson as any
  const components: Record<string, unknown> = uikit?.components ?? {}

  const errors: string[] = []

  /**
   * Extract the component name from a `$value` reference string.
   * e.g. "{ui-kit.components.button}" → "button"
   */
  function componentNameFromRef(ref: unknown): string | null {
    if (typeof ref !== 'string') return null
    const m = ref.match(/^\{ui-kit\.components\.([^.}]+)/)
    return m ? m[1] : null
  }

  /**
   * Validate `selected-variants` entries for a given target component.
   * Values are reference strings (e.g. `{ui-kit.components.button.variants.styles.solid}`).
   */
  function validateSelectedVariants(
    selectedVariants: unknown,
    targetCompName: string,
    contextPath: string,
  ): void {
    if (selectedVariants === undefined) return
    if (typeof selectedVariants !== 'object' || selectedVariants === null || Array.isArray(selectedVariants)) {
      errors.push(`${contextPath}.$extensions[recursica.component]: "selected-variants" must be a plain object`)
      return
    }
    const targetComp = components[targetCompName] as Record<string, unknown>
    const targetVariants = (targetComp?.['variants'] ?? {}) as Record<string, unknown>
    const validDimensions = new Set(Object.keys(targetVariants))

    for (const [dimKey, dimVal] of Object.entries(selectedVariants as Record<string, unknown>)) {
      if (typeof dimVal !== 'string') {
        errors.push(
          `${contextPath}.$extensions[recursica.component].selected-variants.${dimKey}: ` +
          `value must be a string (got ${JSON.stringify(dimVal)})`
        )
      }
      // Map singular toolbar key names ("style", "size") → plural JSON dimension keys ("styles", "sizes")
      const dimensionKeyPlural = dimKey.endsWith('s') ? dimKey : `${dimKey}s`
      if (validDimensions.size > 0 && !validDimensions.has(dimKey) && !validDimensions.has(dimensionKeyPlural)) {
        errors.push(
          `${contextPath}.$extensions[recursica.component].selected-variants: ` +
          `dimension "${dimKey}" is not a recognised variant category on component "${targetCompName}". ` +
          `Valid dimensions: ${[...validDimensions].join(', ')}`
        )
      }
    }
  }

  /**
   * Recursively find and validate recursica.component token nodes.
   * Per DTCG: a node with `$value` is a token (leaf). Recursion stops at tokens.
   */
  function traverse(obj: unknown, path: string): void {
    if (obj === null || typeof obj !== 'object') return
    const o = obj as Record<string, unknown>
    const isTokenNode = Object.prototype.hasOwnProperty.call(o, '$value')

    if (isTokenNode && '$extensions' in o) {
      const ext = o.$extensions as Record<string, unknown>
      if (ext && typeof ext === 'object' && 'recursica.component' in ext) {
        const compExt = ext['recursica.component'] as Record<string, unknown>
        const compName = componentNameFromRef(o.$value)
        if (!compName) {
          errors.push(
            `${path}.$extensions[recursica.component]: $value must be a reference to a ui-kit component ` +
            `(e.g. "{ui-kit.components.button}"), got ${JSON.stringify(o.$value)}`
          )
        } else if (!(compName in components)) {
          errors.push(`${path}.$extensions[recursica.component]: component "${compName}" does not exist in ui-kit.components`)
        } else {
          validateSelectedVariants(compExt['selected-variants'], compName, path)
        }
      }
    }

    // Do not recurse into token children — the $value is the leaf per DTCG.
    if (isTokenNode) return

    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('$')) continue
      traverse(v, `${path}.${k}`)
    }
  }

  for (const [compName, compData] of Object.entries(components)) {
    traverse(compData, `components.${compName}`)
  }

  if (errors.length > 0) {
    throw new Error(
      `recursica_ui-kit.json component extension validation failed (${errors.length} error(s)):\n` +
      errors.map(e => `  - ${e}`).join('\n')
    )
  }
}

/**
 * Validates recursica_ui-kit.json against its schema
 */
export function validateUIKitJson(uikitJson: JsonLike): void {
  const validate = ajv.compile(uikitSchema)
  const valid = validate(uikitJson)

  if (!valid && validate.errors) {
    const criticalErrors = filterCriticalErrors(validate.errors)

    if (criticalErrors.length > 0) {

      throw new Error(
        `recursica_ui-kit.json validation failed with ${criticalErrors.length} critical error(s). ` +
        `First error: ${JSON.stringify(criticalErrors[0])}`
      )
    }
  }

  // Check for theme references in token references
  const themeRefs = findThemeReferences(uikitJson)

  if (themeRefs.length > 0) {
    const errorMessages = themeRefs.map(ref =>
      `  - ${ref.path}: "${ref.value}"`
    ).join('\n')


    throw new Error(
      `recursica_ui-kit.json validation failed: Found ${themeRefs.length} theme reference(s). ` +
      `All token references must be theme-agnostic (use {brand.*} instead of {brand.themes.light.*} or {brand.themes.dark.*}).\n` +
      `Theme references found:\n${errorMessages}`
    )
  }

  // Enforce variant nesting structure
  validateUIKitVariantStructure(uikitJson)

  // Enforce recursica.component $extensions integrity
  validateUIKitComponentExtensions(uikitJson)

  // DTCG structural compliance
  validateDtcgStructure(uikitJson, 'recursica_ui-kit.json')
}

// --- DTCG reference validation ---

const REFERENCE_PATTERN = /^\{([^}]+)\}$/

function isReferenceString(value: unknown): value is string {
  return typeof value === 'string' && REFERENCE_PATTERN.test(value.trim())
}

/** DTCG: a token is an object with a $value property. */
function isToken(node: unknown): node is Record<string, unknown> & { $value: unknown } {
  return (
    node !== null &&
    typeof node === 'object' &&
    Object.prototype.hasOwnProperty.call(node, '$value')
  )
}

/** Get the path inside braces, e.g. "{brand.palettes.x}" -> "brand.palettes.x" */
function extractRefPath(ref: string): string {
  const m = ref.trim().match(REFERENCE_PATTERN)
  return m ? m[1].trim() : ''
}

/** Navigate an object by dot path. Path segments can contain hyphens (e.g. core-colors). */
function getAtPath(root: unknown, path: string): unknown {
  if (path === '') return root
  const parts = path.split('.')
  let current: unknown = root
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

/** Collect all reference strings and raw CSS variable leaks, along with their location (path in JSON), from an object.
 *  References inside `$extensions` blocks are tagged with `inExtensions: true` so the validator
 *  can apply Recursica-specific rules (e.g. allow group references) rather than strict DTCG token-only rules.
 */
function collectRefs(
  obj: unknown,
  jsonPath: string[] = [],
  out: Array<{ ref: string; location: string; isCssVar?: boolean; inExtensions?: boolean }> = [],
  inExtensions = false
): Array<{ ref: string; location: string; isCssVar?: boolean; inExtensions?: boolean }> {
  if (obj === null || obj === undefined) return out

  if (typeof obj === 'string') {
    if (isReferenceString(obj)) out.push({ ref: obj, location: jsonPath.join('.'), inExtensions })
    else if ((obj as string).includes('var(--')) out.push({ ref: obj, location: jsonPath.join('.'), isCssVar: true })
    return out
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectRefs(item, [...jsonPath, String(i)], out, inExtensions))
    return out
  }

  // DTCG reserved properties that hold token data and should be traversed.
  // Any other $-prefixed key (e.g. $overrides, $metadata) is non-token metadata and must be skipped
  // to avoid false "CSS variable leak" errors from raw var() strings stored in those fields.
  const DTCG_TOKEN_KEYS = new Set(['$value', '$type', '$description', '$extensions', '$deprecated', '$extends'])

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') && !DTCG_TOKEN_KEYS.has(key)) continue
      // Descend into $extensions with the flag set so refs there are validated with Recursica rules
      const nextInExtensions = inExtensions || key === '$extensions'
      collectRefs(value, [...jsonPath, key], out, nextInExtensions)
    }
  }
  return out
}

/**
 * Explicit list of reference work-arounds allowed during validation.
 * DTCG rule: references must be complete paths to a token (object with $value), not a group.
 * When strict resolution fails, these work-arounds are tried in order; if one resolves to a token, the ref is accepted.
 */
export const REF_WORKAROUND_IDS = [
  'typography-kebab→camelCase',
  'palette-default→indirection',
  'brand-theme-agnostic→themes.light|dark',
  'typography-composite-subproperty',
  'variant-group-reference',
  'recursica-component-token',
] as const

export type RefWorkaroundId = (typeof REF_WORKAROUND_IDS)[number]

export interface RefValidationResult {
  ref: string
  location: string
  valid: boolean
  workaroundUsed?: RefWorkaroundId
  message?: string
}

/**
 * Resolve a ref path against the combined tree. Returns the node and whether it's a token.
 * Tries strict path first, then allowed work-around alternate paths.
 */
function resolveRefToToken(
  path: string,
  combined: Record<string, unknown>,
  referrerLocation: string,
  allowedWorkarounds: ReadonlySet<RefWorkaroundId>
): { resolved: true; workaround?: RefWorkaroundId } | { resolved: false; message: string } {
  const strict = getAtPath(combined, path)
  if (isToken(strict)) return { resolved: true }

  const parts = path.split('.')
  const root = parts[0]

  if (root === 'brand' && allowedWorkarounds.has('typography-composite-subproperty')) {
    const typoSub = path.match(/^brand\.typography\.([^.]+)\.(.+)$/)
    if (typoSub) {
      const parentPath = `brand.typography.${typoSub[1]}`
      const parent = getAtPath(combined, parentPath)
      const prop = typoSub[2]
      if (parent && typeof parent === 'object' && '$value' in parent) {
        const val = (parent as Record<string, unknown>).$value
        if (val !== null && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, prop)) {
          return { resolved: true, workaround: 'typography-composite-subproperty' }
        }
      }
    }
  }

  if (root === 'brand' && allowedWorkarounds.has('brand-theme-agnostic→themes.light|dark')) {
    if (!path.includes('.themes.')) {
      const rest = path.replace(/^brand\./, '')
      const themeAgnosticPrefixes = ['layers.', 'palettes.', 'elevations.', 'states.', 'text-emphasis.']
      if (themeAgnosticPrefixes.some((p) => rest.startsWith(p))) {
        for (const theme of ['light', 'dark'] as const) {
          const alt = `brand.themes.${theme}.${rest}`
          if (isToken(getAtPath(combined, alt))) return { resolved: true, workaround: 'brand-theme-agnostic→themes.light|dark' }
          if (allowedWorkarounds.has('palette-default→indirection') && /^palettes\.([a-z][a-z0-9-]*)\.default\.color\.(tone|on-tone)$/.test(rest)) {
            const defaultTonePath = `brand.themes.${theme}.${rest.replace(/\.(tone|on-tone)$/, '.tone')}`
            const defaultToneToken = getAtPath(combined, defaultTonePath)
            if (isToken(defaultToneToken)) {
              const stepRef = (defaultToneToken as Record<string, unknown>).$value
              if (typeof stepRef === 'string') {
                const stepPath = extractRefPath(stepRef.startsWith('{') ? stepRef : `{${stepRef}}`)
                const wantOnTone = rest.endsWith('on-tone')
                const stepLeaf = stepPath.replace(/\.color\.tone$/, wantOnTone ? '.color.on-tone' : '.color.tone')
                if (stepPath !== stepLeaf || !wantOnTone) {
                  if (isToken(getAtPath(combined, stepLeaf))) return { resolved: true, workaround: 'brand-theme-agnostic→themes.light|dark' }
                }
              }
            }
          }
        }
      }
    }
  }

  if (root === 'brand' && allowedWorkarounds.has('typography-kebab→camelCase')) {
    const typoMatch = path.match(/^brand\.typography\.([^.]+)\.(font-family|font-size|font-weight|letter-spacing|line-height|font-style|text-transform|text-case|text-decoration)$/)
    if (typoMatch) {
      const kebabToCamel: Record<string, string> = {
        'font-family': 'fontFamily',
        'font-size': 'fontSize',
        'font-weight': 'fontWeight',
        'letter-spacing': 'letterSpacing',
        'line-height': 'lineHeight',
        'font-style': 'fontStyle',
        'text-transform': 'textCase',
        'text-case': 'textCase',
        'text-decoration': 'textDecoration',
      }
      const camel = kebabToCamel[typoMatch[2]] ?? typoMatch[2].replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
      const alt = `brand.typography.${typoMatch[1]}.${camel}`
      if (isToken(getAtPath(combined, alt))) return { resolved: true, workaround: 'typography-kebab→camelCase' }
    }
  }

  if (root === 'brand' && allowedWorkarounds.has('palette-default→indirection')) {
    const defaultMatch = path.match(/^brand\.themes\.(light|dark)\.palettes\.([a-z][a-z0-9-]*)\.default\.(.*)$/)
    if (defaultMatch) {
      const [, theme, palette, rest] = defaultMatch
      const defaultNode = getAtPath(combined, `brand.themes.${theme}.palettes.${palette}.default`)
      if (defaultNode && typeof defaultNode === 'object') {
        const defaultVal = (defaultNode as Record<string, unknown>).$value
        const refToStep = typeof defaultVal === 'string' && isReferenceString(defaultVal) ? extractRefPath(defaultVal) : null
        if (refToStep) {
          const stepPath = refToStep.startsWith('brand.') ? refToStep : `brand.themes.${theme}.${refToStep.replace(/^brand\./, '')}`
          const fullPath = rest ? `${stepPath}.${rest}` : stepPath
          const withLeaf = fullPath.includes('.color.') ? fullPath : `${fullPath}.color.tone`
          if (isToken(getAtPath(combined, withLeaf))) return { resolved: true, workaround: 'palette-default→indirection' }
        }
      }
    }
  }

  // $type: "variant" references intentionally point to variant groups (not leaf tokens).
  // e.g. {ui-kit.components.button.variants.styles.solid} points to a variant definition group.
  // Accept the reference if the target exists as a group in the combined tree.
  if (allowedWorkarounds.has('variant-group-reference')) {
    if (path.startsWith('ui-kit.components.') && path.includes('.variants.')) {
      if (strict !== undefined && typeof strict === 'object' && !isToken(strict)) {
        return { resolved: true, workaround: 'variant-group-reference' }
      }
    }
  }

  // recursica.component tokens use $value to reference the component group itself
  // (e.g. {ui-kit.components.button}). Accept any existing ui-kit component group.
  if (allowedWorkarounds.has('recursica-component-token')) {
    if (path.startsWith('ui-kit.components.') && !path.includes('.variants.') && !path.includes('.properties.')) {
      if (strict !== undefined && typeof strict === 'object' && !isToken(strict)) {
        return { resolved: true, workaround: 'recursica-component-token' }
      }
    }
  }

  if (strict !== undefined) {
    return { resolved: false, message: `Reference targets a group (path has no $value token at "${path}"). DTCG: refs must point to a token.` }
  }
  return { resolved: false, message: `Reference target does not exist: "${path}".` }
}

const DEFAULT_ALLOWED_REF_WORKAROUNDS: ReadonlySet<RefWorkaroundId> = new Set(REF_WORKAROUND_IDS)

/**
 * Validates all references in the three JSON files per DTCG: each ref must resolve to a token (object with $value), not a group.
 * When strict resolution fails, allowed work-arounds are tried. Invalid refs cause a throw.
 *
 * @param allowedWorkarounds - Set of work-around IDs to allow. Default: all REF_WORKAROUND_IDS.
 */
export function validateReferences(
  brandJson: JsonLike,
  tokensJson: JsonLike,
  uikitJson: JsonLike,
  allowedWorkarounds: ReadonlySet<RefWorkaroundId> = DEFAULT_ALLOWED_REF_WORKAROUNDS
): RefValidationResult[] {
  const combined: Record<string, unknown> = {
    brand: (brandJson as Record<string, unknown>)?.brand ?? brandJson,
    tokens: (tokensJson as Record<string, unknown>)?.tokens ?? tokensJson,
    'ui-kit': (uikitJson as Record<string, unknown>)?.['ui-kit'] ?? uikitJson,
  }

  const refs = [
    ...collectRefs(brandJson, []),
    ...collectRefs(tokensJson, []),
    ...collectRefs(uikitJson, []),
  ]

  const results: RefValidationResult[] = []
  const errors: string[] = []

  for (const { ref, location, isCssVar, inExtensions } of refs) {
    if (isCssVar) {
      results.push({ ref, location, valid: false, message: 'Invalid exported value: Found CSS variable leaky state.' })
      errors.push(`  ${location}: ${ref} (CSS variable leak detected)`)
      continue
    }

    const path = extractRefPath(ref)
    if (!path) {
      results.push({ ref, location, valid: false, message: 'Empty or invalid reference path' })
      errors.push(`  ${location}: ${ref} (empty path)`)
      continue
    }

    // References inside $extensions are validated with Recursica rules:
    // the path must exist in the combined tree (token or group), but need not resolve to a leaf token.
    if (inExtensions) {
      const node = getAtPath(combined, path)
      if (node !== undefined) {
        results.push({ ref, location, valid: true, workaroundUsed: 'recursica-component-token' })
      } else {
        results.push({ ref, location, valid: false, message: `Reference target does not exist: "${path}".` })
        errors.push(`  ${location}: ${ref} → Reference target does not exist: "${path}".`)
      }
      continue
    }

    const result = resolveRefToToken(path, combined, location, allowedWorkarounds)
    if (result.resolved) {
      results.push({
        ref,
        location,
        valid: true,
        workaroundUsed: result.workaround,
      })
    } else {
      results.push({ ref, location, valid: false, message: result.message })
      errors.push(`  ${location}: ${ref} → ${result.message}`)
    }
  }

  if (errors.length > 0) {
    const summary = `Validation failed (${errors.length} invalid item(s)). DTCG: references must be complete paths to a token ($value), and raw CSS variables are forbidden.\n${errors.join('\n')}`

    throw new Error(summary)
  }

  return results
}

/**
 * Validates all JSON files (Brand, Tokens, UIKit)
 */
export function validateAllJsonSchemas(
  brandJson: JsonLike,
  tokensJson: JsonLike,
  uikitJson: JsonLike
): void {
  validateBrandJson(brandJson)
  validateTokensJson(tokensJson)
  validateUIKitJson(uikitJson)
  validateReferences(brandJson, tokensJson, uikitJson)
}

