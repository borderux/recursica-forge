import '../theme/index.css'
import { useMemo, useState, useEffect } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ElevationModule from './ElevationModule'
import ElevationStylePanel from './ElevationStylePanel'
import { removeCssVar } from '../../core/css/updateCssVar'
import { parseTokenReference } from '../../core/utils/tokenReferenceParser'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'

export default function ElevationsPage() {
  const { tokens: tokensJson, theme, elevation, updateElevation, updateToken } = useVars()
  const { mode } = useThemeMode()
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(() => new Set<number>())


  // Close panels when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
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
      Object.keys(src).filter((k) => !k.startsWith('$') && !k.startsWith('elevation-')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          const baseLabel = k.replace('-', '.')
          const label = baseLabel === 'none' ? 'None' : baseLabel === 'default' ? 'Default' : baseLabel.endsWith('x') ? baseLabel : `${baseLabel}x`
          tokens.push({ name: `size/${k}`, value: num, label })
        }
      })
    } catch { }
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
    } catch { }
    return out.sort((a, b) => a.value - b.value)
  }, [tokensJson])

  // Batched version that updates multiple elevations in a single updateElevation call
  const updateElevationControlsBatch = (elevationKeys: string[], property: 'blur' | 'spread' | 'offsetX' | 'offsetY', value: number) => {
    // Determine token names and final values BEFORE updating state
    const updates: Array<{ elevationKey: string; tokenName: string; finalValue: number; level: string }> = []

    elevationKeys.forEach((elevationKey) => {
      const level = elevationKey.replace('elevation-', '')
      let tokenName: string | null = null
      let finalValue = value

      if (property === 'offsetX') {
        finalValue = Math.abs(value)
        tokenName = elevation?.offsetXTokens[elevationKey] || `size/elevation-${level}-offset-x`
      } else if (property === 'offsetY') {
        finalValue = Math.abs(value)
        tokenName = elevation?.offsetYTokens[elevationKey] || `size/elevation-${level}-offset-y`
      } else if (property === 'blur') {
        tokenName = elevation?.blurTokens[elevationKey] || `size/elevation-${level}-blur`
      } else if (property === 'spread') {
        tokenName = elevation?.spreadTokens[elevationKey] || `size/elevation-${level}-spread`
      }

      if (tokenName) {
        updates.push({ elevationKey, tokenName, finalValue, level })
      }
    })

    // Update ALL elevations in a single updateElevation call (triggers only ONE recomputeAndApplyAll)
    // Use mode-specific controls
    updateElevation((prev) => {
      const next = { ...prev }

      // Ensure controls structure exists for both modes
      if (!next.controls.light) next.controls.light = {}
      if (!next.controls.dark) next.controls.dark = {}

      // CRITICAL: Ensure we're working with a copy of the controls object, not a reference
      // This prevents accidentally modifying the other mode's controls
      next.controls = {
        light: { ...next.controls.light },
        dark: { ...next.controls.dark }
      }

      updates.forEach(({ elevationKey, finalValue: finalVal, level: lvl }) => {
        if (property === 'offsetX') {
          const absValue = Math.abs(value)
          const direction = value >= 0 ? 'right' : 'left'
          const existingControl = next.controls[mode][elevationKey]
          const existing = existingControl ? { ...existingControl } : { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
          next.controls[mode] = {
            ...next.controls[mode],
            [elevationKey]: { ...existing, offsetX: absValue }
          }
          if (!next.directions[mode]) next.directions[mode] = {}
          const currentY = next.directions[mode][elevationKey]?.y ?? getYDirForLevel(elevationKey)
          next.directions[mode] = { ...next.directions[mode], [elevationKey]: { x: direction, y: currentY } }
        } else if (property === 'offsetY') {
          const absValue = Math.abs(value)
          const direction = value >= 0 ? 'down' : 'up'
          const existingControl = next.controls[mode][elevationKey]
          const existing = existingControl ? { ...existingControl } : { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
          next.controls[mode] = {
            ...next.controls[mode],
            [elevationKey]: { ...existing, offsetY: absValue }
          }
          if (!next.directions[mode]) next.directions[mode] = {}
          const currentX = next.directions[mode][elevationKey]?.x ?? getXDirForLevel(elevationKey)
          next.directions[mode] = { ...next.directions[mode], [elevationKey]: { x: currentX, y: direction } }
        } else if (property === 'blur') {
          const existingControl = next.controls[mode][elevationKey]
          const existing = existingControl ? { ...existingControl } : { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
          next.controls[mode] = {
            ...next.controls[mode],
            [elevationKey]: { ...existing, blur: value }
          }
        } else if (property === 'spread') {
          const existingControl = next.controls[mode][elevationKey]
          const existing = existingControl ? { ...existingControl } : { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
          next.controls[mode] = {
            ...next.controls[mode],
            [elevationKey]: { ...existing, spread: value }
          }
        }
      })

      return next
    })

    // Don't update tokens when controls exist - recomputeAndApplyAll will set CSS variables directly from controls
    // This prevents token conflicts between light and dark modes
    // Tokens are only updated when reverting to defaults (removing custom controls)
  }

  // Helper functions that update elevation state directly
  const updateElevationControl = (elevationKey: string, property: 'blur' | 'spread' | 'offsetX' | 'offsetY', value: number) => {

    // Determine token name and final value BEFORE updating state
    const level = elevationKey.replace('elevation-', '')
    let tokenName: string | null = null
    let finalValue = value

    // For offsetX and offsetY, convert signed values to absolute + direction
    if (property === 'offsetX') {
      finalValue = Math.abs(value)
      tokenName = elevation?.offsetXTokens[elevationKey] || `size/elevation-${level}-offset-x`
    } else if (property === 'offsetY') {
      finalValue = Math.abs(value)
      tokenName = elevation?.offsetYTokens[elevationKey] || `size/elevation-${level}-offset-y`
    } else if (property === 'blur') {
      tokenName = elevation?.blurTokens[elevationKey] || `size/elevation-${level}-blur`
    } else if (property === 'spread') {
      tokenName = elevation?.spreadTokens[elevationKey] || `size/elevation-${level}-spread`
    }

    // Update elevation state FIRST (synchronously) - use mode-specific controls
    updateElevation((prev) => {
      const next = { ...prev }

      // Ensure controls structure exists for both modes (create new objects to avoid reference sharing)
      if (!next.controls.light) next.controls.light = {}
      if (!next.controls.dark) next.controls.dark = {}

      // CRITICAL: Ensure we're working with a copy of the controls object, not a reference
      // This prevents accidentally modifying the other mode's controls
      next.controls = {
        light: { ...next.controls.light },
        dark: { ...next.controls.dark }
      }

      // For offsetX and offsetY, convert signed values to absolute + direction
      if (property === 'offsetX') {
        const absValue = Math.abs(value)
        const direction = value >= 0 ? 'right' : 'left'
        const existing = next.controls[mode][elevationKey] || { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
        next.controls[mode] = {
          ...next.controls[mode],
          [elevationKey]: { ...existing, offsetX: absValue }
        }
        // Update direction (mode-specific)
        if (!next.directions[mode]) next.directions[mode] = {}
        const currentY = next.directions[mode][elevationKey]?.y ?? getYDirForLevel(elevationKey)
        next.directions[mode] = { ...next.directions[mode], [elevationKey]: { x: direction, y: currentY } }
      } else if (property === 'offsetY') {
        const absValue = Math.abs(value)
        const direction = value >= 0 ? 'down' : 'up'
        // Get existing control or create new default - ensure we get a copy, not a reference
        const existingControl = next.controls[mode][elevationKey]
        const existing = existingControl ? { ...existingControl } : { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
        const beforeUpdate = JSON.stringify({ light: next.controls.light?.[elevationKey], dark: next.controls.dark?.[elevationKey] })
        next.controls[mode] = {
          ...next.controls[mode],
          [elevationKey]: { ...existing, offsetY: absValue }
        }
        const afterUpdate = JSON.stringify({ light: next.controls.light?.[elevationKey], dark: next.controls.dark?.[elevationKey] })
        // Update direction (mode-specific)
        if (!next.directions[mode]) next.directions[mode] = {}
        const currentX = next.directions[mode][elevationKey]?.x ?? getXDirForLevel(elevationKey)
        next.directions[mode] = { ...next.directions[mode], [elevationKey]: { x: currentX, y: direction } }
      } else if (property === 'blur') {
        // Get existing control or create new default - ensure we get a copy, not a reference
        const existingControl = next.controls[mode][elevationKey]
        const existing = existingControl ? { ...existingControl } : { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
        const beforeUpdate = JSON.stringify({ light: next.controls.light?.[elevationKey], dark: next.controls.dark?.[elevationKey] })
        next.controls[mode] = {
          ...next.controls[mode],
          [elevationKey]: { ...existing, blur: value }
        }
        const afterUpdate = JSON.stringify({ light: next.controls.light?.[elevationKey], dark: next.controls.dark?.[elevationKey] })
      } else if (property === 'spread') {
        const existing = next.controls[mode][elevationKey] || { blur: 0, spread: 0, offsetX: 0, offsetY: 0 }
        next.controls[mode] = {
          ...next.controls[mode],
          [elevationKey]: { ...existing, spread: value }
        }
      }

      return next
    })

    // Don't update tokens when controls exist - recomputeAndApplyAll will set CSS variables directly from controls
    // This prevents token conflicts between light and dark modes
    // Tokens are only updated when reverting to defaults (removing custom controls)
  }

  const setElevationAlphaToken = (elevationKey: string, token: string) => {
    if (elevationKey === 'elevation-0') return
    updateElevation((prev) => {
      const next = { ...prev }
      if (!next.alphaTokens[mode]) next.alphaTokens[mode] = {}
      next.alphaTokens[mode] = { ...next.alphaTokens[mode], [elevationKey]: token }
      return next
    })
  }

  const getXDirForLevel = (elevationKey: string): 'left' | 'right' => {
    const modeDirections = elevation?.directions[mode] || {}
    return modeDirections[elevationKey]?.x ?? elevation?.baseXDirection ?? 'right'
  }

  const getYDirForLevel = (elevationKey: string): 'up' | 'down' => {
    const modeDirections = elevation?.directions[mode] || {}
    return modeDirections[elevationKey]?.y ?? elevation?.baseYDirection ?? 'down'
  }

  const getAlphaTokenForLevel = (level: number): string => {
    const key = `elevation-${level}`
    const modeAlphaTokens = elevation?.alphaTokens[mode] || {}
    return modeAlphaTokens[key] || elevation?.shadowColorControl?.alphaToken || 'opacity/veiled'
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

      // Ensure controls structure exists for both modes
      if (!next.controls.light) next.controls.light = {}
      if (!next.controls.dark) next.controls.dark = {}

      // CRITICAL: Ensure we're working with a copy of the controls object, not a reference
      // This prevents accidentally modifying the other mode's controls
      next.controls = {
        light: { ...next.controls.light },
        dark: { ...next.controls.dark }
      }

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

        // Remove controls for current mode (revert to Brand.json defaults)
        // This allows recomputeAndApplyAll to use Brand.json defaults and update tokens
        const { [key]: _, ...restControls } = next.controls[mode]
        next.controls[mode] = restControls

        // Update token values in tokens.json to match theme defaults for this mode
        // Get token names from elevation state (or use defaults)
        const blurTokenName = next.blurTokens[key] || `size/elevation-${lvl}-blur`
        const spreadTokenName = next.spreadTokens[key] || `size/elevation-${lvl}-spread`
        const offsetXTokenName = next.offsetXTokens[key] || `size/elevation-${lvl}-offset-x`
        const offsetYTokenName = next.offsetYTokens[key] || `size/elevation-${lvl}-offset-y`

        // Update the actual token values (these will be used when controls don't exist)
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

        // Update alpha tokens (mode-specific)
        const alphaToken = parseOpacityToken(node?.opacity)
        if (!next.alphaTokens[mode]) next.alphaTokens[mode] = {}
        if (alphaToken) {
          next.alphaTokens[mode] = { ...next.alphaTokens[mode], [key]: alphaToken }

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
          } catch { }
        } else {
          const { [key]: ___, ...alphaRest } = next.alphaTokens[mode]
          next.alphaTokens[mode] = alphaRest
        }

        // Update directions (mode-specific)
        if (!next.directions[mode]) next.directions[mode] = {}
        const xraw = Number((node?.['x-direction']?.['$value'] ?? baseX))
        const yraw = Number((node?.['y-direction']?.['$value'] ?? baseY))
        next.directions[mode] = {
          ...next.directions[mode], [key]: {
            x: xraw >= 0 ? 'right' : 'left',
            y: yraw >= 0 ? 'down' : 'up'
          }
        }
      })

      return next
    })
  }

  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`

  const handleResetAll = () => {
    // Reset all elevations (0-4) to theme defaults
    revertSelected(new Set([0, 1, 2, 3, 4]))
  }

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layers-layer-0-properties-surface)`, color: `var(--recursica-brand-themes-${mode}-layers-layer-0-elements-text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
              fontSize: 'var(--recursica-brand-typography-h1-font-size)',
              fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
              letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
              lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
              color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
            }}>Elevations</h1>
            <Button
              variant="outline"
              size="small"
              onClick={handleResetAll}
              icon={(() => {
                const ResetIcon = iconNameToReactComponent('arrow-path')
                return ResetIcon ? <ResetIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
              })()}
              layer="layer-1"
            >
              Reset all
            </Button>
          </div>
          <div style={{ border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 8, padding: 32, display: 'grid', gap: 16 }}>
            <div className="elevation-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ width: '100%' }}>
                  <ElevationModule
                    label={i === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${i}`}
                    level={i}
                    isSelected={i === 0 ? false : selectedLevels.has(i)}
                    onToggle={i === 0 ? undefined : () => {
                      setSelectedLevels(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })
                    }}
                    selectable={i > 0}
                    zIndex={i}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {selectedLevels.size > 0 && elevation && (
          <ElevationStylePanel
            selectedLevels={selectedLevels}
            elevationControls={elevation.controls[mode] || {}}
            availableSizeTokens={availableSizeTokens}
            availableOpacityTokens={availableOpacityTokens}
            shadowColorControl={elevation.shadowColorControl}
            getAlphaTokenForLevel={(key: string) => {
              const lvl = Number(key.replace('elevation-', ''))
              return getAlphaTokenForLevel(lvl)
            }}
            setElevationAlphaToken={setElevationAlphaToken}
            updateElevationControl={updateElevationControl}
            updateElevationControlsBatch={updateElevationControlsBatch}
            getDirectionForLevel={(key: string) => ({ x: getXDirForLevel(key), y: getYDirForLevel(key) })}
            setXDirectionForSelected={(dir: 'left' | 'right') => {
              updateElevation((prev) => {
                const next = { ...prev }
                if (!next.directions[mode]) next.directions[mode] = {}
                selectedLevels.forEach((lvl) => {
                  const k = `elevation-${lvl}`
                  next.directions[mode] = { ...next.directions[mode], [k]: { x: dir, y: getYDirForLevel(k) } }
                })
                return next
              })
            }}
            setYDirectionForSelected={(dir: 'up' | 'down') => {
              updateElevation((prev) => {
                const next = { ...prev }
                if (!next.directions[mode]) next.directions[mode] = {}
                selectedLevels.forEach((lvl) => {
                  const k = `elevation-${lvl}`
                  next.directions[mode] = { ...next.directions[mode], [k]: { x: getXDirForLevel(k), y: dir } }
                })
                return next
              })
            }}
            revertSelected={revertSelected}
            onClose={() => setSelectedLevels(new Set())}
          />
        )}
      </div>
    </div>
  )
}
