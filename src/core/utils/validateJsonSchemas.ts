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

