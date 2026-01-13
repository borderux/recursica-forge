/**
 * Token Reference Utilities
 * 
 * Converts token names to CSS variable references
 */

/**
 * Normalizes a color level string to a standard format
 */
function normalizeColorLevel(level: string): string | null {
  const s = String(level).padStart(3, '0')
  if (s === '000') return '050'
  if (s === '1000') return '900'
  const allowed = new Set(['900','800','700','600','500','400','300','200','100','050'])
  return allowed.has(s) ? s : null
}

/**
 * Converts a token name to a CSS variable reference
 * 
 * Examples:
 * - "color/gray/100" -> "var(--recursica-tokens-color-gray-100)"
 * - "size/4x" -> "var(--recursica-tokens-size-4x)"
 * - "font/size/md" -> "var(--recursica-tokens-font-size-md)"
 * - "opacity/veiled" -> "var(--recursica-tokens-opacity-veiled)"
 */
export function tokenToCssVar(tokenName: string): string | null {
  if (!tokenName || typeof tokenName !== 'string') return null
  
  const parts = tokenName.split('/').filter(Boolean)
  if (parts.length === 0) return null
  
  const [category, ...rest] = parts
  
  try {
    if (category === 'color' || category === 'colors') {
      if (rest.length >= 2) {
        const [scaleOrFamily, level] = rest
        // Preserve 000 and 1000 as-is, normalize others
        let normalizedLevel: string | null
        if (level === '000') {
          normalizedLevel = '000'
        } else if (level === '1000') {
          normalizedLevel = '1000'
        } else {
          normalizedLevel = normalizeColorLevel(level)
        }
        
        if (scaleOrFamily && normalizedLevel) {
          // Support both old format (color/family/level) and new format (colors/scale-XX/level)
          if (scaleOrFamily.startsWith('scale-')) {
            return `var(--recursica-tokens-colors-${scaleOrFamily}-${normalizedLevel})`
          } else {
            // Old format: color/family/level -> try new format first (colors/family/level)
            // This works because aliases are generated as CSS vars (e.g., colors/gray/900)
            // Fallback to old format for backwards compatibility
            return `var(--recursica-tokens-colors-${scaleOrFamily}-${normalizedLevel})`
          }
        }
      }
    } else if (category === 'size' || category === 'sizes') {
      return `var(--recursica-tokens-sizes-${rest[0]})`
    } else if (category === 'opacity' || category === 'opacities') {
      return `var(--recursica-tokens-opacities-${rest[0]})`
    } else if (category === 'font' && rest.length >= 2) {
      const [kind, key] = rest
      // Map singular to plural for font categories
      const pluralMap: Record<string, string> = {
        'size': 'sizes',
        'sizes': 'sizes',
        'weight': 'weights',
        'weights': 'weights',
        'letter-spacing': 'letter-spacings',
        'letter-spacings': 'letter-spacings',
        'line-height': 'line-heights',
        'line-heights': 'line-heights',
        'typeface': 'typefaces',
        'typefaces': 'typefaces',
        'cases': 'cases',
        'decorations': 'decorations'
      }
      const pluralKind = pluralMap[kind] || kind
      return `var(--recursica-tokens-font-${pluralKind}-${key})`
    } else if (category === 'colors' && rest.length >= 2) {
      // New format: colors/scale-XX/level
      const [scale, level] = rest
      const normalizedLevel = level === '1000' ? '1000' : String(level).padStart(3, '0')
      return `var(--recursica-tokens-colors-${scale}-${normalizedLevel})`
    }
  } catch {
    return null
  }
  
  return null
}

/**
 * Finds a token that matches a given hex color value
 * Supports both old format (color.family.level) and new format (colors.scale-XX.level)
 */
export function findTokenByHex(
  hex: string | undefined,
  tokens: any
): { family: string; level: string; scale?: string } | null {
  if (!hex) return null
  
  try {
    const h = String(hex).trim().toLowerCase()
    if (!/^#?[0-9a-f]{6}$/.test(h)) return null
    const normalized = h.startsWith('#') ? h : `#${h}`
    
    const tokensRoot: any = tokens?.tokens || {}
    const levels = ['900','800','700','600','500','400','300','200','100','050','000','1000']
    
    // Try new scale structure first (colors.scale-XX.level)
    const colorsRoot: any = tokensRoot?.colors
    if (colorsRoot && typeof colorsRoot === 'object' && !Array.isArray(colorsRoot)) {
      for (const scaleKey of Object.keys(colorsRoot)) {
        if (!scaleKey || !scaleKey.startsWith('scale-')) continue
        const scale = colorsRoot[scaleKey]
        if (!scale || typeof scale !== 'object' || Array.isArray(scale)) continue
        
        for (const level of levels) {
          const levelObj = scale[level]
          if (levelObj && typeof levelObj === 'object') {
            const val = levelObj.$value
            if (typeof val === 'string' && val.trim().toLowerCase() === normalized) {
              const alias = scale.alias
              // Return alias if available, otherwise scale name
              return { family: alias || scaleKey, level, scale: scaleKey }
            }
          }
        }
      }
    }
    
    // Fallback to old structure (color.family.level)
    const oldColorsRoot: any = tokensRoot?.color
    if (oldColorsRoot && typeof oldColorsRoot === 'object' && !Array.isArray(oldColorsRoot)) {
      for (const family of Object.keys(oldColorsRoot)) {
        if (family === 'translucent') continue
        const familyObj = oldColorsRoot[family]
        if (!familyObj || typeof familyObj !== 'object' || Array.isArray(familyObj)) continue
        
        for (const level of levels) {
          const levelObj = familyObj[level]
          if (levelObj && typeof levelObj === 'object') {
            const val = levelObj.$value
            if (typeof val === 'string' && val.trim().toLowerCase() === normalized) {
              return { family, level }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[findTokenByHex] Error finding token:', e)
  }
  
  return null
}

