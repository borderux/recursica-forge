import '../theme/index.css'
import { useState, useEffect, useMemo } from 'react'
import { readOverrides } from '../theme/tokenOverrides'
import { useVars } from '../vars/VarsContext'
import ElevationModule from './ElevationModule'
import ElevationStylePanel from './ElevationStylePanel'
type ElevationControlType = { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }

interface ShadowColorControl {
  colorToken: string
  alphaToken: string
}

// per-sample chip picker removed; panel handles selects

// inline color picker removed; color is configured in the panel

export default function ElevationPage() {
  const { tokens: tokensJson } = useVars()
  const { theme: themeJson } = useVars()
  const [blurScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('blur-scale-by-default'); return v === null ? true : v === 'true' })
  const [spreadScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('spread-scale-by-default'); return v === null ? false : v === 'true' })
  const [offsetXScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('offset-x-scale-by-default'); return v === null ? false : v === 'true' })
  const [offsetYScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('offset-y-scale-by-default'); return v === null ? false : v === 'true' })
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(() => new Set<number>())
  const [shadowColorControl, setShadowColorControl] = useState<ShadowColorControl>(() => {
    try { const saved = localStorage.getItem('shadow-color-control'); if (saved) return JSON.parse(saved) } catch {}
    // seed from Brand.json (opacity only; color falls back to neutral palette)
    const brand: any = (themeJson as any)?.brand || (themeJson as any)
    const elev: any = brand?.light?.elevations?.['elevation-1']?.['$value'] || {}
    const alphaRef = elev?.opacity?.['$value'] as string | undefined
    const parseOpacity = (s?: string) => {
      if (!s) return 'opacity/veiled'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
      return 'opacity/veiled'
    }
    return { colorToken: 'color/gray/900', alphaToken: parseOpacity(alphaRef) }
  })
  const [elevationControls, setElevationControls] = useState<Record<string, ElevationControlType>>(() => {
    const fromBrand: Record<string, ElevationControlType> = {}
    const brand: any = (themeJson as any)?.brand || (themeJson as any)
    const light: any = brand?.light?.elevations || {}
    const toSize = (ref?: any): string => {
      const s: string | undefined = typeof ref === 'string' ? ref : (ref?.['$value'] as any)
      if (!s) return 'size/none'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'size') {
        const key = parts.slice(2).join('.')
        return `size/${key}`
      }
      return 'size/none'
    }
    for (let i = 0; i <= 4; i++) {
      const node: any = light[`elevation-${i}`]?.['$value'] || {}
      fromBrand[`elevation-${i}`] = {
        blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
        spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
        offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
        offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
      }
    }
    return fromBrand
  })
  const [sizeTokens, setSizeTokens] = useState<Record<string, number>>(() => {
    const tokens: Record<string, number> = {}
    try {
      const src: any = (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) tokens[`size/${k}`] = num
      })
    } catch {}
    const overrides = readOverrides(); const sizeOverrides: Record<string, number> = {}
    Object.entries(overrides).forEach(([key, value]) => { if (key.startsWith('size/') && typeof value === 'number') sizeOverrides[key] = value as number })
    return { ...tokens, ...sizeOverrides }
  })
  useEffect(() => {
    try { const saved = localStorage.getItem('elevation-controls'); if (saved) setElevationControls(JSON.parse(saved)) } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('elevation-controls', JSON.stringify(elevationControls)) } catch {}
  }, [elevationControls])
  useEffect(() => { try { localStorage.setItem('shadow-color-control', JSON.stringify(shadowColorControl)) } catch {} }, [shadowColorControl])
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, name, value } = detail
      if (all && typeof all === 'object') {
        const newSizeTokens: Record<string, number> = {}
        try {
          const src: any = (tokensJson as any)?.tokens?.size || {}
          Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
            const raw = src[k]?.$value
            const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
            const num = typeof v === 'number' ? v : Number(v)
            if (Number.isFinite(num)) newSizeTokens[`size/${k}`] = num
          })
        } catch {}
        setSizeTokens({ ...newSizeTokens, ...all }); setShadowColorControl(prev => ({ ...prev })); return
      }
      if (typeof name === 'string' && (name.startsWith('size/') || name.startsWith('opacity/') || name.startsWith('color/'))) {
        if (name.startsWith('size/')) setSizeTokens(prev => ({ ...prev, [name]: value }))
        setShadowColorControl(prev => ({ ...prev }))
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])
  const updateElevationControl = (elevation: string, property: 'blurToken' | 'spreadToken' | 'offsetXToken' | 'offsetYToken', value: string) => {
    if (elevation === 'elevation-0') return
    setElevationControls(prev => ({ ...prev, [elevation]: { ...prev[elevation], [property]: value } }))
  }
  const getNextTokenInProgression = useMemo(() => {
    return (baseToken: string, steps: number): string => {
      const sizeItems: Array<{ name: string; value: number }> = []
      Object.entries(sizeTokens).forEach(([name, value]) => { if (name.startsWith('size/') && typeof value === 'number') sizeItems.push({ name, value }) })
      const weight = (full: string) => { const n = full.replace('size/', '').replace('-', '.'); if (n === 'none') return [0, 0] as const; if (n === '0.5x') return [1, 0] as const; if (n === 'default') return [2, 0] as const; const asNum = parseFloat(n.replace('x', '')); return [3, isNaN(asNum) ? Number.POSITIVE_INFINITY : asNum] as const }
      const sortedTokens = sizeItems.sort((a, b) => { const wa = weight(a.name); const wb = weight(b.name); if (wa[0] !== wb[0]) return wa[0] - wb[0]; return wa[1] - wb[1] })
      const currentIndex = sortedTokens.findIndex(token => token.name === baseToken)
      if (currentIndex === -1) return baseToken
      const nextIndex = Math.min(currentIndex + steps, sortedTokens.length - 1)
      return sortedTokens[nextIndex].name
    }
  }, [sizeTokens])
  const getBlurValue = (elevation: string) => { const control = elevationControls[elevation]; if (!control) return 0; const tokenValue = sizeTokens[control.blurToken]; const baseValue = tokenValue || 0; if (blurScaleByDefault) { const elevationLevel = parseInt(elevation.replace('elevation-', '')); const level0Control = elevationControls['elevation-0']; const baseToken = level0Control?.blurToken || 'size/default'; const nextToken = getNextTokenInProgression(baseToken, elevationLevel); return sizeTokens[nextToken] || baseValue } return baseValue }
  const getSpreadValue = (elevation: string) => { const control = elevationControls[elevation]; if (!control) return 0; const tokenValue = sizeTokens[control.spreadToken]; const baseValue = tokenValue || 0; if (spreadScaleByDefault) { const elevationLevel = parseInt(elevation.replace('elevation-', '')); const level0Control = elevationControls['elevation-0']; const baseToken = level0Control?.spreadToken || 'size/default'; const nextToken = getNextTokenInProgression(baseToken, elevationLevel); return sizeTokens[nextToken] || baseValue } return baseValue }
  const getOffsetXValue = (elevation: string) => { const control = elevationControls[elevation]; if (!control) return 0; const tokenValue = sizeTokens[control.offsetXToken]; const baseValue = tokenValue || 0; if (offsetXScaleByDefault) { const elevationLevel = parseInt(elevation.replace('elevation-', '')); const level0Control = elevationControls['elevation-0']; const baseToken = level0Control?.offsetXToken || 'size/default'; const nextToken = getNextTokenInProgression(baseToken, elevationLevel); return sizeTokens[nextToken] || baseValue } return baseValue }
  const getOffsetYValue = (elevation: string) => { const control = elevationControls[elevation]; if (!control) return 0; const tokenValue = sizeTokens[control.offsetYToken]; const baseValue = tokenValue || 0; if (offsetYScaleByDefault) { const elevationLevel = parseInt(elevation.replace('elevation-', '')); const level0Control = elevationControls['elevation-0']; const baseToken = level0Control?.offsetYToken || 'size/default'; const nextToken = getNextTokenInProgression(baseToken, elevationLevel); return sizeTokens[nextToken] || baseValue } return baseValue }
  const getTokenValueByName = (name: string): string | number | undefined => {
    try {
      const overrides = readOverrides() as Record<string, any>
      if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
        const ov = overrides[name]
        if (ov != null) return ov as any
      }
    } catch {}
    try {
      const parts = (name || '').split('/')
      const root: any = (tokensJson as any)?.tokens || {}
      if (parts[0] === 'color' && parts.length >= 3) {
        const v = root?.color?.[parts[1]]?.[parts[2]]?.$value
        return typeof v === 'string' ? v : undefined
      }
      if (parts[0] === 'opacity' && parts[1]) {
        const v = root?.opacity?.[parts[1]]?.$value
        return typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : undefined)
      }
    } catch {}
    return undefined
  }
  const getBaseColor = useMemo(() => { const v = getTokenValueByName(shadowColorControl.colorToken); return (typeof v === 'string' && v) ? v : '#000000' }, [shadowColorControl.colorToken])
  const getAlpha = useMemo(() => { const v = getTokenValueByName(shadowColorControl.alphaToken); const n = typeof v === 'number' ? v : Number(v); return Number.isFinite(n) ? n : 0 }, [shadowColorControl.alphaToken])
  useEffect(() => { try { const root = document.documentElement; const apply = (level: number) => { const key = `elevation-${level}`; const blur = getBlurValue(key); const spread = getSpreadValue(key); const x = getOffsetXValue(key); const y = getOffsetYValue(key); const color = getBaseColor; root.style.setProperty(`--elevation-elevation-${level}-shadow-color`, color); root.style.setProperty(`--elevation-elevation-${level}-blur`, `${blur}px`); root.style.setProperty(`--elevation-elevation-${level}-spread`, `${spread}px`); root.style.setProperty(`--elevation-elevation-${level}-x-axis`, `${x}px`); root.style.setProperty(`--elevation-elevation-${level}-y-axis`, `${y}px`) }; for (let i = 0; i <= 4; i += 1) apply(i) } catch {} }, [sizeTokens, elevationControls, getBaseColor, blurScaleByDefault, spreadScaleByDefault, offsetXScaleByDefault, offsetYScaleByDefault])
  const availableSizeTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    Object.entries(sizeTokens).forEach(([name, value]) => {
      if (name.startsWith('size/') && typeof value === 'number') {
        const baseLabel = name.replace('size/', '').replace('-', '.')
        const label = baseLabel === 'none' ? 'None' : baseLabel === 'default' ? 'Default' : baseLabel.endsWith('x') ? baseLabel : `${baseLabel}x`
        tokens.push({ name, value, label })
      }
    })
    return tokens.sort((a, b) => a.value - b.value)
  }, [sizeTokens])
  const availableOpacityTokens = useMemo(() => {
    const out: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) out.push({ name: `opacity/${k}`, value: num, label: k.charAt(0).toUpperCase() + k.slice(1) })
      })
    } catch {}
    return out.sort((a, b) => a.value - b.value)
  }, [tokensJson])
  // max size token value no longer used; sliders are token-driven
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Elevation</h2>
          </div>
          {/* Shadow color controls moved into side panel */}
          <div className="elevation-grid">
            {[0,1,2,3,4].map((i) => (
              <ElevationModule
                key={i}
                label={`Elevation ${i}`}
                blurPx={getBlurValue(`elevation-${i}`)}
                spreadPx={getSpreadValue(`elevation-${i}`)}
                offsetXPx={getOffsetXValue(`elevation-${i}`)}
                offsetYPx={getOffsetYValue(`elevation-${i}`)}
                colorHex={getBaseColor}
                alpha={getAlpha}
                isSelected={i === 0 ? false : selectedLevels.has(i)}
                onToggle={i === 0 ? undefined : () => setSelectedLevels(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })}
                selectable={i > 0}
              />
            ))}
          </div>
        </div>
        {/* Style Panel */}
        {selectedLevels.size > 0 && (
          <ElevationStylePanel
            selectedLevels={selectedLevels}
            elevationControls={elevationControls}
            availableSizeTokens={availableSizeTokens}
            availableOpacityTokens={availableOpacityTokens}
            neutralColorOptions={(() => {
              const opts: Array<{ name: string; label: string }> = []
              const gray: any = (tokensJson as any)?.tokens?.color?.gray || {}
              const levels = Object.keys(gray).filter((k) => /^(\d{2,4}|000)$/.test(k)).sort((a,b) => Number(b.replace(/^0+/,'')) - Number(a.replace(/^0+/,'')))
              levels.forEach((lvl) => { opts.push({ name: `color/gray/${lvl}`, label: `Gray ${lvl}` }) })
              return opts
            })()}
            shadowColorControl={shadowColorControl}
            setShadowColorControl={setShadowColorControl}
            updateElevationControl={updateElevationControl}
            onClose={() => setSelectedLevels(new Set())}
          />
        )}
      </div>
    </div>
  )
}


