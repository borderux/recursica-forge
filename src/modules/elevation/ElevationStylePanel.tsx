import React from 'react'

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
  updateElevationControl,
  onClose,
}: {
  selectedLevels: Set<number>
  elevationControls: Record<string, ElevationControl>
  availableSizeTokens: SizeToken[]
  availableOpacityTokens: OpacityToken[]
  neutralColorOptions: Array<{ name: string; label: string }>
  shadowColorControl: { alphaToken: string; colorToken: string }
  setShadowColorControl: (updater: (prev: { alphaToken: string; colorToken: string }) => { alphaToken: string; colorToken: string }) => void
  updateElevationControl: (elevation: string, property: 'blurToken' | 'spreadToken' | 'offsetXToken' | 'offsetYToken', value: string) => void
  onClose: () => void
}) {
  const levelsArr = React.useMemo(() => Array.from(selectedLevels), [selectedLevels])

  const valueOrMultiple = (getter: (c: ElevationControl) => string | undefined): string => {
    if (levelsArr.length === 0) return ''
    const first = getter(elevationControls[`elevation-${levelsArr[0]}`]!) || ''
    const allSame = levelsArr.every((lvl) => getter(elevationControls[`elevation-${lvl}`]!) === first)
    return allSame ? first : ''
  }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(260px, 28vw, 440px)', background: 'var(--layer-layer-0-property-surface)', borderLeft: '1px solid var(--layer-layer-1-property-border-color)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', zIndex: 1000, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Edit Elevation Styles</div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="control-group">
          <label>Blur</label>
          <select value={valueOrMultiple((c) => c.blurToken)} onChange={(e) => {
            const token = e.currentTarget.value
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'blurToken', token))
          }}>
            <option value="" disabled>(multiple)</option>
            {availableSizeTokens.map((opt) => (
              <option key={opt.name} value={opt.name}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Spread</label>
          <select value={valueOrMultiple((c) => c.spreadToken)} onChange={(e) => {
            const token = e.currentTarget.value
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'spreadToken', token))
          }}>
            <option value="" disabled>(multiple)</option>
            {availableSizeTokens.map((opt) => (
              <option key={opt.name} value={opt.name}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Offset X</label>
          <select value={valueOrMultiple((c) => c.offsetXToken)} onChange={(e) => {
            const token = e.currentTarget.value
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetXToken', token))
          }}>
            <option value="" disabled>(multiple)</option>
            {availableSizeTokens.map((opt) => (
              <option key={opt.name} value={opt.name}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Offset Y</label>
          <select value={valueOrMultiple((c) => c.offsetYToken)} onChange={(e) => {
            const token = e.currentTarget.value
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetYToken', token))
          }}>
            <option value="" disabled>(multiple)</option>
            {availableSizeTokens.map((opt) => (
              <option key={opt.name} value={opt.name}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Alpha</label>
          <select value={shadowColorControl.alphaToken} onChange={(e) => setShadowColorControl((prev) => ({ ...prev, alphaToken: e.currentTarget.value }))}>
            {availableOpacityTokens.map((opt) => (
              <option key={opt.name} value={opt.name}>{opt.label} ({opt.value}%)</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Color (Neutral)</label>
          <select value={shadowColorControl.colorToken} onChange={(e) => setShadowColorControl((prev) => ({ ...prev, colorToken: e.currentTarget.value }))}>
            {neutralColorOptions.map((o) => (
              <option key={o.name} value={o.name}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}


