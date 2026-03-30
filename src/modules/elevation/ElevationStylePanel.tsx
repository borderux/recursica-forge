import React, { useRef, useMemo } from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { Panel } from '../../components/adapters/Panel'
import { TextField } from '../../components/adapters/TextField'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { iconNameToReactComponent } from '../components/iconUtils'
import { readCssVar } from '../../core/css/readCssVar'
import { token, unwrapVar } from '../../core/css/cssVarBuilder'
import { tokenToCssVar } from '../../core/css/tokenRefs'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

type SizeToken = { name: string; value: number; label: string }
type OpacityToken = { name: string; value: number; label: string }

/**
 * A compact color control for the elevation shadow color.
 * Reads the token var stored in `targetCssVar`, resolves `scale-XX` to
 * its friendly alias (e.g. "Gray"), and opens the full ColorTokenPicker
 * (window.openPicker) so the user picks from actual color-scale swatches.
 */
function ShadowColorTokenControl({
  targetCssVar,
  targetCssVars,
  paletteSelection,
}: {
  targetCssVar: string
  targetCssVars: string[]
  paletteSelection?: { paletteKey: string; level: string } | null
}) {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()
  const modeLower = mode.toLowerCase()
  const containerRef = useRef<HTMLDivElement>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const updatedVars: string[] | undefined = (e as CustomEvent).detail?.cssVars
      if (!updatedVars || targetCssVars.some(v => updatedVars.includes(v))) {
        setRefreshKey(k => k + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [targetCssVars])

  // Derive the active palette selection from (in priority order):
  //  1. Explicit paletteSelection from elevation.paletteSelections state
  //  2. Palette ref inside the shadow-color CSS var (color-mix with _palettes_ var)
  //  3. Color token ref inside the shadow-color CSS var — map via tokensJson alias
  const activePaletteSelection = useMemo(() => {
    if (paletteSelection) return paletteSelection

    const rawValue = readCssVar(targetCssVar)
    if (!rawValue || rawValue === 'transparent') return null

    // 2. Direct palette ref (e.g. after recompute uses paletteSelections)
    const paletteMatch = rawValue.match(/palettes_([a-z0-9-]+)_([0-9]+)_color_tone/)
    if (paletteMatch) return { paletteKey: paletteMatch[1], level: paletteMatch[2] }

    // 3. Color token var inside a color-mix: --recursica_tokens_colors_{family}_{level}
    //    Map family → palette key via tokensJson.tokens.colors[family].alias
    const tokenVarMatch = rawValue.match(/var\(--recursica_tokens_colors_([a-z0-9-]+)_([0-9]+)\)/)
    if (tokenVarMatch) {
      const family = tokenVarMatch[1]
      const level = tokenVarMatch[2]
      const alias: string | undefined = (tokensJson as any)?.tokens?.colors?.[family]?.alias
      return { paletteKey: alias || family, level }
    }

    return null
  }, [paletteSelection, targetCssVar, tokensJson, refreshKey])

  // Derive label from active selection
  const displayLabel = useMemo(() => {
    if (!activePaletteSelection) return 'None'
    const { paletteKey, level } = activePaletteSelection
    const friendlyKey = paletteKey.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase())
    return `${friendlyKey} / ${level}`
  }, [activePaletteSelection])

  // Swatch: extract the inner color var directly from the shadow-color CSS var value.
  // This works for palette refs AND color token refs inside color-mix().
  const swatchColor = useMemo(() => {
    const rawValue = readCssVar(targetCssVar)
    if (!rawValue || rawValue === 'transparent') return 'transparent'
    const innerVarMatch = rawValue.match(/var\((--[^)]+)\)/)
    return innerVarMatch ? `var(${innerVarMatch[1]})` : 'transparent'
  }, [targetCssVar, refreshKey])

  const isNone = useMemo(() => {
    const rawValue = readCssVar(targetCssVar)
    return !rawValue || rawValue === 'transparent'
  }, [targetCssVar, refreshKey])

  const swatchBorderColor = `var(--recursica_brand_themes_${modeLower}_palettes_neutral_500_color_tone)`

  const swatchIcon = (
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        display: 'block',
        flex: '0 0 auto',
        boxSizing: 'border-box',
        border: `1px solid ${swatchBorderColor}`,
        background: isNone ? 'transparent' : swatchColor,
        flexShrink: 0,
        position: 'relative',
      }}
    />
  )

  return (
    <div ref={containerRef}>
      <TextField
        label="Shadow Color"
        value={displayLabel}
        leadingIcon={swatchIcon}
        state="default"
        readOnly={true}
        layer="layer-0"
        style={{ fontSize: 13, cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation()
          const el = containerRef.current
          if (!el) return
          const additional = targetCssVars.filter(v => v !== targetCssVar)
          // Open palette picker — no opacity dropdown (handled by panel slider), no None option (elevation always has a color)
          ;(window as any).openPalettePicker(
            el,
            targetCssVar,
            additional.length > 0 ? additional : undefined,
            undefined,
            false,
          )
        }}
      />
    </div>
  )
}


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
  updateElevationControlsBatch,
  getDirectionForLevel,
  setXDirectionForSelected,
  setYDirectionForSelected,
  revertSelected,
  getAlphaTokenForLevel,
  setElevationAlphaToken,
  onShadowColorSelect,
  onClose,
}: {
  selectedLevels: Set<number>
  elevationControls: Record<string, ElevationControl>
  availableSizeTokens: SizeToken[]
  availableOpacityTokens: OpacityToken[]
  shadowColorControl: { alphaToken: string; colorToken: string }
  updateElevationControl: (elevation: string, property: 'blur' | 'spread' | 'offsetX' | 'offsetY', value: number) => void
  updateElevationControlsBatch?: (elevationKeys: string[], property: 'blur' | 'spread' | 'offsetX' | 'offsetY', value: number) => void
  getDirectionForLevel: (elevationKey: string) => { x: 'left' | 'right'; y: 'up' | 'down' }
  setXDirectionForSelected: (dir: 'left' | 'right') => void
  setYDirectionForSelected: (dir: 'up' | 'down') => void
  revertSelected: (levels: Set<number>) => void
  getAlphaTokenForLevel: (elevationKey: string) => string
  setElevationAlphaToken: (elevationKey: string, token: string) => void
  onShadowColorSelect?: (cssVar: string) => void
  onClose: () => void
}) {
  const levelsArr = React.useMemo(() => Array.from(selectedLevels), [selectedLevels])
  const { mode } = useThemeMode()
  const { tokens: tokensJson, updateToken, elevation } = useVars()

  // Local state for slider values during drag (prevents prop mismatch)
  const [localBlur, setLocalBlur] = React.useState<number | null>(null)
  const [localSpread, setLocalSpread] = React.useState<number | null>(null)
  const [localOffsetX, setLocalOffsetX] = React.useState<number | null>(null)
  const [localOffsetY, setLocalOffsetY] = React.useState<number | null>(null)

  // Reset local state when selected levels change
  React.useEffect(() => {
    setLocalBlur(null)
    setLocalSpread(null)
    setLocalOffsetX(null)
    setLocalOffsetY(null)
  }, [levelsArr])

  // Helper to get CSS variable name for elevation property (themed = mode-specific)
  const getElevationCssVar = React.useCallback((level: number, property: 'blur' | 'spread' | 'x-axis' | 'y-axis'): string => {
    return `--recursica_brand_themes_${mode}_elevations_elevation-${level}_${property}`
  }, [mode])

  // Helper to get scoped CSS variable name (used by box-shadow, for immediate drag feedback)
  const getScopedElevationCssVar = React.useCallback((level: number, property: 'blur' | 'spread' | 'x-axis' | 'y-axis'): string => {
    return `--recursica_brand_elevations_elevation-${level}_${property}`
  }, [])

  // Helper to get token name for elevation property
  const getElevationTokenName = React.useCallback((level: number, property: 'blur' | 'spread' | 'offsetX' | 'offsetY'): string => {
    const elevationKey = `elevation-${level}`
    if (property === 'blur') {
      return elevation?.blurTokens[elevationKey] || `size/elevation-${level}-blur`
    } else if (property === 'spread') {
      return elevation?.spreadTokens[elevationKey] || `size/elevation-${level}-spread`
    } else if (property === 'offsetX') {
      return elevation?.offsetXTokens[elevationKey] || `size/elevation-${level}-offset-x`
    } else {
      return elevation?.offsetYTokens[elevationKey] || `size/elevation-${level}-offset-y`
    }
  }, [elevation])

  // Handlers for slider changes - update CSS vars directly AND tokens for real-time updates
  const handleBlurChange = React.useCallback((value: number) => {
    setLocalBlur(value)
    // Set themed CSS var directly for immediate visual feedback (no updateToken to avoid recompute)
    levelsArr.forEach((lvl) => {
      const cssVar = getElevationCssVar(lvl, 'blur')
      document.documentElement.style.setProperty(cssVar, `${value}px`)
    })
  }, [levelsArr, getElevationCssVar])

  const handleBlurChangeCommitted = React.useCallback((value: number) => {
    // Clear local state and persist to state (tokens already updated, just sync state)
    setLocalBlur(null)
    // Batch all updates into a single updateElevation call to prevent multiple recomputes
    const elevationKeys = levelsArr.map(lvl => `elevation-${lvl}`)
    if (updateElevationControlsBatch) {
      updateElevationControlsBatch(elevationKeys, 'blur', value)
    } else {
      levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'blur', value))
    }
  }, [levelsArr, updateElevationControl, updateElevationControlsBatch])

  const handleSpreadChange = React.useCallback((value: number) => {
    setLocalSpread(value)
    levelsArr.forEach((lvl) => {
      const cssVar = getElevationCssVar(lvl, 'spread')
      document.documentElement.style.setProperty(cssVar, `${value}px`)
    })
  }, [levelsArr, getElevationCssVar])

  const handleSpreadChangeCommitted = React.useCallback((value: number) => {
    setLocalSpread(null)
    const elevationKeys = levelsArr.map(lvl => `elevation-${lvl}`)
    if (updateElevationControlsBatch) {
      updateElevationControlsBatch(elevationKeys, 'spread', value)
    } else {
      levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'spread', value))
    }
  }, [levelsArr, updateElevationControl, updateElevationControlsBatch])

  const handleOffsetXChange = React.useCallback((value: number) => {
    setLocalOffsetX(value)
    levelsArr.forEach((lvl) => {
      const cssVar = getElevationCssVar(lvl, 'x-axis')
      // Set directly as signed px value — direction is encoded in the sign
      document.documentElement.style.setProperty(cssVar, `${value}px`)
    })
  }, [levelsArr, getElevationCssVar])

  const handleOffsetXChangeCommitted = React.useCallback((value: number) => {
    setLocalOffsetX(null)
    const elevationKeys = levelsArr.map(lvl => `elevation-${lvl}`)
    if (updateElevationControlsBatch) {
      updateElevationControlsBatch(elevationKeys, 'offsetX', value)
    } else {
      levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetX', value))
    }
  }, [levelsArr, updateElevationControl, updateElevationControlsBatch])

  const handleOffsetYChange = React.useCallback((value: number) => {
    setLocalOffsetY(value)
    levelsArr.forEach((lvl) => {
      const cssVar = getElevationCssVar(lvl, 'y-axis')
      // Set directly as signed px value — direction is encoded in the sign
      document.documentElement.style.setProperty(cssVar, `${value}px`)
    })
  }, [levelsArr, getElevationCssVar])

  const handleOffsetYChangeCommitted = React.useCallback((value: number) => {
    setLocalOffsetY(null)
    const elevationKeys = levelsArr.map(lvl => `elevation-${lvl}`)
    if (updateElevationControlsBatch) {
      updateElevationControlsBatch(elevationKeys, 'offsetY', value)
    } else {
      levelsArr.forEach((lvl) => updateElevationControl(`elevation-${lvl}`, 'offsetY', value))
    }
  }, [levelsArr, updateElevationControl, updateElevationControlsBatch])

  const getShadowColorCssVar = React.useCallback((level: number): string => {
    return `--recursica_brand_themes_${mode}_elevations_elevation-${level}_shadow-color`
  }, [mode])

  const getScopedShadowColorCssVar = React.useCallback((level: number): string => {
    return `--recursica_brand_elevations_elevation-${level}_shadow-color`
  }, [])

  const getTokenLabel = React.useCallback((tokenName: string, tokens: Array<{ name: string; label: string }>): string => {
    const token = tokens.find((t) => t.name === tokenName)
    return token?.label || tokenName.split('/').pop() || tokenName
  }, [])

  // Get current opacity value (0-1) from token and convert to 0-100 for display
  const getCurrentOpacityValue = React.useCallback((elevationKey: string): number => {
    // Pass elevationKey as string - getAlphaTokenForLevel expects a string and will convert internally
    const alphaTokenName = getAlphaTokenForLevel(elevationKey)
    if (!alphaTokenName) return 0

    // Extract token key from "opacity/veiled" or "opacity/elevation-light-1" format
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
    } catch { }

    return 0
  }, [tokensJson, getAlphaTokenForLevel, mode])

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
          // Check if it's a mode-specific token for the current mode
          if (lastUpdatedTokenRef.current.includes(`-${mode}-`)) {
            return
          }
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
      } catch { }
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
  // Helper to get opacity token name for elevation
  const getOpacityTokenName = React.useCallback((level: number): string => {
    const elevationKey = `elevation-${level}`
    const modeAlphaTokens = elevation?.alphaTokens[mode] || {}
    return modeAlphaTokens[elevationKey] || elevation?.shadowColorControl?.alphaToken || 'opacity/veiled'
  }, [elevation, mode])

  const handleOpacityChange = React.useCallback((value: number) => {
    setLocalOpacityValue(value)
    setIsDragging(true)

    // Convert 0-100 to 0-1
    const normalizedValue = Math.max(0, Math.min(1, value / 100))

    // Set themed shadow-color var directly with new opacity (no updateToken to avoid recompute)
    levelsArr.forEach((lvl) => {
      const elevationKey = `elevation-${lvl}`
      const shadowColorCssVar = getShadowColorCssVar(lvl)
      const existingShadowColor = readCssVar(shadowColorCssVar)

      // Check if existing color contains a palette reference
      const hasPaletteRef = existingShadowColor && (
        (existingShadowColor.startsWith('var(') && existingShadowColor.includes('palettes')) ||
        (existingShadowColor.includes('color-mix') && existingShadowColor.includes('palettes'))
      )

      let newShadowColor: string

      if (hasPaletteRef) {
        let paletteVarRef: string | null = null

        // Try direct var() extraction using central parser
        const unwrapped = unwrapVar(existingShadowColor)
        if (unwrapped && unwrapped.includes('palettes')) {
          paletteVarRef = `var(${unwrapped})`
        } else {
          // Try extracting from color-mix() expression
          const colorMixVarMatch = existingShadowColor.match(/color-mix\s*\([^,]+,\s*(var\s*\([^)]+\))/)
          if (colorMixVarMatch) {
            const innerUnwrapped = unwrapVar(colorMixVarMatch[1])
            if (innerUnwrapped && innerUnwrapped.includes('palettes')) {
              paletteVarRef = `var(${innerUnwrapped})`
            }
          }
        }

        if (paletteVarRef) {
          newShadowColor = `color-mix(in srgb, ${paletteVarRef} calc(${normalizedValue} * 100%), transparent)`
        } else {
          newShadowColor = existingShadowColor
        }
      } else {
        // No palette reference - use color token from state
        const colorToken = elevation?.colorTokens?.[elevationKey] || elevation?.shadowColorControl?.colorToken || 'color/gray/900'
        const colorVarRef = tokenToCssVar(colorToken, tokensJson) || `var(--recursica_tokens_${colorToken.replace(/\//g, '-')})`
        newShadowColor = `color-mix(in srgb, ${colorVarRef} calc(${normalizedValue} * 100%), transparent)`
      }

      document.documentElement.style.setProperty(shadowColorCssVar, newShadowColor)
    })
  }, [levelsArr, getShadowColorCssVar, elevation, tokensJson, mode])

  const handleOpacityChangeCommitted = React.useCallback((value: number) => {

    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }

    // Convert 0-100 to 0-1
    const normalizedValue = value / 100

    // Track the final token name and value for the first selected elevation
    let finalTokenName: string | null = null

    // For each selected elevation, ensure it has its own unique opacity token and persist state
    levelsArr.forEach((lvl) => {
      const elevationKey = `elevation-${lvl}`
      let alphaTokenName = getOpacityTokenName(lvl)

      // Check if this elevation shares a token with other elevations (mode-specific check)
      const modeAlphaTokens = elevation?.alphaTokens[mode] || {}
      const isSharedToken = !modeAlphaTokens[elevationKey] ||
        alphaTokenName === elevation?.shadowColorControl?.alphaToken ||
        alphaTokenName === 'opacity/veiled'
      if (isSharedToken) {
        // Create a unique token name for this elevation and mode (mode-specific to prevent cross-contamination)
        const uniqueTokenName = `opacity/elevation-${mode}-${lvl}`
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
        } catch { }

        // Create the unique token with the new value (updateToken will create it if it doesn't exist)
        updateToken(uniqueTokenName, normalizedValue)

        // Set the unique token for this elevation (persist state)
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
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false)
      setTimeout(() => {
        lastUpdatedTokenRef.current = null
        lastUpdatedValueRef.current = null
      }, 300)
    }, 600)
  }, [levelsArr, getOpacityTokenName, updateToken, setElevationAlphaToken, elevation, tokensJson, mode])

  const panelTitle = (() => {
    if (levelsArr.length === 0) return 'Elevation'
    if (levelsArr.length === 1) return `Elevation ${levelsArr[0]}`
    const list = levelsArr.slice().sort((a, b) => a - b).join(', ')
    return `Elevations ${list}`
  })()

  const panelFooter = (
    <Button
      variant="outline"
      size="small"
      onClick={() => revertSelected(new Set(selectedLevels))}
      icon={(() => {
        const ResetIcon = iconNameToReactComponent('arrow-path')
        return ResetIcon ? <ResetIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
      })()}
      layer="layer-0"
    >
      Reset all
    </Button>
  )

  return (
    <Panel
      overlay
      position="right"
      title={panelTitle}
      onClose={onClose}
      footer={panelFooter}
      width="400px"
      zIndex={10000}
      layer="layer-0"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})` }}>
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Slider
            key={`blur-${levelsArr[0]}-${elevationControls[`elevation-${levelsArr[0]}`]?.blur ?? 0}`}
            value={localBlur !== null ? localBlur : (levelsArr.length ? (elevationControls[`elevation-${levelsArr[0]}`]?.blur ?? 0) : 0)}
            onChange={(val) => {
              const value = typeof val === 'number' ? val : val[0]
              handleBlurChange(value)
            }}
            onChangeCommitted={(val) => {
              const value = typeof val === 'number' ? val : val[0]
              handleBlurChangeCommitted(value)
            }}
            min={0}
            max={200}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            showMinMaxLabels={false}
            valueLabel={(val) => `${val}px`}
            label={<Label layer="layer-3" layout="stacked">Blur</Label>}
          />
        </div>

        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Slider
            key={`spread-${levelsArr[0]}-${elevationControls[`elevation-${levelsArr[0]}`]?.spread ?? 0}`}
            value={localSpread !== null ? localSpread : (levelsArr.length ? (elevationControls[`elevation-${levelsArr[0]}`]?.spread ?? 0) : 0)}
            onChange={(val) => {
              const value = typeof val === 'number' ? val : val[0]
              handleSpreadChange(value)
            }}
            onChangeCommitted={(val) => {
              const value = typeof val === 'number' ? val : val[0]
              handleSpreadChangeCommitted(value)
            }}
            min={0}
            max={200}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            showMinMaxLabels={false}
            valueLabel={(val) => `${val}px`}
            label={<Label layer="layer-3" layout="stacked">Spread</Label>}
          />
        </div>

        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          {(() => {
            const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
            const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
            const dir = firstKey ? getDirectionForLevel(firstKey).x : 'right'
            // Convert absolute value with direction to signed value
            const absValue = Math.abs(firstCtrl?.offsetX ?? 0)
            const signedValue = dir === 'right' ? absValue : -absValue
            return (
              <Slider
                key={`offsetX-${firstKey}-${signedValue}`}
                value={localOffsetX !== null ? localOffsetX : signedValue}
                onChange={(val) => {
                  const value = typeof val === 'number' ? val : val[0]
                  handleOffsetXChange(value)
                }}
                onChangeCommitted={(val) => {
                  const value = typeof val === 'number' ? val : val[0]
                  handleOffsetXChangeCommitted(value)
                }}
                min={-50}
                max={50}
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={(val) => `${val}px`}
                label={<Label layer="layer-3" layout="stacked">Offset X</Label>}
              />
            )
          })()}
        </div>

        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          {(() => {
            const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
            const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
            const dir = firstKey ? getDirectionForLevel(firstKey).y : 'down'
            // Convert absolute value with direction to signed value
            const absValue = Math.abs(firstCtrl?.offsetY ?? 0)
            const signedValue = dir === 'down' ? absValue : -absValue
            return (
              <Slider
                key={`offsetY-${firstKey}-${signedValue}`}
                value={localOffsetY !== null ? localOffsetY : signedValue}
                onChange={(val) => {
                  const value = typeof val === 'number' ? val : val[0]
                  handleOffsetYChange(value)
                }}
                onChangeCommitted={(val) => {
                  const value = typeof val === 'number' ? val : val[0]
                  handleOffsetYChangeCommitted(value)
                }}
                min={-50}
                max={50}
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={(val) => `${val}px`}
                label={<Label layer="layer-3" layout="stacked">Offset Y</Label>}
              />
            )
          })()}
        </div>

        <div style={{ width: '100%', margin: 0, padding: 0 }}>
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
                  } catch { }
                  return 0
                })())

            return (
              <Slider
                value={currentOpacityValue}
                onChange={(val) => {
                  // Update local state immediately for visual feedback
                  const value = typeof val === 'number' ? val : val[0]
                  handleOpacityChange(value)
                }}
                onChangeCommitted={(val) => {
                  // Expensive token updates happen on commit
                  const value = typeof val === 'number' ? val : val[0]
                  handleOpacityChangeCommitted(value)
                }}
                min={0}
                max={100}
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={(val) => `${val}%`}
                label={<Label layer="layer-3" layout="stacked">Opacity</Label>}
              />
            )
          })()}
        </div>
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <ShadowColorTokenControl
            targetCssVar={levelsArr.length > 0 ? getShadowColorCssVar(levelsArr[0]) : getShadowColorCssVar(0)}
            targetCssVars={levelsArr.length > 0 ? levelsArr.map(lvl => getShadowColorCssVar(lvl)) : [getShadowColorCssVar(0)]}
            paletteSelection={(() => {
              const elevationKey = levelsArr.length > 0 ? `elevation-${levelsArr[0]}` : null
              return elevationKey ? (elevation?.paletteSelections?.[elevationKey] ?? null) : null
            })()}
          />
        </div>
      </div>
    </Panel>
  )
}
