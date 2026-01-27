/**
 * CSS Export Validation Utility
 * 
 * Validates exported CSS files for basic syntax and structure errors.
 */

import { exportCssStylesheet } from './jsonExport'

export interface CssValidationError {
  file: 'specific' | 'scoped'
  message: string
  line?: number
}

/**
 * Validates CSS syntax by checking for common errors
 */
function validateCssSyntax(css: string, fileType: 'specific' | 'scoped'): CssValidationError[] {
  const errors: CssValidationError[] = []
  const lines = css.split('\n')
  
  // Check for unclosed braces
  let braceCount = 0
  lines.forEach((line, index) => {
    const openBraces = (line.match(/{/g) || []).length
    const closeBraces = (line.match(/}/g) || []).length
    braceCount += openBraces - closeBraces
    
    // Check for malformed CSS variable declarations
    // Pattern: --name: value;
    if (line.includes(':') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')) {
      const colonIndex = line.indexOf(':')
      const semicolonIndex = line.indexOf(';')
      
      if (colonIndex !== -1 && semicolonIndex === -1 && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        // Line has colon but no semicolon and isn't a rule opening/closing
        // This might be okay if it's a multi-line value, but we'll flag it
        if (!line.trim().endsWith('\\')) {
          errors.push({
            file: fileType,
            message: `Missing semicolon or incomplete declaration`,
            line: index + 1
          })
        }
      }
    }
  })
  
  if (braceCount !== 0) {
    errors.push({
      file: fileType,
      message: `Unmatched braces: ${braceCount > 0 ? braceCount : -braceCount} unclosed ${braceCount > 0 ? 'opening' : 'closing'} brace(s)`
    })
  }
  
  // Check for valid CSS variable names (must start with --)
  // Only validate variable names that are being declared (left side of colon)
  // or inside var() functions (extract properly)
  lines.forEach((line, index) => {
    if (line.includes('--') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')) {
      // Match CSS variable declarations: --name: value;
      const declarationMatch = line.match(/^\s*(--[^\s:]+)\s*:/)
      if (declarationMatch) {
        const varName = declarationMatch[1]
        if (!varName.match(/^--[a-zA-Z][a-zA-Z0-9_-]*$/)) {
          errors.push({
            file: fileType,
            message: `Invalid CSS variable name: ${varName}`,
            line: index + 1
          })
        }
      }
      
      // Match CSS variables inside var() functions: var(--name)
      const varFunctionMatches = line.matchAll(/var\s*\(\s*(--[^\s)]+)\s*\)/g)
      for (const match of varFunctionMatches) {
        const varName = match[1]
        if (!varName.match(/^--[a-zA-Z][a-zA-Z0-9_-]*$/)) {
          errors.push({
            file: fileType,
            message: `Invalid CSS variable name: ${varName}`,
            line: index + 1
          })
        }
      }
    }
  })
  
  return errors
}

/**
 * Validates that CSS files can be generated without errors
 */
export function validateCssExport(options: { specific?: boolean; scoped?: boolean } = { specific: true, scoped: true }): CssValidationError[] {
  const errors: CssValidationError[] = []
  
  try {
    const cssExports = exportCssStylesheet(options)
    
    if (options.specific && cssExports.specific) {
      const specificErrors = validateCssSyntax(cssExports.specific, 'specific')
      errors.push(...specificErrors)
    }
    
    if (options.scoped && cssExports.scoped) {
      const scopedErrors = validateCssSyntax(cssExports.scoped, 'scoped')
      errors.push(...scopedErrors)
    }
  } catch (error) {
    errors.push({
      file: options.specific ? 'specific' : 'scoped',
      message: `Failed to generate CSS: ${error instanceof Error ? error.message : String(error)}`
    })
  }
  
  return errors
}
