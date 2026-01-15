import '../theme/index.css'
import LayerModule from './LayerModule'
import LayerStylePanel from './LayerStylePanel'
import { useMemo, useState, useEffect } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ElevationModule from '../elevation/ElevationModule'
import ElevationStylePanel from '../elevation/ElevationStylePanel'
import { removeCssVar } from '../../core/css/updateCssVar'
import { parseTokenReference } from '../../core/utils/tokenReferenceParser'

export default function LayersPage() {
  const { tokens: tokensJson, theme, setTheme, elevation, updateElevation, updateToken } = useVars()
  const { mode } = useThemeMode()
  const [selectedLayerLevels, setSelectedLayerLevels] = useState<Set<number>>(() => new Set())
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(() => new Set<number>())

  // Close panels when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setSelectedLayerLevels(new Set())
      setSelectedLevels(new Set())
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])

  // Extract token lists for UI (values are resolved via CSS vars)
  const availableSizeTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          const baseLabel = k.replace('-', '.')
          const label = baseLabel === 'none' ? 'None' : baseLabel === 'default' ? 'Default' : baseLabel.endsWith('x') ? baseLabel : `${baseLabel}x`
          tokens.push({ name: `size/${k}`, value: num, label })
        }
      })
    } catch {}
    return tokens.sort((a, b) => a.value - b.value)
  }, [tokensJson])

  const availableOpacityTokens = useMemo(() => {
    const out: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          out.push({ name: `opacity/${k}`, value: num, label: k.charAt(0).toUpperCase() + k.slice(1) })
        }
      })
    } catch {}
    return out.sort((a, b) => a.value - b.value)
  }, [tokensJson])

  // Helper functions that update elevation state directly
  const updateElevationControl = (elevationKey: string, property: 'blur' | 'spread' | 'offsetX' | 'offsetY', value: number) => {
    updateElevation((prev) => {
      const next = { ...prev }
      
      // Get token name for this elevation and property
      const level = elevationKey.replace('elevation-', '')
      let tokenName: string | null = null
      let finalValue = value
      
      // For offsetX and offsetY, convert signed values to absolute + direction
      if (property === 'offsetX') {
        const absValue = Math.abs(value)
        const direction = value >= 0 ? 'right' : 'left'
        finalValue = absValue
        next.controls = {
          ...next.controls,
          [elevationKey]: { ...next.controls[elevationKey], offsetX: absValue }
        }
        // Update direction
        const currentY = next.directions[elevationKey]?.y ?? getYDirForLevel(elevationKey)
        next.directions = { ...next.directions, [elevationKey]: { x: direction, y: currentY } }
        tokenName = next.offsetXTokens[elevationKey] || `size/elevation-${level}-offset-x`
      } else if (property === 'offsetY') {
        const absValue = Math.abs(value)
        const direction = value >= 0 ? 'down' : 'up'
        finalValue = absValue
        next.controls = {
          ...next.controls,
          [elevationKey]: { ...next.controls[elevationKey], offsetY: absValue }
        }
        // Update direction
        const currentX = next.directions[elevationKey]?.x ?? getXDirForLevel(elevationKey)
        next.directions = { ...next.directions, [elevationKey]: { x: currentX, y: direction } }
        tokenName = next.offsetYTokens[elevationKey] || `size/elevation-${level}-offset-y`
      } else if (property === 'blur') {
        next.controls = {
          ...next.controls,
          [elevationKey]: { ...next.controls[elevationKey], blur: value }
        }
        tokenName = next.blurTokens[elevationKey] || `size/elevation-${level}-blur`
      } else if (property === 'spread') {
        next.controls = {
          ...next.controls,
          [elevationKey]: { ...next.controls[elevationKey], spread: value }
        }
        tokenName = next.spreadTokens[elevationKey] || `size/elevation-${level}-spread`
      }
      
      // Update the token if we have a token name
      if (tokenName) {
        updateToken(tokenName, finalValue)
      }
      
      return next
    })
  }

  const setElevationAlphaToken = (elevationKey: string, token: string) => {
    if (elevationKey === 'elevation-0') return
    updateElevation((prev) => ({
      ...prev,
      alphaTokens: { ...prev.alphaTokens, [elevationKey]: token }
    }))
  }

  const getXDirForLevel = (elevationKey: string): 'left' | 'right' => 
    elevation?.directions[elevationKey]?.x ?? elevation?.baseXDirection ?? 'right'
  
  const getYDirForLevel = (elevationKey: string): 'up' | 'down' => 
    elevation?.directions[elevationKey]?.y ?? elevation?.baseYDirection ?? 'down'
  
  const getAlphaTokenForLevel = (level: number): string => {
    const key = `elevation-${level}`
    return elevation?.alphaTokens[key] || elevation?.shadowColorControl?.alphaToken || 'opacity/veiled'
  }

  // Revert selected levels to theme defaults
  const revertSelected = (levels: Set<number>) => {
    const brand: any = (theme as any)?.brand || (theme as any)
    const themes = brand?.themes || brand
    const light: any = themes?.[mode]?.elevations || brand?.[mode]?.elevations || {}
    
    const toNumeric = (ref?: any): number => {
      // Handle new structure: { $value: { value: number, unit: "px" }, $type: "number" }
      if (ref && typeof ref === 'object' && '$value' in ref) {
        const val = ref.$value
        if (val && typeof val === 'object' && 'value' in val) {
          return typeof val.value === 'number' ? val.value : Number(val.value) || 0
        }
        // Fallback: try to parse as number directly
        if (typeof val === 'number') return val
        if (typeof val === 'string') {
          const num = Number(val)
          return Number.isFinite(num) ? num : 0
        }
      }
      // Handle old structure: direct number or string
      if (typeof ref === 'number') return ref
      if (typeof ref === 'string') {
        const num = Number(ref)
        return Number.isFinite(num) ? num : 0
      }
      return 0
    }

    const parseColorToken = (s?: any): string | undefined => {
      const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
      if (!v) return undefined
      const parsed = parseTokenReference(v, {})
      if (parsed && parsed.type === 'token' && parsed.path[0] === 'color' && parsed.path.length >= 3) {
        return `color/${parsed.path[1]}/${parsed.path[2]}`
      }
      return undefined
    }

    const parseOpacityToken = (s?: any): string | undefined => {
      const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
      if (!v) return undefined
      const parsed = parseTokenReference(v, {})
      if (parsed && parsed.type === 'token' && parsed.path[0] === 'opacity' && parsed.path.length >= 2) {
        return `opacity/${parsed.path[1]}`
      }
      return undefined
    }

    updateElevation((prev) => {
      const next = { ...prev }
      const baseX = Number((light['elevation-1']?.['$value']?.['x-direction']?.['$value'] ?? 1))
      const baseY = Number((light['elevation-1']?.['$value']?.['y-direction']?.['$value'] ?? 1))

      levels.forEach((lvl) => {
        const key = `elevation-${lvl}`
        const node: any = light[key]?.['$value'] || {}
        
        // Get default values from theme
        const defaultBlur = toNumeric(node?.blur)
        const defaultSpread = toNumeric(node?.spread)
        const defaultOffsetX = toNumeric(node?.x)
        const defaultOffsetY = toNumeric(node?.y)
        
        // Update controls
        next.controls = { ...next.controls, [key]: {
          blur: defaultBlur,
          spread: defaultSpread,
          offsetX: defaultOffsetX,
          offsetY: defaultOffsetY,
        }}

        // Update token values in tokens.json to match theme defaults
        // Get token names from elevation state (or use defaults)
        const blurTokenName = next.blurTokens[key] || `size/elevation-${lvl}-blur`
        const spreadTokenName = next.spreadTokens[key] || `size/elevation-${lvl}-spread`
        const offsetXTokenName = next.offsetXTokens[key] || `size/elevation-${lvl}-offset-x`
        const offsetYTokenName = next.offsetYTokens[key] || `size/elevation-${lvl}-offset-y`
        
        // Update the actual token values
        updateToken(blurTokenName, defaultBlur)
        updateToken(spreadTokenName, defaultSpread)
        updateToken(offsetXTokenName, defaultOffsetX)
        updateToken(offsetYTokenName, defaultOffsetY)

        // Update color tokens
        const colorToken = parseColorToken(node?.color)
        if (colorToken) {
          next.colorTokens = { ...next.colorTokens, [key]: colorToken }
        } else {
          const { [key]: _, ...rest } = next.colorTokens
          next.colorTokens = rest
        }

        // Remove palette selections
        const { [key]: __, ...paletteRest } = next.paletteSelections
        next.paletteSelections = paletteRest

        // Clear shadow color CSS variable to reset to default
        const shadowColorCssVar = `--recursica-brand-themes-${mode}-elevations-elevation-${lvl}-shadow-color`
        removeCssVar(shadowColorCssVar)

        // Update alpha tokens
        const alphaToken = parseOpacityToken(node?.opacity)
        if (alphaToken) {
          next.alphaTokens = { ...next.alphaTokens, [key]: alphaToken }
          
          // Also revert the opacity token value if it exists
          try {
            const tokensRoot: any = (tokensJson as any)?.tokens || {}
            const opacityRoot: any = tokensRoot?.opacities || tokensRoot?.opacity || {}
            const tokenKey = alphaToken.replace('opacity/', '')
            const defaultOpacityValue = opacityRoot[tokenKey]?.$value
            if (defaultOpacityValue != null) {
              // If there's a unique elevation opacity token, revert it to the default
              const uniqueTokenName = `opacity/elevation-${lvl}`
              const uniqueTokenKey = `elevation-${lvl}`
              if (opacityRoot[uniqueTokenKey]) {
                updateToken(uniqueTokenName, defaultOpacityValue)
              }
            }
          } catch {}
        } else {
          const { [key]: ___, ...alphaRest } = next.alphaTokens
          next.alphaTokens = alphaRest
        }

        // Update directions
        const xraw = Number((node?.['x-direction']?.['$value'] ?? baseX))
        const yraw = Number((node?.['y-direction']?.['$value'] ?? baseY))
        next.directions = { ...next.directions, [key]: { 
          x: xraw >= 0 ? 'right' : 'left', 
          y: yraw >= 0 ? 'down' : 'up' 
        }}
      })

      return next
    })
  }
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)` }}>
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
        {selectedLevels.size > 0 && elevation && (
          <ElevationStylePanel
            selectedLevels={selectedLevels}
            elevationControls={elevation.controls}
            availableSizeTokens={availableSizeTokens}
            availableOpacityTokens={availableOpacityTokens}
            shadowColorControl={elevation.shadowColorControl}
            getAlphaTokenForLevel={(key: string) => {
              const lvl = Number(key.replace('elevation-',''))
              return getAlphaTokenForLevel(lvl)
            }}
            setElevationAlphaToken={setElevationAlphaToken}
            updateElevationControl={updateElevationControl}
            getDirectionForLevel={(key: string) => ({ x: getXDirForLevel(key), y: getYDirForLevel(key) })}
            setXDirectionForSelected={(dir: 'left' | 'right') => {
              updateElevation((prev) => {
                const next = { ...prev }
                selectedLevels.forEach((lvl) => {
                  const k = `elevation-${lvl}`
                  next.directions = { ...next.directions, [k]: { x: dir, y: getYDirForLevel(k) } }
                })
                return next
              })
            }}
            setYDirectionForSelected={(dir: 'up' | 'down') => {
              updateElevation((prev) => {
                const next = { ...prev }
                selectedLevels.forEach((lvl) => {
                  const k = `elevation-${lvl}`
                  next.directions = { ...next.directions, [k]: { x: getXDirForLevel(k), y: dir } }
                })
                return next
              })
            }}
            revertSelected={revertSelected}
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
              // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
              const themes = target?.themes || target
              const container = themes?.[mode]?.layers || themes?.[mode]?.layer || target?.[mode]?.layers || target?.[mode]?.layer
              if (!container) {
                // Create the structure if it doesn't exist
                if (!themes[mode]) themes[mode] = {}
                if (!themes[mode].layers) themes[mode].layers = {}
                const newContainer = themes[mode].layers
                Array.from(selectedLayerLevels).forEach((lvl) => {
                  const key = `layer-${lvl}`
                  if (!newContainer[key]) newContainer[key] = {}
                  newContainer[key] = updater(newContainer[key] || {})
                })
              } else {
                Array.from(selectedLayerLevels).forEach((lvl) => {
                  const key = `layer-${lvl}`
                  if (!container[key]) container[key] = {}
                  container[key] = updater(container[key] || {})
                })
              }
              setTheme(nextTheme)
            }}
          />
        )}
      </div>
    </div>
  )
}

