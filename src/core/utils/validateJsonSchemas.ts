/**
 * Runtime JSON Schema Validation Utility
 * 
 * Validates Brand.json, Tokens.json, and UIKit.json against their schemas
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
 * Recursively checks for theme references in brand palette $value strings
 * Theme references like {brand.themes.light.palettes.core-colors.black} should not exist
 * They should use short alias format like {brand.palettes.black}
 */
function checkForThemeReferences(obj: any, path: string = ''): string[] {
  const errors: string[] = []
  
  if (typeof obj === 'string') {
    // Check if string contains theme reference (both new and old formats)
    // Theme references should not exist - they should use format like {brand.palettes.core-colors.black}
    if (obj.includes('{brand.themes.') || obj.includes('{brand.light.') || obj.includes('{brand.dark.')) {
      errors.push(`Theme reference found at ${path}: "${obj}". Use format like {brand.palettes.core-colors.black} instead.`)
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      errors.push(...checkForThemeReferences(item, `${path}[${index}]`))
    })
  } else if (obj && typeof obj === 'object') {
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key
      errors.push(...checkForThemeReferences(obj[key], newPath))
    }
  }
  
  return errors
}

/**
 * Validates Brand.json against its schema
 */
export function validateBrandJson(brandJson: JsonLike): void {
  const validate = ajv.compile(brandSchema)
  const valid = validate(brandJson)
  
  if (!valid && validate.errors) {
    const criticalErrors = filterCriticalErrors(validate.errors)
    
    if (criticalErrors.length > 0) {
      console.error('[Schema Validation] Brand.json has critical validation errors:', criticalErrors)
      throw new Error(
        `Brand.json validation failed with ${criticalErrors.length} critical error(s). ` +
        `First error: ${JSON.stringify(criticalErrors[0])}`
      )
    }
  }
  
  // Additional validation: Check for theme references in brand palette references
  const themeRefErrors = checkForThemeReferences(brandJson)
  if (themeRefErrors.length > 0) {
    console.error('[Schema Validation] Brand.json contains theme references:', themeRefErrors)
    throw new Error(
      `Brand.json validation failed: Found ${themeRefErrors.length} theme reference(s). ` +
      `References should use short alias format (e.g., {brand.palettes.black}) not theme paths (e.g., {brand.themes.light.palettes.core-colors.black}). ` +
      `First error: ${themeRefErrors[0]}`
    )
  }
}

/**
 * Validates Tokens.json against its schema
 */
export function validateTokensJson(tokensJson: JsonLike): void {
  const validate = ajv.compile(tokensSchema)
  const valid = validate(tokensJson)
  
  if (!valid && validate.errors) {
    const criticalErrors = filterCriticalErrors(validate.errors)
    
    if (criticalErrors.length > 0) {
      console.error('[Schema Validation] Tokens.json has critical validation errors:', criticalErrors)
      throw new Error(
        `Tokens.json validation failed with ${criticalErrors.length} critical error(s). ` +
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
 * Validates UIKit.json against its schema
 */
export function validateUIKitJson(uikitJson: JsonLike): void {
  const validate = ajv.compile(uikitSchema)
  const valid = validate(uikitJson)
  
  if (!valid && validate.errors) {
    const criticalErrors = filterCriticalErrors(validate.errors)
    
    if (criticalErrors.length > 0) {
      console.error('[Schema Validation] UIKit.json has critical validation errors:', criticalErrors)
      throw new Error(
        `UIKit.json validation failed with ${criticalErrors.length} critical error(s). ` +
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
    
    console.error('[Schema Validation] UIKit.json contains theme references:', themeRefs)
    throw new Error(
      `UIKit.json validation failed: Found ${themeRefs.length} theme reference(s). ` +
      `All token references must be theme-agnostic (use {brand.*} instead of {brand.themes.light.*} or {brand.themes.dark.*}).\n` +
      `Theme references found:\n${errorMessages}`
    )
  }
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
}

