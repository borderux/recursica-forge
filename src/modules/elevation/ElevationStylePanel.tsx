import React from 'react'
import PaletteColorControl from '../forms/PaletteColorControl'
import TokenSlider from '../forms/TokenSlider'
import NumericSlider from '../forms/NumericSlider'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'

type SizeToken = { name: string; value: number; label: string }
type OpacityToken = { name: string; value: number; label: string }

export type ElevationControl = {
  blur: number
  spread: number
  offsetX: number
  offsetY: number
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
  updateElevationControl: (elevation: string, property: 'blur' | 'spread' | 'offsetX' | 'offsetY', value: number) => void
  getDirectionForLevel: (elevationKey: string) => { x: 'left' | 'right'; y: 'up' | 'down' }
  setXDirectionForSelected: (dir: 'left' | 'right') => void
  setYDirectionForSelected: (dir: 'up' | 'down') => void
  revertSelected: (levels: Set<number>) => void
  getAlphaTokenForLevel: (elevationKey: string) => string
  setElevationAlphaToken: (elevationKey: string, token: string) => void
  onClose: () => void
}) {
  const levelsArr = React.useMemo(() => Array.from(selectedLevels), [selectedLevels])
  const { mode } = useThemeMode()
  const { tokens: tokensJson, updateToken } = useVars()

  const getShadowColorCssVar = React.useCallback((level: number): string => {
    return `--recursica-brand-themes-${mode}-elevations-elevation-${level}-shadow-color`
  }, [mode])

  const getTokenLabel = React.useCallback((tokenName: string, tokens: Array<{ name: string; label: string }>): string => {
    const token = tokens.find((t) => t.name === tokenName)
    return token?.label || tokenName.split('/').pop() || tokenName
  }, [])

  // Get current opacity value (0-1) from token and convert to 0-100 for display
  const getCurrentOpacityValue = React.useCallback((elevationKey: string): number => {
    const alphaTokenName = getAlphaTokenForLevel(elevationKey)
    if (!alphaTokenName) return 0
    
    // Extract token key from "opacity/veiled" format
    const tokenKey = alphaTokenName.replace('opacity/', '')
    
    // Read token value from tokens.json
    try {
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      const opacityRoot: any = tokensRoot?.opacities || tokensRoot?.opacity || {}
      const tokenValue = opacityRoot[tokenKey]?.$value
      
      if (tokenValue != null) {
        const num = typeof tokenValue === 'number' ? tokenValue : Number(tokenValue)
        if (Number.isFinite(num)) {
          // Normalize to 0-1 range if needed, then convert to 0-100
          const normalized = num <= 1 ? num : num / 100
          return Math.round(normalized * 100)
        }
      }
    } catch {}
    
    return 0
  }, [tokensJson, getAlphaTokenForLevel])

  // Update opacity token value (convert 0-100 to 0-1)
  const handleOpacityChange = React.useCallback((value: number) => {
    levelsArr.forEach((lvl) => {
      const elevationKey = `elevation-${lvl}`
      const alphaTokenName = getAlphaTokenForLevel(elevationKey)
      if (!alphaTokenName) return
      
      // Extract token key from "opacity/veiled" format
      const tokenKey = alphaTokenName.replace('opacity/', '')
      
      // Convert 0-100 to 0-1
      const normalizedValue = value / 100
      
      // Update the token value
      updateToken(alphaTokenName, normalizedValue)
    })
  }, [levelsArr, getAlphaTokenForLevel, updateToken])

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(260px, 28vw, 440px)', background: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`, borderLeft: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-3-shadow-color)`, zIndex: 10000, padding: 12, overflowY: 'auto' }}>
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
        <NumericSlider
          label="Blur"
          value={levelsArr.length ? (elevationControls[`elevation-${levelsArr[0]}`]?.blur ?? 0) : 0}
          onChange={(value) => {
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'blur', value))
          }}
          min={0}
          max={200}
          step={1}
          unit="px"
        />

        <NumericSlider
          label="Spread"
          value={levelsArr.length ? (elevationControls[`elevation-${levelsArr[0]}`]?.spread ?? 0) : 0}
          onChange={(value) => {
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'spread', value))
          }}
          min={0}
          max={200}
          step={1}
          unit="px"
        />

        {(() => {
          const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
          const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
          const dir = firstKey ? getDirectionForLevel(firstKey).x : 'right'
          // Convert absolute value with direction to signed value
          const absValue = Math.abs(firstCtrl?.offsetX ?? 0)
          const signedValue = dir === 'right' ? absValue : -absValue
          return (
            <NumericSlider
              label="Offset X"
              value={signedValue}
              onChange={(value) => {
                // Store as absolute value, but we'll need to update direction logic
                // For now, store the signed value directly
                levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetX', value))
              }}
              min={-50}
              max={50}
              step={1}
              unit="px"
            />
          )
        })()}

        {(() => {
          const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
          const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
          const dir = firstKey ? getDirectionForLevel(firstKey).y : 'down'
          // Convert absolute value with direction to signed value
          const absValue = Math.abs(firstCtrl?.offsetY ?? 0)
          const signedValue = dir === 'down' ? absValue : -absValue
          return (
            <NumericSlider
              label="Offset Y"
              value={signedValue}
              onChange={(value) => {
                // Store as absolute value, but we'll need to update direction logic
                // For now, store the signed value directly
                levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetY', value))
              }}
              min={-50}
              max={50}
              step={1}
              unit="px"
            />
          )
        })()}

        {(() => {
          // Get current opacity value - use first selected level or fallback to shadowColorControl
          const currentOpacityValue = levelsArr.length 
            ? getCurrentOpacityValue(`elevation-${levelsArr[0]}`)
            : (() => {
                // Fallback: read from shadowColorControl.alphaToken
                const tokenKey = shadowColorControl.alphaToken.replace('opacity/', '')
                try {
                  const tokensRoot: any = (tokensJson as any)?.tokens || {}
                  const opacityRoot: any = tokensRoot?.opacities || tokensRoot?.opacity || {}
                  const tokenValue = opacityRoot[tokenKey]?.$value
                  if (tokenValue != null) {
                    const num = typeof tokenValue === 'number' ? tokenValue : Number(tokenValue)
                    if (Number.isFinite(num)) {
                      const normalized = num <= 1 ? num : num / 100
                      return Math.round(normalized * 100)
                    }
                  }
                } catch {}
                return 0
              })()
          
          return (
            <NumericSlider
              label="Opacity"
              value={currentOpacityValue}
              onChange={handleOpacityChange}
              min={0}
              max={100}
              step={1}
              unit="%"
            />
          )
        })()}
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
            style={{ padding: '8px 10px', border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
          >
            Revert
          </button>
        </div>
      </div>
    </div>
  )
}


