export type JsonLike = Record<string, any>

export type TokenIndex = {
  get: (path: string) => any
}

export function buildTokenIndex(tokens: JsonLike | null | undefined): TokenIndex {
  const root: any = (tokens as any)?.tokens || tokens || {}
  const get = (path: string): any => {
    const parts = String(path || '').split('/').filter(Boolean)
    if (parts.length === 0) return undefined
    const [head, ...rest] = parts
    switch (head) {
      case 'color': {
        // Support both old format (color/family/level) and new format (color/scale-XX/level)
        const [scaleOrFamily, level] = rest
        if (scaleOrFamily?.startsWith('scale-')) {
          // New format: colors.scale-XX.XXX
          return root?.colors?.[scaleOrFamily]?.[level]?.$value
        } else {
          // Old format: color.family.level (for backwards compatibility)
          return root?.color?.[scaleOrFamily]?.[level]?.$value
        }
      }
      case 'colors': {
        // New format: colors/scale-XX/level
        const [scale, level] = rest
        return root?.colors?.[scale]?.[level]?.$value
      }
      case 'opacity': {
        const [name] = rest
        return root?.opacities?.[name]?.$value
      }
      case 'opacities': {
        const [name] = rest
        return root?.opacities?.[name]?.$value
      }
      case 'size': {
        const [name] = rest
        return root?.sizes?.[name]?.$value
      }
      case 'sizes': {
        const [name] = rest
        return root?.sizes?.[name]?.$value
      }
      case 'font': {
        const [kind, key] = rest
        // Handle pluralized font keys
        if (kind === 'weights' || kind === 'weight') return root?.font?.weights?.[key]?.$value || root?.font?.weight?.[key]?.$value
        if (kind === 'sizes' || kind === 'size') return root?.font?.sizes?.[key]?.$value || root?.font?.size?.[key]?.$value
        if (kind === 'letter-spacings' || kind === 'letter-spacing') return root?.font?.['letter-spacings']?.[key]?.$value || root?.font?.['letter-spacing']?.[key]?.$value
        if (kind === 'line-heights' || kind === 'line-height') return root?.font?.['line-heights']?.[key]?.$value || root?.font?.['line-height']?.[key]?.$value
        if (kind === 'typefaces' || kind === 'typeface') return root?.font?.typefaces?.[key]?.$value || root?.font?.typeface?.[key]?.$value
        if (kind === 'cases') return root?.font?.cases?.[key]?.$value
        if (kind === 'decorations') return root?.font?.decorations?.[key]?.$value
        if (kind === 'family') return root?.font?.family?.[key]?.$value
        return undefined
      }
      default:
        return undefined
    }
  }
  return { get }
}

export function resolveBraceRef(ref: any, tokenIndex: TokenIndex, themeAccessor?: (path: string) => any, depth = 0): any {
  if (depth > 8) return undefined
  if (ref == null) return undefined
  if (typeof ref === 'number') return ref
  if (typeof ref === 'object') return resolveBraceRef((ref as any).$value ?? (ref as any).value ?? ref, tokenIndex, themeAccessor, depth + 1)
  const s = String(ref).trim()
  if (!s) return undefined
  const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
  if (/^(tokens|token)\./i.test(inner)) {
    const path = inner.replace(/^(tokens|token)\./i, '').replace(/[.]/g, '/').replace(/\/+/, '/')
    return resolveBraceRef(tokenIndex.get(path), tokenIndex, themeAccessor, depth + 1)
  }
  if (/^(theme|brand)\./i.test(inner) && themeAccessor) {
    const path = inner.replace(/^(theme|brand)\./i, '').trim()
    return resolveBraceRef(themeAccessor(path), tokenIndex, themeAccessor, depth + 1)
  }
  return s
}


