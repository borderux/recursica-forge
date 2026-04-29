import { extractBraceContent, resolveTokenReferenceToCssVar, resolveTokenReferenceToValue } from '../utils/tokenReferenceParser'
import { buildTokenIndex } from '../resolvers/tokens'

export class ImportValidationError extends Error {
  missingNodes: string[]
  constructor(missingNodes: string[]) {
    super('Import validation failed: Missing or invalid references found in JSON')
    this.missingNodes = missingNodes
    this.name = 'ImportValidationError'
  }
}

/**
 * Validates imported JSON state by scanning for unresolved or missing references.
 * Throws an ImportValidationError containing all missing nodes if any are found.
 */
export function validateImportedReferences(tokensInput: any, themeInput: any, uikitInput: any) {
  if (!uikitInput || !themeInput || !tokensInput) return
  
  const tokenIndex = buildTokenIndex(tokensInput)
  const context = {
    currentMode: 'light' as const,
    tokenIndex,
    theme: themeInput,
    uikit: uikitInput
  }

  const missingReferences: string[] = []

  // Crawl JSON and accumulate missing paths
  const crawl = (obj: any, path: string[] = [], isBrand: boolean = false) => {
    if (!obj || typeof obj !== 'object') return

    if ('$value' in obj && '$type' in obj) {
      const val = obj.$value
      if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
        const inner = extractBraceContent(val)
        if (inner) {
          const cssVar = resolveTokenReferenceToCssVar(val, context)
          
          const isPaletteRef = cssVar && cssVar.includes('_palettes_')
          const isRawTokenRef = cssVar && cssVar.includes('_tokens_colors_')
          
          if (isPaletteRef) {
            const paletteMatch = cssVar?.match(/_palettes_([a-z0-9-]+)_/)
            if (paletteMatch) {
              const paletteKey = paletteMatch[1]
              const themes: any = (themeInput as any)?.brand?.themes || (themeInput as any)?.themes || themeInput
              const paletteExists = themes?.light?.palettes?.[paletteKey] || themes?.dark?.palettes?.[paletteKey]
              
              if (!paletteExists) {
                missingReferences.push(`Missing palette '${paletteKey}' referenced at path '${path.join('.')}'`)
              }
            }
          } else if (isRawTokenRef) {
            const resolvedValue = resolveTokenReferenceToValue(val, context)
            if (resolvedValue === undefined) {
              missingReferences.push(`Missing token reference '${val}' at path '${path.join('.')}'`)
            }
          }
        }
      }
      return
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => crawl(item, [...path, String(i)], isBrand))
      return
    }

    for (const [key, value] of Object.entries(obj)) {
      if (!key.startsWith('$')) {
        crawl(value, [...path, key], isBrand)
      }
    }
  }

  const uikitRoot = uikitInput['ui-kit'] || uikitInput['0'] || uikitInput
  crawl(uikitRoot, [], false)

  const brandRoot = themeInput.brand || themeInput
  crawl(brandRoot, [], true)

  if (missingReferences.length > 0) {
    throw new ImportValidationError(missingReferences)
  }
}
