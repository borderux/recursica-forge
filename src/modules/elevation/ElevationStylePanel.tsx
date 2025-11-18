import React from 'react'
import PaletteColorControl from '../forms/PaletteColorControl'
import TokenSlider from '../forms/TokenSlider'

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
  shadowColorControl,
  updateElevationControl,
  getDirectionForLevel,
  setXDirectionForSelected,
  setYDirectionForSelected,
  revertSelected,
  getAlphaTokenForLevel,
  setElevationAlphaToken,
  onClose,
}: {
  selectedLevels: Set<number>
  elevationControls: Record<string, ElevationControl>
  availableSizeTokens: SizeToken[]
  availableOpacityTokens: OpacityToken[]
  shadowColorControl: { alphaToken: string; colorToken: string }
  updateElevationControl: (elevation: string, property: 'blurToken' | 'spreadToken' | 'offsetXToken' | 'offsetYToken', value: string) => void
  getDirectionForLevel: (elevationKey: string) => { x: 'left' | 'right'; y: 'up' | 'down' }
  setXDirectionForSelected: (dir: 'left' | 'right') => void
  setYDirectionForSelected: (dir: 'up' | 'down') => void
  revertSelected: (levels: Set<number>) => void
  getAlphaTokenForLevel: (elevationKey: string) => string
  setElevationAlphaToken: (elevationKey: string, token: string) => void
  onClose: () => void
}) {
  const levelsArr = React.useMemo(() => Array.from(selectedLevels), [selectedLevels])

  const getShadowColorCssVar = React.useCallback((level: number): string => {
    return `--recursica-brand-light-elevations-elevation-${level}-shadow-color`
  }, [])

  const getTokenLabel = React.useCallback((tokenName: string, tokens: Array<{ name: string; label: string }>): string => {
    const token = tokens.find((t) => t.name === tokenName)
    return token?.label || tokenName.split('/').pop() || tokenName
  }, [])

  // Calculate zero index for signed sliders
  const zeroIndex = React.useMemo(() => {
    const stops = [...availableSizeTokens].sort((a, b) => a.value - b.value)
    return Math.max(0, stops.findIndex((s) => /(^|\/)none$/.test(s.name) || s.value === 0))
  }, [availableSizeTokens])

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(260px, 28vw, 440px)', background: 'var(--recursica-brand-light-layer-layer-1-property-surface)', borderLeft: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', boxShadow: 'var(--recursica-brand-light-elevations-elevation-3-shadow-color)', zIndex: 10000, padding: 12, overflowY: 'auto' }}>
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
        <TokenSlider
          label="Blur"
          tokens={availableSizeTokens}
          currentToken={levelsArr.length ? elevationControls[`elevation-${levelsArr[0]}`]?.blurToken : undefined}
          onChange={(token) => {
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'blurToken', token))
          }}
          getTokenLabel={(token) => getTokenLabel(token.name, availableSizeTokens)}
        />

        <TokenSlider
          label="Spread"
          tokens={availableSizeTokens}
          currentToken={levelsArr.length ? elevationControls[`elevation-${levelsArr[0]}`]?.spreadToken : undefined}
          onChange={(token) => {
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'spreadToken', token))
          }}
          getTokenLabel={(token) => getTokenLabel(token.name, availableSizeTokens)}
        />

        {(() => {
          const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
          const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
          const dir = firstKey ? getDirectionForLevel(firstKey).x : 'right'
          const stops = [...availableSizeTokens].sort((a, b) => a.value - b.value)
          const findIdx = (name?: string): number => {
            if (!name) return zeroIndex
            const i = stops.findIndex((s) => s.name === name)
            return i >= 0 ? i : zeroIndex
          }
          const magIdx = findIdx(firstCtrl?.offsetXToken)
          const signed = (magIdx - zeroIndex) * (dir === 'left' ? -1 : 1)
          return (
            <TokenSlider
              label="Offset X"
              tokens={availableSizeTokens}
              currentToken={firstCtrl?.offsetXToken}
              zeroIndex={zeroIndex}
              signedValue={signed}
              onChange={(token) => {
                levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetXToken', token))
              }}
              onDirectionChange={(dir) => {
                if (dir === 'left' || dir === 'right') {
                  setXDirectionForSelected(dir)
                }
              }}
              getTokenLabel={(token) => getTokenLabel(token.name, availableSizeTokens)}
              formatDisplayLabel={(label, _, signed) => signed && signed < 0 ? `-${label}` : label}
            />
          )
        })()}

        {(() => {
          const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
          const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
          const dir = firstKey ? getDirectionForLevel(firstKey).y : 'down'
          const stops = [...availableSizeTokens].sort((a, b) => a.value - b.value)
          const findIdx = (name?: string): number => {
            if (!name) return zeroIndex
            const i = stops.findIndex((s) => s.name === name)
            return i >= 0 ? i : zeroIndex
          }
          const magIdx = findIdx(firstCtrl?.offsetYToken)
          const signed = (magIdx - zeroIndex) * (dir === 'up' ? -1 : 1)
          return (
            <TokenSlider
              label="Offset Y"
              tokens={availableSizeTokens}
              currentToken={firstCtrl?.offsetYToken}
              zeroIndex={zeroIndex}
              signedValue={signed}
              onChange={(token) => {
                levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetYToken', token))
              }}
              onDirectionChange={(dir) => {
                if (dir === 'up' || dir === 'down') {
                  setYDirectionForSelected(dir)
                }
              }}
              getTokenLabel={(token) => getTokenLabel(token.name, availableSizeTokens)}
              formatDisplayLabel={(label, _, signed) => signed && signed < 0 ? `-${label}` : label}
            />
          )
        })()}

        <TokenSlider
          label="Opacity"
          tokens={availableOpacityTokens}
          currentToken={levelsArr.length ? getAlphaTokenForLevel(`elevation-${levelsArr[0]}`) : shadowColorControl.alphaToken}
          onChange={(token) => {
            levelsArr.forEach((lvl) => setElevationAlphaToken(`elevation-${lvl}`, token))
          }}
          getTokenLabel={(token) => getTokenLabel(token.name, availableOpacityTokens)}
        />
        <div className="control-group">
          <PaletteColorControl
            label="Shadow Color"
            targetCssVar={levelsArr.length > 0 ? getShadowColorCssVar(levelsArr[0]) : getShadowColorCssVar(0)}
            targetCssVars={levelsArr.length > 0 ? levelsArr.map(lvl => getShadowColorCssVar(lvl)) : undefined}
            currentValueCssVar={levelsArr.length > 0 ? getShadowColorCssVar(levelsArr[0]) : getShadowColorCssVar(0)}
            swatchSize={14}
            fontSize={13}
          />
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


