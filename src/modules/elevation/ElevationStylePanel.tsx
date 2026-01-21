import React from 'react'
import PaletteColorControl from '../forms/PaletteColorControl'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { iconNameToReactComponent } from '../components/iconUtils'

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
  const { tokens: tokensJson, updateToken, elevation } = useVars()

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

  // Track local slider value for immediate UI feedback
  const [localOpacityValue, setLocalOpacityValue] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const dragTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUpdatedTokenRef = React.useRef<string | null>(null)
  const lastUpdatedValueRef = React.useRef<number | null>(null)

  // Update local value when selected levels or tokens change (but not while dragging)
  React.useEffect(() => {
    if (isDragging) return // Don't update while user is dragging
    
    if (levelsArr.length > 0) {
      const elevationKey = `elevation-${levelsArr[0]}`
      const alphaTokenName = getAlphaTokenForLevel(elevationKey)
      
      // If we just updated a token, check if it matches the current token name
      // This handles the case where we created a unique token but elevation state hasn't updated yet
      if (lastUpdatedTokenRef.current && lastUpdatedValueRef.current !== null) {
        // If the token names match, use the value we set
        if (lastUpdatedTokenRef.current === alphaTokenName) {
          setLocalOpacityValue(lastUpdatedValueRef.current)
          // Clear refs after using them
          setTimeout(() => {
            lastUpdatedTokenRef.current = null
            lastUpdatedValueRef.current = null
          }, 100)
          return
        }
        // If token names don't match but we're expecting a unique token, keep the local value
        // This means elevation state hasn't updated yet to reflect the new token name
        if (lastUpdatedTokenRef.current.startsWith('opacity/elevation-')) {
          // Keep the current local value until elevation state updates
          return
        }
      }
      
      const currentValue = getCurrentOpacityValue(elevationKey)
      // Only update if we got a valid value (not 0 unless it's actually 0)
      if (currentValue !== 0 || localOpacityValue === 0 || localOpacityValue === null) {
        setLocalOpacityValue(currentValue)
      }
    } else {
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
            setLocalOpacityValue(Math.round(normalized * 100))
          }
        }
      } catch {}
    }
  }, [levelsArr, tokensJson, getCurrentOpacityValue, shadowColorControl.alphaToken, isDragging, getAlphaTokenForLevel, localOpacityValue])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }
  }, [])

  // Update opacity token value (convert 0-100 to 0-1)
  // Ensure each selected elevation has its own unique opacity token
  const handleOpacityChange = React.useCallback((value: number) => {
    // Update local state immediately for UI feedback
    setLocalOpacityValue(value)
    setIsDragging(true)
    
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
    
    // Convert 0-100 to 0-1
    const normalizedValue = value / 100
    
    // Track the final token name and value for the first selected elevation
    let finalTokenName: string | null = null
    
    // For each selected elevation, ensure it has its own unique opacity token
    levelsArr.forEach((lvl) => {
      const elevationKey = `elevation-${lvl}`
      let alphaTokenName = getAlphaTokenForLevel(elevationKey)
      
      // Check if this elevation shares a token with other elevations
      // If it's using the shared shadowColorControl token or a fallback, create a unique one
      const isSharedToken = !elevation?.alphaTokens?.[elevationKey] || 
                           alphaTokenName === elevation?.shadowColorControl?.alphaToken ||
                           alphaTokenName === 'opacity/veiled'
      
      if (isSharedToken) {
        // Create a unique token name for this elevation
        const uniqueTokenName = `opacity/elevation-${lvl}`
        alphaTokenName = uniqueTokenName
        
        // Get current value from shared token to initialize the new unique token
        let initialValue = normalizedValue
        try {
          const tokensRoot: any = (tokensJson as any)?.tokens || {}
          const opacityRoot: any = tokensRoot?.opacities || tokensRoot?.opacity || {}
          const currentSharedToken = elevation?.shadowColorControl?.alphaToken || 'opacity/veiled'
          const sharedTokenKey = currentSharedToken.replace('opacity/', '')
          const sharedValue = opacityRoot[sharedTokenKey]?.$value
          if (sharedValue != null) {
            const num = typeof sharedValue === 'number' ? sharedValue : Number(sharedValue)
            if (Number.isFinite(num)) {
              initialValue = num <= 1 ? num : num / 100
            }
          }
        } catch {}
        
        // Create the unique token with the new value (updateToken will create it if it doesn't exist)
        updateToken(uniqueTokenName, normalizedValue)
        
        // Set the unique token for this elevation
        setElevationAlphaToken(elevationKey, uniqueTokenName)
      } else {
        // Update the existing token value
        updateToken(alphaTokenName, normalizedValue)
      }
      
      // Track the final token name for the first selected elevation
      if (lvl === levelsArr[0]) {
        finalTokenName = alphaTokenName
      }
    })
    
    // Track the token and value we just updated
    if (finalTokenName) {
      lastUpdatedTokenRef.current = finalTokenName
      lastUpdatedValueRef.current = value
    }
    
    // Reset dragging flag after a delay to allow token updates to propagate
    // Use a longer delay to ensure token updates have completed
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false)
      // Keep the refs for a bit longer to ensure useEffect can use them
      setTimeout(() => {
        lastUpdatedTokenRef.current = null
        lastUpdatedValueRef.current = null
      }, 300)
    }, 600)
  }, [levelsArr, getAlphaTokenForLevel, updateToken, setElevationAlphaToken, elevation, tokensJson])

  const CloseIcon = iconNameToReactComponent('x-mark')
  
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '320px', background: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-surface)`, borderLeft: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-color)`, boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-3-shadow-color)`, zIndex: 10000, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
          fontSize: 'var(--recursica-brand-typography-h2-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
          color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
        }}>
          {(() => {
            if (levelsArr.length === 0) return 'Elevation'
            if (levelsArr.length === 1) return `Elevation ${levelsArr[0]}`
            const list = levelsArr.slice().sort((a,b) => a-b).join(', ')
            return `Elevations ${list}`
          })()}
        </h2>
        <Button 
          onClick={onClose} 
          variant="text" 
          layer="layer-2" 
          aria-label="Close"
          icon={CloseIcon ? <CloseIcon /> : undefined}
        />
      </div>
      <div style={{ display: 'grid', gap: 'var(--recursica-ui-kit-globals-form-properties-vertical-item-gap)' }}>
        <Slider
          value={levelsArr.length ? (elevationControls[`elevation-${levelsArr[0]}`]?.blur ?? 0) : 0}
          onChange={(val) => {
            const value = typeof val === 'number' ? val : val[0]
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'blur', value))
          }}
          min={0}
          max={200}
          step={1}
          layer="layer-3"
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${val}px`}
          label={<Label layer="layer-3" layout="stacked">Blur</Label>}
        />

        <Slider
          value={levelsArr.length ? (elevationControls[`elevation-${levelsArr[0]}`]?.spread ?? 0) : 0}
          onChange={(val) => {
            const value = typeof val === 'number' ? val : val[0]
            levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'spread', value))
          }}
          min={0}
          max={200}
          step={1}
          layer="layer-3"
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${val}px`}
          label={<Label layer="layer-3" layout="stacked">Spread</Label>}
        />

        {(() => {
          const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
          const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
          const dir = firstKey ? getDirectionForLevel(firstKey).x : 'right'
          // Convert absolute value with direction to signed value
          const absValue = Math.abs(firstCtrl?.offsetX ?? 0)
          const signedValue = dir === 'right' ? absValue : -absValue
          return (
            <Slider
              value={signedValue}
              onChange={(val) => {
                const value = typeof val === 'number' ? val : val[0]
                levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetX', value))
              }}
              min={-50}
              max={50}
              step={1}
              layer="layer-3"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              valueLabel={(val) => `${val}px`}
              label={<Label layer="layer-3" layout="stacked">Offset X</Label>}
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
            <Slider
              value={signedValue}
              onChange={(val) => {
                const value = typeof val === 'number' ? val : val[0]
                levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetY', value))
              }}
              min={-50}
              max={50}
              step={1}
              layer="layer-3"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              valueLabel={(val) => `${val}px`}
              label={<Label layer="layer-3" layout="stacked">Offset Y</Label>}
            />
          )
        })()}

        {(() => {
          // Use local state if available, otherwise compute from tokens
          const currentOpacityValue = localOpacityValue !== null 
            ? localOpacityValue
            : (levelsArr.length 
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
                  })())
          
          return (
            <Slider
              value={currentOpacityValue}
              onChange={(val) => {
                const value = typeof val === 'number' ? val : val[0]
                handleOpacityChange(value)
              }}
              min={0}
              max={100}
              step={1}
              layer="layer-3"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              valueLabel={(val) => `${val}%`}
              label={<Label layer="layer-3" layout="stacked">Opacity</Label>}
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
          <Button
            onClick={() => revertSelected(selectedLevels)}
            variant="outline"
            layer="layer-2"
          >
            Revert
          </Button>
        </div>
      </div>
    </div>
  )
}


