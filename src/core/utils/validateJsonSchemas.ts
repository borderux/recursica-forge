/**
 * Runtime JSON Schema Validation Utility
 * 
 * Validates recursica_brand.json, recursica_tokens.json, and recursica_ui-kit.json against their schemas
 * and throws errors on critical validation failures.
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import brandSchema from '../../../schemas/brand.schema.json'
import tokensSchema from '../../../schemas/tokens.schema.json'
import uikitSchema from '../../../schemas/uikit.schema.json'
import type { JsonLike } from '../resolvers/tokens'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

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

/** Collect all reference strings and their location (path in JSON) from an object. */
function collectRefs(
  obj: unknown,
  jsonPath: string[] = [],
  out: Array<{ ref: string; location: string }> = []
): Array<{ ref: string; location: string }> {
  if (obj === null || obj === undefined) return out

  if (typeof obj === 'string') {
    if (isReferenceString(obj)) out.push({ ref: obj, location: jsonPath.join('.') })
    return out
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectRefs(item, [...jsonPath, String(i)], out))
    return out
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      collectRefs(value, [...jsonPath, key], out)
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
  'tokens.size→sizes',
  'tokens.opacity→opacities',
  'palette-step-group→.color.tone|.color.on-tone',
  'elements.interactive.color→.tone|.on-tone',
  'typography-kebab→camelCase',
  'palette-default→indirection',
  'brand-theme-agnostic→themes.light|dark',
  'typography-composite-subproperty',
  'variant-group-reference',
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
          if (allowedWorkarounds.has('palette-default→indirection') && /^palettes\.(palette-1|palette-2|neutral)\.default\.color\.(tone|on-tone)$/.test(rest)) {
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

  if (root === 'tokens' && allowedWorkarounds.has('tokens.size→sizes')) {
    if (parts[1] === 'size') {
      const alt = ['tokens', 'sizes', ...parts.slice(2)].join('.')
      if (isToken(getAtPath(combined, alt))) return { resolved: true, workaround: 'tokens.size→sizes' }
    }
  }

  if (root === 'tokens' && allowedWorkarounds.has('tokens.opacity→opacities')) {
    if (parts[1] === 'opacity') {
      const alt = ['tokens', 'opacities', ...parts.slice(2)].join('.')
      if (isToken(getAtPath(combined, alt))) return { resolved: true, workaround: 'tokens.opacity→opacities' }
    }
  }

  if (root === 'brand' && allowedWorkarounds.has('elements.interactive.color→.tone|.on-tone')) {
    if (path.endsWith('.elements.interactive.color')) {
      const base = path.slice(0, -'.color'.length)
      const referrerOnTone = referrerLocation.endsWith('on-tone')
      const suffix = referrerOnTone ? 'on-tone' : 'tone'
      const alt = `${base}.${suffix}`
      if (isToken(getAtPath(combined, alt))) return { resolved: true, workaround: 'elements.interactive.color→.tone|.on-tone' }
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

  if (root === 'brand' && allowedWorkarounds.has('palette-step-group→.color.tone|.color.on-tone')) {
    const paletteStepMatch = path.match(/^brand\.themes\.(light|dark)\.palettes\.(neutral|palette-1|palette-2)\.(\d{3,4}|default|primary)$/)
    if (paletteStepMatch) {
      const [, theme, palette, step] = paletteStepMatch
      const referrerOnTone = referrerLocation.endsWith('on-tone')
      const suffix = referrerOnTone ? 'color.on-tone' : 'color.tone'
      const alt = `brand.themes.${theme}.palettes.${palette}.${step}.${suffix}`
      if (isToken(getAtPath(combined, alt))) return { resolved: true, workaround: 'palette-step-group→.color.tone|.color.on-tone' }
    }
  }

  if (root === 'brand' && allowedWorkarounds.has('palette-default→indirection')) {
    const defaultMatch = path.match(/^brand\.themes\.(light|dark)\.palettes\.(neutral|palette-1|palette-2)\.default\.(.*)$/)
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

  for (const { ref, location } of refs) {
    const path = extractRefPath(ref)
    if (!path) {
      results.push({ ref, location, valid: false, message: 'Empty or invalid reference path' })
      errors.push(`  ${location}: ${ref} (empty path)`)
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
    const summary = `Reference validation failed (${errors.length} invalid reference(s)). DTCG: references must be complete paths to a token ($value), not a group.\n${errors.join('\n')}`

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

