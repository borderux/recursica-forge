import '../theme/index.css'
import { useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ElevationModule from './ElevationModule'
import ElevationStylePanel from './ElevationStylePanel'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { removeCssVar } from '../../core/css/updateCssVar'
import { clearDeltaByPrefix } from '../../core/store/cssDelta'
import { parseTokenReference } from '../../core/utils/tokenReferenceParser'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'
import { genericLayerProperty, genericLayerText } from '../../core/css/cssVarBuilder'
import { getElevationColorMirror, setElevationColorMirror } from '../../core/elevation/elevationModeScope'
import { getVarsStore } from '../../core/store/varsStore'

export default function ElevationsPage() {
  const { tokens: tokensJson, theme, elevation, updateElevation, updateToken } = useVars()
  const { mode } = useThemeMode()
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(() => new Set<number>())
  const [colorMirrorEnabled, setColorMirrorEnabled] = useState(() => getElevationColorMirror())

  const toggleColorMirror = () => {
    setColorMirrorEnabled((prev) => {
      const next = !prev
      setElevationColorMirror(next)
      return next
    })
  }

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



  const getThemeDefaults = (elevationKey: string): { blur: number; spread: number; offsetX: number; offsetY: number; opacity: number } => {
    try {
      const brand: any = (theme as any)?.brand || (theme as any)
      const themes = brand?.themes || brand
      const elevations: any = themes?.[mode]?.elevations || brand?.[mode]?.elevations || {}
      const node: any = elevations[elevationKey]?.['$value'] || {}
      const toNum = (ref?: any): number => {
        if (ref && typeof ref === 'object' && '$value' in ref) {
          const val = ref.$value
          if (val && typeof val === 'object' && 'value' in val) return typeof val.value === 'number' ? val.value : Number(val.value) || 0
          if (typeof val === 'number') return val
        }
        if (typeof ref === 'number') return ref
        return 0
      }
      // Opacity: stored as percentage (0-100) in brand JSON — normalise to 0-1
      const opRaw = node?.opacity
      let opacityNorm = 0.84
      if (opRaw && typeof opRaw === 'object' && '$value' in opRaw) {
        const ov = opRaw.$value
        if (ov && typeof ov === 'object' && 'value' in ov) {
          const raw = typeof ov.value === 'number' ? ov.value : Number(ov.value)
          opacityNorm = ov.unit === 'percentage' ? raw / 100 : raw
        } else if (typeof ov === 'number') {
          opacityNorm = ov > 1 ? ov / 100 : ov
        }
      } else if (typeof opRaw === 'number') {
        opacityNorm = opRaw > 1 ? opRaw / 100 : opRaw
      }
      return { blur: toNum(node?.blur), spread: toNum(node?.spread), offsetX: toNum(node?.x), offsetY: toNum(node?.y), opacity: opacityNorm }
    } catch { return { blur: 0, spread: 0, offsetX: 0, offsetY: 0, opacity: 0.84 } }
  }

  const updateElevationControlsBatch = (elevationKeys: string[], property: 'blur' | 'spread' | 'offsetX' | 'offsetY' | 'opacity', value: number) => {
    const otherMode = mode === 'light' ? 'dark' : 'light'

    // Opacity has no token — handle it directly without the pre-loop
    if (property === 'opacity') {
      updateElevation((prev) => {
        const next = { ...prev }
        if (!next.controls.light) next.controls.light = {}
        if (!next.controls.dark) next.controls.dark = {}
        next.controls = { light: { ...next.controls.light }, dark: { ...next.controls.dark } }
        elevationKeys.forEach((elevationKey) => {
          const existingControl = next.controls[mode][elevationKey]
          const existing = existingControl ? { ...existingControl } : getThemeDefaults(elevationKey)
          next.controls[mode] = { ...next.controls[mode], [elevationKey]: { ...existing, opacity: value } }
          if (colorMirrorEnabled) {
            const otherExisting = next.controls[otherMode][elevationKey]
            const otherBase = otherExisting ? { ...otherExisting } : getThemeDefaults(elevationKey)
            next.controls[otherMode] = { ...next.controls[otherMode], [elevationKey]: { ...otherBase, opacity: value } }
          }
        })
        return next
      })
      return
    }

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
    updateElevation((prev) => {
      const next = { ...prev }

      // Ensure controls structure exists for both modes
      if (!next.controls.light) next.controls.light = {}
      if (!next.controls.dark) next.controls.dark = {}

      // CRITICAL: Ensure we're working with a copy of the controls object, not a reference
      next.controls = {
        light: { ...next.controls.light },
        dark: { ...next.controls.dark }
      }

      const applyToMode = (targetMode: 'light' | 'dark') => {
        updates.forEach(({ elevationKey }) => {
          if (property === 'offsetX') {
            const absValue = Math.abs(value)
            const direction = value >= 0 ? 'right' : 'left'
            const existingControl = next.controls[targetMode][elevationKey]
            const existing = existingControl ? { ...existingControl } : getThemeDefaults(elevationKey)
            next.controls[targetMode] = { ...next.controls[targetMode], [elevationKey]: { ...existing, offsetX: absValue } }
            if (!next.directions[targetMode]) next.directions[targetMode] = {}
            const currentY = next.directions[targetMode][elevationKey]?.y ?? getYDirForLevel(elevationKey)
            next.directions[targetMode] = { ...next.directions[targetMode], [elevationKey]: { x: direction, y: currentY } }
          } else if (property === 'offsetY') {
            const absValue = Math.abs(value)
            const direction = value >= 0 ? 'down' : 'up'
            const existingControl = next.controls[targetMode][elevationKey]
            const existing = existingControl ? { ...existingControl } : getThemeDefaults(elevationKey)
            next.controls[targetMode] = { ...next.controls[targetMode], [elevationKey]: { ...existing, offsetY: absValue } }
            if (!next.directions[targetMode]) next.directions[targetMode] = {}
            const currentX = next.directions[targetMode][elevationKey]?.x ?? getXDirForLevel(elevationKey)
            next.directions[targetMode] = { ...next.directions[targetMode], [elevationKey]: { x: currentX, y: direction } }
          } else if (property === 'blur') {
            const existingControl = next.controls[targetMode][elevationKey]
            const existing = existingControl ? { ...existingControl } : getThemeDefaults(elevationKey)
            next.controls[targetMode] = { ...next.controls[targetMode], [elevationKey]: { ...existing, blur: value } }
          } else if (property === 'spread') {
            const existingControl = next.controls[targetMode][elevationKey]
            const existing = existingControl ? { ...existingControl } : getThemeDefaults(elevationKey)
            next.controls[targetMode] = { ...next.controls[targetMode], [elevationKey]: { ...existing, spread: value } }
          }
        })
      }

      applyToMode(mode)
      if (colorMirrorEnabled) applyToMode(otherMode)

      return next
    })

    // Don't update tokens when controls exist - recomputeAndApplyAll will set CSS variables directly from controls
    // This prevents token conflicts between light and dark modes
  }


  const getXDirForLevel = (elevationKey: string): 'left' | 'right' => {
    const modeDirections = elevation?.directions[mode] || {}
    return modeDirections[elevationKey]?.x ?? elevation?.baseXDirection ?? 'right'
  }

  const getYDirForLevel = (elevationKey: string): 'up' | 'down' => {
    const modeDirections = elevation?.directions[mode] || {}
    return modeDirections[elevationKey]?.y ?? elevation?.baseYDirection ?? 'down'
  }

  // Revert selected levels to theme defaults
  const revertSelected = (levels: Set<number>) => {
    const brand: any = (theme as any)?.brand || (theme as any)
    const themes = brand?.themes || brand
    const pristineBrand: any = getVarsStore().getPristineBrand()
    const pristineThemes = pristineBrand?.brand?.themes || pristineBrand?.themes || pristineBrand
    // Read the color ref from the PRISTINE brand JSON to avoid reading back user-mutated values
    const pristineElevations: any = pristineThemes?.[mode]?.elevations || {}
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

        // Restore control to brand JSON defaults (all 5 properties atomically)
        next.controls[mode] = {
          ...next.controls[mode],
          [key]: {
            blur: defaultBlur,
            spread: defaultSpread,
            offsetX: defaultOffsetX,
            offsetY: defaultOffsetY,
            opacity: getThemeDefaults(key).opacity,
          },
        }

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

        // Restore palette selection from PRISTINE brand JSON — avoids reading the user-mutated node
        const elevForReset: any = pristineElevations[key]?.['$value'] || {}
        const colorRefRaw = elevForReset?.color?.['$value'] ?? elevForReset?.color
        const colorRefStr: string | undefined = typeof colorRefRaw === 'string' ? colorRefRaw : undefined
        const parsedColorRef = colorRefStr ? parseTokenReference(colorRefStr, { currentMode: mode }) : null
        let restoredPaletteSel: { paletteKey: string; level: string } | null = null
        if (parsedColorRef?.type === 'brand' && parsedColorRef.path[0] === 'palettes' && parsedColorRef.path.length >= 3) {
          const paletteKey = parsedColorRef.path[1]
          const rawLevel = parsedColorRef.path[2]
          // Resolve 'primary' via palette's primary-level field
          let level = rawLevel
          if (level === 'primary' || level === 'default') {
            const brand: any = (theme as any)?.brand || (theme as any)
            const themes2 = brand?.themes || brand
            const primaryLevel = themes2?.light?.palettes?.[paletteKey]?.['primary-level']?.$value
            level = typeof primaryLevel === 'string' ? primaryLevel : '500'
          }
          restoredPaletteSel = { paletteKey, level }
        }
        if (restoredPaletteSel) {
          next.paletteSelections = {
            ...next.paletteSelections,
            [mode]: { ...next.paletteSelections[mode], [key]: restoredPaletteSel }
          }
        } else {
          const { [key]: __, ...modeRest } = next.paletteSelections[mode] || {}
          next.paletteSelections = { ...next.paletteSelections, [mode]: modeRest }
        }

        // Clear shadow color CSS variables (both scoped and themed) to reset to default
        const scopedShadowColorCssVar = `--recursica_brand_elevations_elevation-${lvl}_shadow-color`
        const themedShadowColorCssVar = `--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_shadow-color`
        removeCssVar(scopedShadowColorCssVar)
        removeCssVar(themedShadowColorCssVar)
        // Also clear scoped elevation property vars so resolver defaults take effect
        const propNames = ['blur', 'spread', 'x-axis', 'y-axis'] as const
        propNames.forEach((prop) => {
          removeCssVar(`--recursica_brand_elevations_elevation-${lvl}_${prop}`)
        })

        // Clear the factory-written shadow-color from the delta so reapplyDelta doesn't
        // restore the old color after recomputeAndApplyAll runs.
        clearDeltaByPrefix(`--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_shadow-color`)
        clearDeltaByPrefix(`--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_blur`)
        clearDeltaByPrefix(`--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_spread`)
        clearDeltaByPrefix(`--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_x-axis`)
        clearDeltaByPrefix(`--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_y-axis`)




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

  // ─── Apply palette color to one or both modes ────────────────────────────

  const applyColorToMode = (
    targetMode: 'light' | 'dark',
    paletteKey: string,
    level: string,
    levels: Set<number>,
  ) => {
    updateElevation((prev) => {
      const next = { ...prev }
      next.paletteSelections = {
        ...next.paletteSelections,
        [targetMode]: { ...(next.paletteSelections[targetMode] || {}) }
      }
      levels.forEach((lvl) => {
        next.paletteSelections[targetMode][`elevation-${lvl}`] = { paletteKey, level }
      })
      return next
    })
  }

  const handleResetAll = () => {
    // Reset all elevations (0-4) to theme defaults
    revertSelected(new Set([0, 1, 2, 3, 4]))
  }

  // Compute elevation controls with theme defaults as fallback.
  // When controls are deleted during reset, the sliders need to show the
  // theme default values (e.g. blur=8, y=4) rather than falling back to 0.
  const elevationControlsWithDefaults = useMemo(() => {
    const controls = elevation?.controls[mode] || {}
    const merged: Record<string, { blur: number; spread: number; offsetX: number; offsetY: number; opacity: number }> = { ...controls }
    for (let i = 1; i <= 4; i++) {
      const key = `elevation-${i}`
      if (!merged[key]) {
        merged[key] = getThemeDefaults(key)
      }
    }
    return merged
  }, [elevation, mode, theme])

  return (
    <>
      <div id="body" className="antialiased" style={{ backgroundColor: `var(${genericLayerProperty(0, 'surface')})`, color: `var(${genericLayerText(0, 'color')})` }}>
        <div className="container-padding" style={{ padding: 'var(--recursica_brand_dimensions_general_xl)' }}>
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{
                margin: 0,
                fontFamily: 'var(--recursica_brand_typography_h1-font-family)',
                fontSize: 'var(--recursica_brand_typography_h1-font-size)',
                fontWeight: 'var(--recursica_brand_typography_h1-font-weight)',
                letterSpacing: 'var(--recursica_brand_typography_h1-font-letter-spacing)',
                lineHeight: 'var(--recursica_brand_typography_h1-line-height)',
                color: `var(${genericLayerText(0, 'color')})`,
              }}>Elevations</h1>
              <Button
                variant="outline"
                size="small"
                onClick={handleResetAll}
                icon={(() => {
                  const ResetIcon = iconNameToReactComponent('arrow-path')
                  return ResetIcon ? <ResetIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
                })()}
                layer="layer-1"
              >
                Reset all
              </Button>
            </div>
            <div style={{ border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 8, padding: 32, display: 'grid', gap: 16 }}>
              <div className="elevation-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)', isolation: 'isolate' }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ width: '100%', position: 'relative', zIndex: i }}>
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
              elevationControls={elevationControlsWithDefaults}
              availableSizeTokens={availableSizeTokens}
              shadowColorControl={elevation.shadowColorControl}
              updateElevationControlsBatch={updateElevationControlsBatch}
              getDirectionForLevel={(key: string) => ({ x: getXDirForLevel(key), y: getYDirForLevel(key) })}
              setXDirectionForSelected={(dir: 'left' | 'right') => {
                updateElevation((prev) => {
                  const next = { ...prev }
                  const otherMode = mode === 'light' ? 'dark' : 'light'
                  if (!next.directions[mode]) next.directions[mode] = {}
                  if (colorMirrorEnabled && !next.directions[otherMode]) next.directions[otherMode] = {}
                  selectedLevels.forEach((lvl) => {
                    const k = `elevation-${lvl}`
                    next.directions[mode] = { ...next.directions[mode], [k]: { x: dir, y: getYDirForLevel(k) } }
                    if (colorMirrorEnabled) {
                      next.directions[otherMode] = { ...next.directions[otherMode], [k]: { x: dir, y: getYDirForLevel(k) } }
                    }
                  })
                  return next
                })
              }}
              setYDirectionForSelected={(dir: 'up' | 'down') => {
                updateElevation((prev) => {
                  const next = { ...prev }
                  const otherMode = mode === 'light' ? 'dark' : 'light'
                  if (!next.directions[mode]) next.directions[mode] = {}
                  if (colorMirrorEnabled && !next.directions[otherMode]) next.directions[otherMode] = {}
                  selectedLevels.forEach((lvl) => {
                    const k = `elevation-${lvl}`
                    next.directions[mode] = { ...next.directions[mode], [k]: { x: getXDirForLevel(k), y: dir } }
                    if (colorMirrorEnabled) {
                      next.directions[otherMode] = { ...next.directions[otherMode], [k]: { x: getXDirForLevel(k), y: dir } }
                    }
                  })
                  return next
                })
              }}
              revertSelected={revertSelected}
              onShadowColorSelect={(cssVar) => {
                const match = cssVar.match(/palettes_([a-z0-9-]+)_(\w+)_color_tone/)
                if (!match) return
                const paletteKey = match[1]
                const level = match[2]
                applyColorToMode(mode, paletteKey, level, selectedLevels)
                if (colorMirrorEnabled) {
                  applyColorToMode(mode === 'light' ? 'dark' : 'light', paletteKey, level, selectedLevels)
                }
              }}
              colorMirrorEnabled={colorMirrorEnabled}
              onToggleColorMirror={toggleColorMirror}
              onClose={() => setSelectedLevels(new Set())}
            />
          )}
        </div>
      </div>
      <PaletteSwatchPicker onSelect={(cssVar) => {
        const match = cssVar.match(/palettes_([a-z0-9-]+)_(\d+)_color_tone/)
        if (match) {
          const paletteKey = match[1]
          const level = match[2]
          applyColorToMode(mode, paletteKey, level, selectedLevels)
          if (colorMirrorEnabled) {
            applyColorToMode(mode === 'light' ? 'dark' : 'light', paletteKey, level, selectedLevels)
          }
        } else if (cssVar === '') {
          updateElevation((prev) => {
            const next = { ...prev }
            next.paletteSelections = { ...next.paletteSelections }
            selectedLevels.forEach((lvl) => {
              const { [`elevation-${lvl}`]: _, ...modeRest } = next.paletteSelections[mode] || {}
              next.paletteSelections = { ...next.paletteSelections, [mode]: modeRest }
            })
            return next
          })
        }
      }} />
    </>
  )
}
