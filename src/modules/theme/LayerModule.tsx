/**
 * LayerModule
 *
 * Visual module demonstrating a single UI layer level or alternative layer
 * (alert, warning, success, high-contrast, primary-color). Pulls palette
 * CSS variables and typography styles to render a representative block.
 * Listens for 'tokenOverridesChanged' and 'paletteReset' to refresh.
 */
import { useVars } from '../vars/VarsContext'
import { readOverrides } from './tokenOverrides'
import { useEffect, useState } from 'react'

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
  // Force re-render when overrides are cleared/reset so computed styles refresh
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
  const base = isAlternative ? `--layer-layer-alternative-${alternativeKey}-property-` : `--layer-layer-${layerId}-property-`
  const includeBorder = !isAlternative && !(layerId === '0')
  const paletteBackground = isAlternative
    ? alternativeKey === 'alert' ? 'var(--palette-alert)'
      : alternativeKey === 'warning' ? 'var(--palette-warning)'
      : alternativeKey === 'success' ? 'var(--palette-success)'
      : alternativeKey === 'high-contrast' ? 'var(--palette-black)'
      : alternativeKey === 'primary-color' ? 'var(--palette-palette-1-primary-tone)'
      : null
    : null

  // Alternative-specific text bindings removed; using brand layer text vars

  // --- Typography styling (match Type page selections) ---
  type Style = React.CSSProperties
  const readCssVar = (name: string, fallback?: string): string | undefined => {
    try { return (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback) } catch { return fallback }
  }
  const pxOrUndefined = (value?: string) => {
    if (!value) return undefined
    if (/px$|em$|rem$|%$/.test(value)) return value
    if (!Number.isNaN(Number(value))) return `${value}px`
    return value
  }
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
      fontFamily: (() => { const v = resolveThemeValue(familyRec?.value, overrides); return typeof v === 'string' && v ? v : (readCssVar(`--font-${prefix}-font-family`) || undefined) })(),
      fontSize: (() => { const v = resolveThemeValue(sizeRec?.value, overrides); return (typeof v === 'number' || typeof v === 'string') ? pxOrUndefined(String(v)) : pxOrUndefined(readCssVar(`--font-${prefix}-font-size`)) })(),
      fontWeight: (() => { const v = resolveThemeValue(weightRec?.value, overrides); return (typeof v === 'number' || typeof v === 'string') ? (v as any) : (readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)) as any })(),
      letterSpacing: (() => { const v = resolveThemeValue(spacingRec?.value, overrides); if (typeof v === 'number') return `${v}em`; if (typeof v === 'string') return v; return readCssVar(`--font-${prefix}-font-letter-spacing`) })(),
      lineHeight: (() => { const rec = getThemeEntry(prefix, 'line-height'); const v = resolveThemeValue(rec?.value, overrides); return (typeof v === 'number' || typeof v === 'string') ? (v as any) : (readCssVar(`--font-${prefix}-line-height`) as any) })(),
      margin: '0 0 12px 0',
    }
    // apply per-style saved choices from Type page (optional)
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
        backgroundColor: paletteBackground ?? `var(${base}surface)`,
        color: `var(${base}element-text-color)`,
        padding: `var(${base}padding)`,
        border: includeBorder ? `var(${base}border-thickness) solid var(${base}border-color)` : undefined,
        borderRadius: includeBorder ? `var(${base}border-radius)` : undefined,
        cursor: onSelect ? 'pointer' as const : undefined,
      }}
      onClick={(e) => { if (onSelect) { e.stopPropagation(); onSelect() } }}
    >
      <div className="layer-content">
        <div className="layer-text-samples">
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
          <p style={{ ...(bodyStyle as any), color: `var(${base}element-text-color)`, opacity: `var(${base}element-text-high-emphasis)` }}>High Emphasis Text / Icon</p>
          <p style={{ ...(bodyStyle as any), color: `var(${base}element-text-color)`, opacity: `var(${base}element-text-low-emphasis)` }}>Low Emphasis Text / Icon</p>
          <p style={{
            ...(bodyStyle as any),
            color: `var(${base}element-interactive-color)` as any,
            opacity: `var(${base}element-interactive-high-emphasis)` as any
          }}>Interactive (Link / Button)</p>
          <p style={{
            ...(bodyStyle as any),
            color: `var(${base}element-interactive-color)` as any,
            opacity: 'var(--palette-disabled)'
          }}>Disabled Interactive</p>
          {!isAlternative && (
            <>
              <p style={{ color: `var(${base}element-text-alert)`, opacity: `var(${base}element-interactive-high-emphasis)` }}>Alert</p>
              <p style={{ color: `var(${base}element-text-warning)`, opacity: `var(${base}element-interactive-high-emphasis)` }}>Warning</p>
              <p style={{ color: `var(${base}element-text-success)`, opacity: `var(${base}element-interactive-high-emphasis)` }}>Success</p>
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


