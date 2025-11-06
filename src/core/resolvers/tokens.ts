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
        const [family, level] = rest
        return root?.color?.[family]?.[level]?.$value
      }
      case 'opacity': {
        const [name] = rest
        return root?.opacity?.[name]?.$value
      }
      case 'size': {
        const [name] = rest
        return root?.size?.[name]?.$value
      }
      case 'font': {
        const [kind, key] = rest
        if (kind === 'weight') return root?.font?.weight?.[key]?.$value
        if (kind === 'size') return root?.font?.size?.[key]?.$value
        if (kind === 'letter-spacing') return root?.font?.['letter-spacing']?.[key]?.$value
        if (kind === 'line-height') return root?.font?.['line-height']?.[key]?.$value
        if (kind === 'family') return root?.font?.family?.[key]?.$value
        if (kind === 'typeface') return root?.font?.typeface?.[key]?.$value
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


