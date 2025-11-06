import '../theme/index.css'
import LayerModule from './LayerModule'
import LayerStylePanel from './LayerStylePanel'
import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import ElevationModule from '../elevation/ElevationModule'
import ElevationStylePanel from '../elevation/ElevationStylePanel'

export default function LayersPage() {
  const { tokens: tokensJson, theme, setTheme, elevation, setElevation } = useVars()
  const [selectedLayerLevels, setSelectedLayerLevels] = useState<Set<number>>(() => new Set())
  const { theme: themeJson } = useVars()
  const [blurScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('blur-scale-by-default'); return v === null ? true : v === 'true' })
  const [spreadScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('spread-scale-by-default'); return v === null ? false : v === 'true' })
  const [offsetXScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('offset-x-scale-by-default'); return v === null ? false : v === 'true' })
  const [offsetYScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('offset-y-scale-by-default'); return v === null ? false : v === 'true' })
  const [xDirection, setXDirection] = useState<'left' | 'right'>(() => (elevation?.baseXDirection || 'right'))
  const [yDirection, setYDirection] = useState<'up' | 'down'>(() => (elevation?.baseYDirection || 'down'))
  const [elevationDirections, setElevationDirections] = useState<Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }>>(() => elevation?.directions || ({} as any))
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(() => new Set<number>())
  const [shadowColorControl, setShadowColorControl] = useState<{ colorToken: string; alphaToken: string }>(() => elevation?.shadowColorControl || { colorToken: 'color/gray/900', alphaToken: 'opacity/veiled' })
  const [elevationColorTokens, setElevationColorTokens] = useState<Record<string, string>>(() => elevation?.colorTokens || {})
  const [elevationPaletteSelections, setElevationPaletteSelections] = useState<Record<string, { paletteKey: string; level: string }>>(() => elevation?.paletteSelections || {})
  const [elevationAlphaTokens, setElevationAlphaTokens] = useState<Record<string, string>>(() => elevation?.alphaTokens || {})
  const [elevationControls, setElevationControls] = useState<Record<string, { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }>>(() => elevation?.controls || {})
  const [sizeTokens] = useState<Record<string, number>>(() => {
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
  useEffect(() => { setElevation({ ...elevation, controls: elevationControls }) }, [elevationControls])
  useEffect(() => { setElevation({ ...elevation, shadowColorControl }) }, [shadowColorControl])
  useEffect(() => { setElevation({ ...elevation, colorTokens: elevationColorTokens }) }, [elevationColorTokens])
  useEffect(() => { setElevation({ ...elevation, paletteSelections: elevationPaletteSelections }) }, [elevationPaletteSelections])
  useEffect(() => { setElevation({ ...elevation, alphaTokens: elevationAlphaTokens }) }, [elevationAlphaTokens])
  useEffect(() => { setElevation({ ...elevation, baseXDirection: xDirection }) }, [xDirection])
  useEffect(() => { setElevation({ ...elevation, baseYDirection: yDirection }) }, [yDirection])
  useEffect(() => { setElevation({ ...elevation, directions: elevationDirections }) }, [elevationDirections])
  useEffect(() => {
    try {
      const lsHasAny = (
        localStorage.getItem('elevation-controls') ||
        localStorage.getItem('elevation-color-tokens') ||
        localStorage.getItem('elevation-alpha-tokens') ||
        localStorage.getItem('elevation-palette-selections')
      )
      if (lsHasAny) return
    } catch {}
    try {
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
      const nextCtrls: Record<string, { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }> = {}
      for (let i = 0; i <= 4; i++) {
        const node: any = light[`elevation-${i}`]?.['$value'] || {}
        nextCtrls[`elevation-${i}`] = {
          blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
          spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
          offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
          offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
        }
      }
      setElevationControls(nextCtrls)
      setElevationColorTokens({})
      setElevationAlphaTokens({})
      setElevationPaletteSelections({})
      const baseX = Number((light['elevation-1']?.['$value']?.['x-direction']?.['$value'] ?? 1))
      const baseY = Number((light['elevation-1']?.['$value']?.['y-direction']?.['$value'] ?? 1))
      setXDirection(baseX >= 0 ? 'right' : 'left')
      setYDirection(baseY >= 0 ? 'down' : 'up')
      const dirRec: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }> = {}
      for (let i = 1; i <= 4; i += 1) {
        const node: any = light[`elevation-${i}`]?.['$value'] || {}
        const xraw = Number((node?.['x-direction']?.['$value'] ?? baseX))
        const yraw = Number((node?.['y-direction']?.['$value'] ?? baseY))
        dirRec[`elevation-${i}`] = { x: xraw >= 0 ? 'right' : 'left', y: yraw >= 0 ? 'down' : 'up' }
      }
      setElevationDirections(dirRec)
      const parseOpacity = (s?: any) => {
        const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
        if (!v) return 'opacity/veiled'
        const inner = v.startsWith('{') ? v.slice(1, -1) : v
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
        return 'opacity/veiled'
      }
      const parseColorToken = (s?: any) => {
        const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
        if (!v) return 'color/gray/900'
        const inner = v.startsWith('{') ? v.slice(1, -1) : v
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'color' && parts[2] && parts[3]) return `color/${parts[2]}/${parts[3]}`
        const idx = parts.findIndex((p) => p === 'palettes')
        if (idx >= 0) {
          const paletteKey = parts[idx + 1]
          const shade = parts[idx + 2]
          const map: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
          const family = map[paletteKey] || 'gray'
          const defaultLevelMap: Record<string, string> = { neutral: '200', 'palette-1': '400', 'palette-2': '400' }
          const level = shade === 'default' ? (defaultLevelMap[paletteKey] || '500') : shade
          if (family && level) return `color/${family}/${level}`
        }
        return 'color/gray/900'
      }
      const baseNode: any = light['elevation-1']?.['$value'] || {}
      setShadowColorControl({ colorToken: parseColorToken(baseNode?.color), alphaToken: parseOpacity(baseNode?.opacity) })
      setSelectedLevels(new Set<number>())
    } catch {}
  }, [themeJson])
  const updateElevationControl = (elevation: string, property: 'blurToken' | 'spreadToken' | 'offsetXToken' | 'offsetYToken', value: string) => {
    setElevationControls(prev => ({ ...prev, [elevation]: { ...prev[elevation], [property]: value } }))
  }
  const setElevationColorToken = (elevation: string, token: string) => {
    if (elevation === 'elevation-0') return
    setElevationColorTokens((prev) => ({ ...prev, [elevation]: token }))
  }
  const setElevationPaletteSelection = (elevation: string, paletteKey: string, level: string) => {
    if (elevation === 'elevation-0') return
    setElevationPaletteSelections((prev) => ({ ...prev, [elevation]: { paletteKey, level } }))
  }
  const setElevationAlphaToken = (elevation: string, token: string) => {
    if (elevation === 'elevation-0') return
    setElevationAlphaTokens((prev) => ({ ...prev, [elevation]: token }))
  }
  const getXDirForLevel = (elevation: string): 'left' | 'right' => (elevationDirections[elevation]?.x ?? xDirection)
  const getYDirForLevel = (elevation: string): 'up' | 'down' => (elevationDirections[elevation]?.y ?? yDirection)
  const getAlphaTokenForLevel = (level: number): string => {
    const key = `elevation-${level}`
    return elevationAlphaTokens[key] || shadowColorControl.alphaToken
  }
  const getColorTokenForLevel = (elevationKey: string): string => elevationColorTokens[elevationKey] || shadowColorControl.colorToken
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
  const revertSelected = (levels: Set<number>) => {
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
    const parseColorToken = (s?: any) => {
      const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
      if (!v) return undefined
      const inner = v.startsWith('{') ? v.slice(1, -1) : v
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'color' && parts[2] && parts[3]) return `color/${parts[2]}/${parts[3]}`
      const idx = parts.findIndex((p) => p === 'palettes')
      if (idx >= 0) {
        const paletteKey = parts[idx + 1]
        const shade = parts[idx + 2]
        const map: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
        const family = map[paletteKey] || 'gray'
        const level = shade === 'default' ? '500' : shade
        return `color/${family}/${level}`
      }
      return undefined
    }
    setElevationControls((prev) => {
      const next = { ...prev }
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        next[`elevation-${lvl}`] = {
          blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
          spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
          offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
          offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
        }
      })
      return next
    })
    setElevationColorTokens((prev) => {
      const next = { ...prev }
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        const token = parseColorToken(node?.color)
        if (token) next[`elevation-${lvl}`] = token; else delete next[`elevation-${lvl}`]
      })
      return next
    })
    setElevationPaletteSelections((prev) => {
      const next = { ...prev }
      levels.forEach((lvl) => { delete next[`elevation-${lvl}`] })
      return next
    })
    setElevationAlphaTokens((prev) => {
      const next = { ...prev }
      const parseOpacityToken = (s?: any) => {
        const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
        if (!v) return undefined
        const inner = v.startsWith('{') ? v.slice(1, -1) : v
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
        return undefined
      }
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        const tok = parseOpacityToken(node?.opacity)
        if (tok) next[`elevation-${lvl}`] = tok; else delete next[`elevation-${lvl}`]
      })
      return next
    })
    setElevationDirections((prev) => {
      const next = { ...prev }
      const baseX = Number((light['elevation-1']?.['$value']?.['x-direction']?.['$value'] ?? 1))
      const baseY = Number((light['elevation-1']?.['$value']?.['y-direction']?.['$value'] ?? 1))
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        const xraw = Number((node?.['x-direction']?.['$value'] ?? baseX))
        const yraw = Number((node?.['y-direction']?.['$value'] ?? baseY))
        next[`elevation-${lvl}`] = { x: xraw >= 0 ? 'right' : 'left', y: yraw >= 0 ? 'down' : 'up' }
      })
      return next
    })
  }
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface, #ffffff)', color: 'var(--layer-layer-0-property-element-text-color, #111111)' }}>
      <div className="container-padding">
        <div className="section">
          <h2>Layers</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <LayerModule level={0} title="Layer 0 (Background)" onSelect={() => { setSelectedLevels(new Set()); setSelectedLayerLevels(new Set([0])) }} isSelected={selectedLayerLevels.has(0)}>
              <LayerModule level={1} title="Layer 1" onSelect={() => { setSelectedLevels(new Set()); setSelectedLayerLevels(new Set([1])) }} isSelected={selectedLayerLevels.has(1)}>
                <LayerModule level={2} title="Layer 2" onSelect={() => { setSelectedLevels(new Set()); setSelectedLayerLevels(new Set([2])) }} isSelected={selectedLayerLevels.has(2)}>
                  <LayerModule level={3} title="Layer 3" onSelect={() => { setSelectedLevels(new Set()); setSelectedLayerLevels(new Set([3])) }} isSelected={selectedLayerLevels.has(3)} />
                </LayerModule>
              </LayerModule>
            </LayerModule>
          </div>
        </div>
        <div className="section">
          <h2>Alternative Layers</h2>
          <div className="alt-layers-wrapper">
            <LayerModule alternativeKey="high-contrast" title="High Contrast" className="card alt-layer-card" />
            <LayerModule alternativeKey="primary-color" title="Primary Color" className="card alt-layer-card" />
            <LayerModule alternativeKey="alert" title="Alert" className="card alt-layer-card" />
            <LayerModule alternativeKey="warning" title="Warning" className="card alt-layer-card" />
            <LayerModule alternativeKey="success" title="Success" className="card alt-layer-card" />
          </div>
        </div>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Elevation</h2>
          </div>
          <div style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 32, display: 'grid', gap: 16 }}>
            <div className="elevation-grid" style={{ display: 'grid', gap: 48 }}>
              {[0,1,2,3,4].map((i) => (
                <ElevationModule
                  key={i}
                  label={i === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${i}`}
                  level={i}
                  isSelected={i === 0 ? false : selectedLevels.has(i)}
                  onToggle={i === 0 ? undefined : () => {
                    setSelectedLayerLevels(new Set())
                    setSelectedLevels(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })
                  }}
                  selectable={i > 0}
                  zIndex={i}
                />
              ))}
            </div>
          </div>
        </div>
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
            setShadowColorControl={setShadowColorControl as any}
            getColorTokenForLevel={getColorTokenForLevel}
            setElevationColorToken={setElevationColorToken}
            getPaletteForLevel={(key: string) => elevationPaletteSelections[key]}
            setPaletteForSelected={(paletteKey: string, level: string) => {
              selectedLevels.forEach((lvl) => setElevationPaletteSelection(`elevation-${lvl}`, paletteKey, level))
            }}
            getAlphaTokenForLevel={(key: string) => {
              const lvl = Number(key.replace('elevation-',''))
              return getAlphaTokenForLevel(lvl)
            }}
            setElevationAlphaToken={setElevationAlphaToken}
            updateElevationControl={updateElevationControl}
            getDirectionForLevel={(key: string) => ({ x: getXDirForLevel(key), y: getYDirForLevel(key) })}
            setXDirectionForSelected={(dir: 'left' | 'right') => {
              setElevationDirections((prev) => {
                const next = { ...prev }
                selectedLevels.forEach((lvl) => { const k = `elevation-${lvl}`; next[k] = { x: dir, y: getYDirForLevel(k) } })
                return next
              })
            }}
            setYDirectionForSelected={(dir: 'up' | 'down') => {
              setElevationDirections((prev) => {
                const next = { ...prev }
                selectedLevels.forEach((lvl) => { const k = `elevation-${lvl}`; next[k] = { x: getXDirForLevel(k), y: dir } })
                return next
              })
            }}
            revertSelected={revertSelected}
            blurScaleByDefault={blurScaleByDefault}
            spreadScaleByDefault={spreadScaleByDefault}
            offsetXScaleByDefault={offsetXScaleByDefault}
            offsetYScaleByDefault={offsetYScaleByDefault}
            onClose={() => setSelectedLevels(new Set())}
          />
        )}
        {selectedLayerLevels.size > 0 && (
          <LayerStylePanel
            open={selectedLayerLevels.size > 0}
            selectedLevels={Array.from(selectedLayerLevels).sort((a,b) => a-b)}
            theme={theme}
            onClose={() => setSelectedLayerLevels(new Set())}
            onUpdate={(updater) => {
              const t: any = theme
              const root: any = (t as any)?.brand ? (t as any) : ({ brand: t } as any)
              const nextTheme = JSON.parse(JSON.stringify(root))
              const target = nextTheme.brand || nextTheme
              const container = target?.light?.layer
              if (!container) return
              Array.from(selectedLayerLevels).forEach((lvl) => {
                const key = `layer-${lvl}`
                if (!container[key]) container[key] = {}
                container[key] = updater(container[key] || {})
              })
              setTheme(nextTheme)
            }}
          />
        )}
      </div>
    </div>
  )
}

