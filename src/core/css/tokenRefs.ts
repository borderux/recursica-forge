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
    if (category === 'color' && rest.length >= 2) {
      const [family, level] = rest
      const normalizedLevel = normalizeColorLevel(level)
      if (family && normalizedLevel) {
        return `var(--recursica-tokens-color-${family}-${normalizedLevel})`
      }
    } else if (category === 'size' && rest.length >= 1) {
      return `var(--recursica-tokens-size-${rest[0]})`
    } else if (category === 'opacity' && rest.length >= 1) {
      return `var(--recursica-tokens-opacity-${rest[0]})`
    } else if (category === 'font' && rest.length >= 2) {
      const [kind, key] = rest
      return `var(--recursica-tokens-font-${kind}-${key})`
    }
  } catch {
    return null
  }
  
  return null
}

/**
 * Finds a token that matches a given hex color value
 */
export function findTokenByHex(
  hex: string | undefined,
  tokens: any
): { family: string; level: string } | null {
  if (!hex) return null
  
  try {
    const h = String(hex).trim().toLowerCase()
    if (!/^#?[0-9a-f]{6}$/.test(h)) return null
    const normalized = h.startsWith('#') ? h : `#${h}`
    
    const tokensRoot: any = tokens?.tokens || {}
    const colorsRoot: any = tokensRoot?.color || {}
    const levels = ['900','800','700','600','500','400','300','200','100','050','000']
    
    for (const family of Object.keys(colorsRoot)) {
      if (family === 'translucent') continue
      for (const level of levels) {
        const val = colorsRoot[family]?.[level]?.$value
        if (typeof val === 'string' && val.trim().toLowerCase() === normalized) {
          return { family, level }
        }
      }
    }
  } catch {}
  
  return null
}

