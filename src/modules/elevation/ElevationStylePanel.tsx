import React from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'

type SizeToken = { name: string; value: number; label: string }
type OpacityToken = { name: string; value: number; label: string }

export type ElevationControl = {
  blurToken: string
  spreadToken: string
  offsetXToken: string
  offsetYToken: string
}

export default function ElevationStylePanel({
  selectedLevels,
  elevationControls,
  availableSizeTokens,
  availableOpacityTokens,
  neutralColorOptions,
  shadowColorControl,
  setShadowColorControl,
  getColorTokenForLevel,
  setElevationColorToken,
  getPaletteForLevel,
  setPaletteForSelected,
  updateElevationControl,
  getDirectionForLevel,
  setXDirectionForSelected,
  setYDirectionForSelected,
  revertSelected,
  getAlphaTokenForLevel,
  setElevationAlphaToken,
  onClose,
  blurScaleByDefault,
  spreadScaleByDefault,
  offsetXScaleByDefault,
  offsetYScaleByDefault,
}: {
  selectedLevels: Set<number>
  elevationControls: Record<string, ElevationControl>
  availableSizeTokens: SizeToken[]
  availableOpacityTokens: OpacityToken[]
  neutralColorOptions: Array<{ name: string; label: string }>
  shadowColorControl: { alphaToken: string; colorToken: string }
  setShadowColorControl: (updater: (prev: { alphaToken: string; colorToken: string }) => { alphaToken: string; colorToken: string }) => void
  getColorTokenForLevel: (elevationKey: string) => string
  setElevationColorToken: (elevationKey: string, token: string) => void
  getPaletteForLevel: (elevationKey: string) => { paletteKey: string; level: string } | undefined
  setPaletteForSelected: (paletteKey: string, level: string) => void
  updateElevationControl: (elevation: string, property: 'blurToken' | 'spreadToken' | 'offsetXToken' | 'offsetYToken', value: string) => void
  getDirectionForLevel: (elevationKey: string) => { x: 'left' | 'right'; y: 'up' | 'down' }
  setXDirectionForSelected: (dir: 'left' | 'right') => void
  setYDirectionForSelected: (dir: 'up' | 'down') => void
  revertSelected: (levels: Set<number>) => void
  getAlphaTokenForLevel: (elevationKey: string) => string
  setElevationAlphaToken: (elevationKey: string, token: string) => void
  onClose: () => void
  blurScaleByDefault?: boolean
  spreadScaleByDefault?: boolean
  offsetXScaleByDefault?: boolean
  offsetYScaleByDefault?: boolean
}) {
  const levelsArr = React.useMemo(() => Array.from(selectedLevels), [selectedLevels])
  const { tokens: tokensJson } = useVars()

  const getHexForToken = React.useCallback((name?: string): string => {
    try {
      if (!name) return ''
      const ov = readOverrides()
      const ovVal = (ov as any)[name]
      if (typeof ovVal === 'string' && ovVal.trim()) return String(ovVal)
      const parts = name.split('/')
      if (parts[0] === 'color' && parts[1] && parts[2]) {
        const v = (tokensJson as any)?.tokens?.color?.[parts[1]]?.[parts[2]]?.$value
        return typeof v === 'string' ? v : ''
      }
      return ''
    } catch {
      return ''
    }
  }, [tokensJson])

  const colorBtnRef = React.useRef<HTMLButtonElement | null>(null)

  const valueOrMultiple = (getter: (c: ElevationControl) => string | undefined): string => {
    if (levelsArr.length === 0) return ''
    const first = getter(elevationControls[`elevation-${levelsArr[0]}`]!) || ''
    const allSame = levelsArr.every((lvl) => getter(elevationControls[`elevation-${lvl}`]!) === first)
    return allSame ? first : ''
  }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(260px, 28vw, 440px)', background: 'var(--layer-layer-0-property-surface, #ffffff)', borderLeft: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', zIndex: 1000, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>
          {(() => {
            if (levelsArr.length === 0) return 'Elevation'
            if (levelsArr.length === 1) return `Elevation ${levelsArr[0]}`
            const list = levelsArr.slice().sort((a,b) => a-b).join(', ')
            return `Elevations ${list}`
          })()}
        </div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {(() => {
          const stops = [...availableSizeTokens].sort((a, b) => a.value - b.value)
          const zeroIdx = Math.max(0, stops.findIndex((s) => /(^|\/)none$/.test(s.name) || s.value === 0))
          const findIdx = (name?: string): number => {
            if (!name) return 0
            const i = stops.findIndex((s) => s.name === name)
            return i >= 0 ? i : 0
          }
          // Blur slider (0..max)
          const first = levelsArr.length ? elevationControls[`elevation-${levelsArr[0]}`] : undefined
          const blurIdx = findIdx(first?.blurToken)
          return (
            <div className="control-group">
              <label>Blur</label>
              <input
                type="range"
                min={0}
                max={stops.length - 1}
                step={1}
                value={blurIdx}
                list="blur-ticks"
                onChange={(e) => {
                  const idx = Number(e.currentTarget.value)
                  const token = stops[idx]?.name || stops[0].name
                  levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'blurToken', token))
                }}
              />
              <datalist id="blur-ticks">
                {stops.map((_, i) => (<option key={i} value={i} />))}
              </datalist>
            </div>
          )
        })()}

        {(() => {
          const stops = [...availableSizeTokens].sort((a, b) => a.value - b.value)
          const findIdx = (name?: string): number => {
            if (!name) return 0
            const i = stops.findIndex((s) => s.name === name)
            return i >= 0 ? i : 0
          }
          // Spread slider (0..max)
          const first = levelsArr.length ? elevationControls[`elevation-${levelsArr[0]}`] : undefined
          const spreadIdx = findIdx(first?.spreadToken)
          return (
            <div className="control-group">
              <label>Spread</label>
              <input
                type="range"
                min={0}
                max={stops.length - 1}
                step={1}
                value={spreadIdx}
                list="spread-ticks"
                onChange={(e) => {
                  const idx = Number(e.currentTarget.value)
                  const token = stops[idx]?.name || stops[0].name
                  levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'spreadToken', token))
                }}
              />
              <datalist id="spread-ticks">
                {stops.map((_, i) => (<option key={i} value={i} />))}
              </datalist>
            </div>
          )
        })()}

        {(() => {
          const stops = [...availableSizeTokens].sort((a, b) => a.value - b.value)
          const zeroIdx = Math.max(0, stops.findIndex((s) => /(^|\/)none$/.test(s.name) || s.value === 0))
          const findIdx = (name?: string): number => {
            if (!name) return zeroIdx
            const i = stops.findIndex((s) => s.name === name)
            return i >= 0 ? i : zeroIdx
          }
          const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
          const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
          const dir = firstKey ? getDirectionForLevel(firstKey).x : 'right'
          const magIdx = findIdx(firstCtrl?.offsetXToken)
          const signed = (magIdx - zeroIdx) * (dir === 'left' ? -1 : 1)
          const min = -(stops.length - 1 - zeroIdx)
          const max = (stops.length - 1 - zeroIdx)
          return (
            <div className="control-group">
              <label>Offset X</label>
              <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={signed}
                list="offsetx-ticks"
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  const nextDir = v < 0 ? 'left' : 'right'
                  const idx = zeroIdx + Math.abs(v)
                  const token = stops[idx]?.name || stops[zeroIdx].name
                  setXDirectionForSelected(nextDir)
                  levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetXToken', token))
                }}
              />
              <datalist id="offsetx-ticks">
                {Array.from({ length: max - min + 1 }, (_, j) => min + j).map((val) => (
                  <option key={val} value={val} label={val === 0 ? '0' : undefined as any} />
                ))}
              </datalist>
              <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.7 }}>0</div>
            </div>
          )
        })()}

        {(() => {
          const stops = [...availableSizeTokens].sort((a, b) => a.value - b.value)
          const zeroIdx = Math.max(0, stops.findIndex((s) => /(^|\/)none$/.test(s.name) || s.value === 0))
          const findIdx = (name?: string): number => {
            if (!name) return zeroIdx
            const i = stops.findIndex((s) => s.name === name)
            return i >= 0 ? i : zeroIdx
          }
          const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
          const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
          const dir = firstKey ? getDirectionForLevel(firstKey).y : 'down'
          const magIdx = findIdx(firstCtrl?.offsetYToken)
          const signed = (magIdx - zeroIdx) * (dir === 'up' ? -1 : 1)
          const min = -(stops.length - 1 - zeroIdx)
          const max = (stops.length - 1 - zeroIdx)
          return (
            <div className="control-group">
              <label>Offset Y</label>
              <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={signed}
                list="offsety-ticks"
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  const nextDir = v < 0 ? 'up' : 'down'
                  const idx = zeroIdx + Math.abs(v)
                  const token = stops[idx]?.name || stops[zeroIdx].name
                  setYDirectionForSelected(nextDir)
                  levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetYToken', token))
                }}
              />
              <datalist id="offsety-ticks">
                {Array.from({ length: max - min + 1 }, (_, j) => min + j).map((val) => (
                  <option key={val} value={val} label={val === 0 ? '0' : undefined as any} />
                ))}
              </datalist>
              <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.7 }}>0</div>
            </div>
          )
        })()}
        <div className="control-group">
          <label>Opacity</label>
          <select value={(levelsArr.length ? getAlphaTokenForLevel(`elevation-${levelsArr[0]}`) : shadowColorControl.alphaToken)} onChange={(e) => {
            const token = e.currentTarget.value
            levelsArr.forEach((lvl) => setElevationAlphaToken(`elevation-${lvl}`, token))
          }}>
            {availableOpacityTokens.map((opt) => (
              <option key={opt.name} value={opt.name}>{opt.label} ({Math.round((opt.value <= 1 ? opt.value * 100 : opt.value))}%)</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Color (Palette)</label>
          <button
            ref={colorBtnRef}
            type="button"
            onClick={() => { 
              const el = colorBtnRef.current
              if (!el) return
              // Determine target CSS var(s) based on selected levels
              // For now, use the first selected level, or elevation-0 if none
              const firstLevel = levelsArr.length ? levelsArr[0] : 0
              const targetCssVar = `--recursica-brand-light-elevations-elevation-${firstLevel}-shadow-color`
              try { 
                (window as any).openPalettePicker(el, targetCssVar) 
              } catch {} 
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
          >
            {(() => {
              const key = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
              const pal = key ? getPaletteForLevel(key) : undefined
              if (pal) {
                return (
                  <>
                    <span aria-hidden style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid rgba(0,0,0,0.15)' }} />
                    <span style={{ textTransform: 'capitalize' }}>{`${pal.paletteKey} / ${pal.level}`}</span>
                  </>
                )
              }
              const token = levelsArr.length ? getColorTokenForLevel(`elevation-${levelsArr[0]}`) : shadowColorControl.colorToken
              return (<><span aria-hidden style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid rgba(0,0,0,0.15)', background: getHexForToken(token) }} /><span style={{ textTransform: 'capitalize' }}>{(token || '').replace('color/','')}</span></>)
            })()}
          </button>
          <PaletteSwatchPicker onSelect={(cssVarName) => { 
            // CSS var has already been set by PaletteSwatchPicker
            // Extract palette info from CSS var name and update state
            const match = cssVarName.match(/--recursica-brand-light-palettes-([a-z0-9-]+)-(\d+|primary)-tone/)
            if (match) {
              const [, paletteKey, level] = match
              const normalizedLevel = level === 'primary' ? 'default' : level
              setPaletteForSelected(paletteKey, normalizedLevel)
            }
          }} />
        </div>
        <div className="control-group">
          <button
            type="button"
            onClick={() => revertSelected(selectedLevels)}
            style={{ padding: '8px 10px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
          >
            Revert
          </button>
        </div>
      </div>
    </div>
  )
}


