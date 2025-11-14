import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { useEffect, useState, useMemo } from 'react'
import { readCssVar } from '../../core/css/readCssVar'
 

type LayerModuleProps = {
  level?: number | string
  alternativeKey?: string
  title?: string
  className?: string
  children?: any
  onSelect?: () => void
  isSelected?: boolean
}

export default function LayerModule({ level, alternativeKey, title, className, children, onSelect, isSelected }: LayerModuleProps) {
  const { tokens, theme } = useVars()
  const [, setVersion] = useState(0)
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    try {
      window.addEventListener('tokenOverridesChanged', handler as any)
      window.addEventListener('paletteReset', handler as any)
    } catch {}
    return () => {
      try {
        window.removeEventListener('tokenOverridesChanged', handler as any)
        window.removeEventListener('paletteReset', handler as any)
      } catch {}
    }
  }, [])
  const isAlternative = typeof alternativeKey === 'string' && alternativeKey.length > 0
  const layerId = level != null ? String(level) : '0'
  const legacyBase = isAlternative ? `--layer-layer-alternative-${alternativeKey}-property-` : `--layer-layer-${layerId}-property-`
  const brandBase = isAlternative ? `--recursica-brand-light-layer-layer-alternative-${alternativeKey}-property-` : `--recursica-brand-light-layer-layer-${layerId}-property-`
  const includeBorder = !isAlternative && !(layerId === '0')
  const paletteBackground = isAlternative
    ? alternativeKey === 'alert' ? 'var(--recursica-brand-light-palettes-core-alert, var(--palette-alert))'
      : alternativeKey === 'warning' ? 'var(--recursica-brand-light-palettes-core-warning, var(--palette-warning))'
      : alternativeKey === 'success' ? 'var(--recursica-brand-light-palettes-core-success, var(--palette-success))'
      : alternativeKey === 'high-contrast' ? 'var(--recursica-brand-light-palettes-core-black)'
      : alternativeKey === 'primary-color' ? 'var(--recursica-brand-light-palettes-palette-1-primary-tone)'
      : null
    : null

  const getTokenValue = (name: string): any => {
    try {
      const t: any = (tokens as any)?.tokens || {}
      const parts = name.split('/')
      if (parts[0] === 'color' && parts[1] && parts[2]) return t?.color?.[parts[1]]?.[parts[2]]?.$value
      if (parts[0] === 'opacity' && parts[1]) return t?.opacity?.[parts[1]]?.$value
      if (parts[0] === 'size' && parts[1]) return t?.size?.[parts[1]]?.$value
    } catch {}
    return undefined
  }
  const resolveBraceRef = (input: any, depth = 0): any => {
    if (depth > 8) return undefined
    if (input == null) return undefined
    if (typeof input === 'number') return input
    if (typeof input === 'object') return resolveBraceRef((input as any).$value ?? (input as any).value ?? input, depth + 1)
    const s = String(input).trim()
    if (!s) return undefined
    if (s.startsWith('{') && s.endsWith('}')) {
      const inner = s.slice(1, -1).trim()
      if (/^(tokens|token)\./i.test(inner)) {
        const path = inner.replace(/^(tokens|token)\./i, '').replace(/[.]/g, '/').trim()
        return resolveBraceRef(getTokenValue(path), depth + 1)
      }
      if (/^brand\./i.test(inner)) {
        const parts = inner.split('.').filter(Boolean)
        let node: any = (theme as any)
        for (const p of parts) { if (!node) break; node = node[p] }
        return resolveBraceRef(node, depth + 1)
      }
      return undefined
    }
    return s
  }
  const elevationLevel = useMemo(() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
      const themes = root?.themes || root
      const layerSpec: any = themes?.light?.layers?.[`layer-${layerId}`] || themes?.light?.layer?.[`layer-${layerId}`] || root?.light?.layers?.[`layer-${layerId}`] || root?.light?.layer?.[`layer-${layerId}`] || {}
      const v: any = layerSpec?.property?.elevation?.$value
      if (typeof v === 'string') {
        // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
        const m = v.match(/elevations\.(elevation-(\d+))/i)
        if (m) return m[2]
      }
    } catch {}
    return String(layerId)
  }, [theme, layerId])
  const cssVarBoxShadow = `var(--recursica-brand-light-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-shadow-color, rgba(0,0,0,0))`

  type Style = React.CSSProperties
  const pxOrUndefined = (value?: string) => {
    if (!value) return undefined
    if (/px$|em$|rem$|%$/.test(value)) return value
    if (!Number.isNaN(Number(value))) return `${value}px`
    return value
  }
  // --- Contrast helpers pulled from contrastUtil ---
  // Parse selected surface binding from theme (e.g., {brand.light.palettes.palette-1.500.color.tone})
  // Surface binding helpers no longer used; layer vars already carry accessible choices
  type ThemeRecord = { name: string; mode?: string; value?: any }
  const getThemeEntry = (prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'weight-normal' | 'line-height'): ThemeRecord | undefined => {
    const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
    const key = `[themes][Light][font/${map[prefix] || prefix}/${prop}]`
    const rec: any = (theme as any).RecursicaBrand
    return rec ? (rec[key] as ThemeRecord | undefined) : undefined
  }
  const resolveThemeValue = (ref: any, overrides: Record<string, any>): string | number | undefined => {
    if (ref == null) return undefined
    if (typeof ref === 'string' || typeof ref === 'number') return ref
    if (typeof ref === 'object') {
      const coll = (ref as any).collection
      const name = (ref as any).name
      if (coll === 'Tokens') {
        if (Object.prototype.hasOwnProperty.call(overrides, name)) return overrides[name]
        const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === name)
        return entry ? (entry as any).value : undefined
      }
      if (coll === 'Theme') {
        const rec: any = (theme as any).RecursicaBrand
        const entry = rec ? (rec[name] as ThemeRecord | undefined) : undefined
        if (!entry) return undefined
        return resolveThemeValue(entry.value, overrides)
      }
    }
    return undefined
  }
  const buildTypeStyle = (prefix: string): Style => {
    const overrides = readOverrides() as Record<string, any>
    const familyRec = getThemeEntry(prefix, 'font-family')
    const sizeRec = getThemeEntry(prefix, 'size')
    const spacingRec = getThemeEntry(prefix, 'letter-spacing')
    const weightRec = getThemeEntry(prefix, 'weight') || getThemeEntry(prefix, 'weight-normal')
    const base: any = {
      fontFamily: (() => { const v = resolveThemeValue(familyRec?.value, overrides); return typeof v === 'string' && v ? v : (readCssVar(`--recursica-brand-typography-${prefix}-font-family`) || undefined) })(),
      fontSize: (() => { const v = resolveThemeValue(sizeRec?.value, overrides); return (typeof v === 'number' || typeof v === 'string') ? pxOrUndefined(String(v)) : pxOrUndefined(readCssVar(`--recursica-brand-typography-${prefix}-font-size`)) })(),
      fontWeight: (() => { const v = resolveThemeValue(weightRec?.value, overrides); return (typeof v === 'number' || typeof v === 'string') ? (v as any) : (readCssVar(`--recursica-brand-typography-${prefix}-font-weight`) || 400) as any })(),
      letterSpacing: (() => { const v = resolveThemeValue(spacingRec?.value, overrides); if (typeof v === 'number') return `${v}em`; if (typeof v === 'string') return v; return readCssVar(`--recursica-brand-typography-${prefix}-font-letter-spacing`) })(),
      lineHeight: (() => { const rec = getThemeEntry(prefix, 'line-height'); const v = resolveThemeValue(rec?.value, overrides); return (typeof v === 'number' || typeof v === 'string') ? (v as any) : (readCssVar(`--recursica-brand-typography-${prefix}-line-height`) as any) })(),
      margin: '0 0 12px 0',
    }
    try {
      const raw = localStorage.getItem('type-token-choices')
      if (raw) {
        const choices = JSON.parse(raw || '{}') || {}
        const c = choices[prefix]
        if (c) {
          if (c.family) base.fontFamily = c.family
          if (c.size) {
            const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === `font/size/${c.size}`)
            const val = entry ? (entry as any).value : undefined
            if (val != null) base.fontSize = pxOrUndefined(String(val))
          }
          if (c.weight) {
            const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === `font/weight/${c.weight}`)
            const val = entry ? (entry as any).value : undefined
            if (val != null) base.fontWeight = val as any
          }
          if (c.spacing) {
            const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === `font/letter-spacing/${c.spacing}`)
            const val = entry ? (entry as any).value : undefined
            if (val != null) base.letterSpacing = typeof val === 'number' ? `${val}em` : val
          }
        }
      }
    } catch {}
    return base
  }
  const headingStyle = buildTypeStyle('h3')
  const bodyStyle = buildTypeStyle('body-1')
  return (
    <div
      className={className ? `layer-container ${className}` : 'layer-container'}
      style={{
        backgroundColor: paletteBackground ?? `var(${brandBase}surface)`,
        color: `var(${brandBase}element-text-color)`,
        padding: `var(${brandBase}padding)`,
        border: includeBorder ? `var(${brandBase}border-thickness) solid var(${brandBase}border-color)` : undefined,
        borderRadius: includeBorder ? `var(${brandBase}border-radius)` : undefined,
        cursor: onSelect ? 'pointer' as const : undefined,
        boxShadow: cssVarBoxShadow,
      }}
      onClick={(e) => { if (onSelect) { e.stopPropagation(); onSelect() } }}
    >
      <div className="layer-content" style={isAlternative ? { height: '100%' } : undefined}>
        <div className="layer-text-samples" style={isAlternative ? { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } : undefined}>
          {onSelect ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }} onClick={(e) => e.stopPropagation()}>
              <input
                type="radio"
                name="layer-select"
                checked={!!isSelected}
                onChange={(e) => { e.stopPropagation(); onSelect?.() }}
                onClick={(e) => e.stopPropagation()}
              />
              <span style={{ fontWeight: 700 }}>{title || `Layer ${layerId}`}</span>
            </label>
          ) : (
            title ? <h3 style={{ ...(headingStyle as any), fontWeight: 700 }}>{title}</h3> : null
          )}
          {isAlternative ? (
            <div>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-text-color)` as any),
                opacity: (`var(${brandBase}element-text-high-emphasis)` as any)
              }}>High Emphasis Text / Icon</p>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-text-color)` as any),
                opacity: (`var(${brandBase}element-text-low-emphasis)` as any)
              }}>Low Emphasis Text / Icon</p>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-interactive-color)` as any),
                opacity: `var(${brandBase}element-interactive-high-emphasis)` as any
              }}>Interactive (Link / Button)</p>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-interactive-color)` as any),
                opacity: ('var(--recursica-brand-light-opacity-disabled)' as any)
              }}>Disabled Interactive</p>
            </div>
          ) : (
            <>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-text-color)` as any),
                opacity: (`var(${brandBase}element-text-high-emphasis)` as any)
              }}>High Emphasis Text / Icon</p>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-text-color)` as any),
                opacity: (`var(${brandBase}element-text-low-emphasis)` as any)
              }}>Low Emphasis Text / Icon</p>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-interactive-color)` as any),
                opacity: `var(${brandBase}element-interactive-high-emphasis)` as any
              }}>Interactive (Link / Button)</p>
              <p style={{
                ...(bodyStyle as any),
                color: (`var(${brandBase}element-interactive-color)` as any),
                opacity: ('var(--recursica-brand-light-opacity-disabled)' as any)
              }}>Disabled Interactive</p>
              <p style={{ color: (`var(${brandBase}element-text-alert)` as any), opacity: (`var(${brandBase}element-text-high-emphasis)` as any) }}>Alert</p>
              <p style={{ color: (`var(${brandBase}element-text-warning)` as any), opacity: (`var(${brandBase}element-text-high-emphasis)` as any) }}>Warning</p>
              <p style={{ color: (`var(${brandBase}element-text-success)` as any), opacity: (`var(${brandBase}element-text-high-emphasis)` as any) }}>Success</p>
            </>
          )}
        </div>
        {children ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

