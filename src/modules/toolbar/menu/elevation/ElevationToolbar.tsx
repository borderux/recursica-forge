/**
 * ElevationToolbar Component
 * 
 * A reusable toolbar for editing elevation property for components.
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import { useVars } from '../../../vars/VarsContext'
import { ComponentProp } from '../../utils/componentToolbarUtils'
import { buildComponentCssVarPath } from '../../../../components/utils/cssVarNames'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { Slider } from '../../../../components/adapters/Slider'
import { Label } from '../../../../components/adapters/Label'
import type { ComponentName } from '../../../../components/registry/types'
import './ElevationToolbar.css'

interface ElevationToolbarProps {
  componentName: ComponentName
  prop: ComponentProp // The "elevation" prop
  selectedVariants: Record<string, string>
  selectedLayer: string
  onClose?: () => void
}

export default function ElevationToolbar({
  componentName,
  prop,
  selectedVariants,
  selectedLayer,
  onClose,
}: ElevationToolbarProps) {
  const { theme: themeJson } = useVars()
  const { mode } = useThemeMode()
  
  // Build layer-specific elevation CSS variable
  // For layer-specific elevations: toast.properties.elevation.layer-{selectedLayer}
  const elevationVar = useMemo(() => {
    // Check if prop path indicates layer-specific elevation structure
    // The path will be ['properties', 'elevation'] for layer-specific elevations
    let cssVar: string
    if (prop.path.includes('properties') && prop.path.includes('elevation') && prop.path.length === 2) {
      // This is a layer-specific elevation, build the CSS var for the selected layer
      // Pass mode explicitly to ensure it uses the current mode
      cssVar = buildComponentCssVarPath(componentName, 'properties', 'elevation', selectedLayer, mode)
    } else {
      // Fallback to prop's CSS var (for non-layer-specific elevations)
      // But we need to ensure it's mode-specific - prop.cssVar might be from light mode
      cssVar = prop.cssVar
      // If prop.cssVar contains a mode, replace it with current mode
      // Handle both UI kit and brand CSS var formats
      cssVar = cssVar.replace(/themes-(light|dark)-/, `themes-${mode}-`)
      // Also handle the case where it might be in a different position
      cssVar = cssVar.replace(/-themes-(light|dark)-/, `-themes-${mode}-`)
    }
    
    return cssVar
  }, [componentName, prop.path, prop.cssVar, selectedLayer, mode])

  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.[mode]?.elevations || root?.[mode]?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        return { name: n, index: idx }
      })
    } catch {
      return []
    }
  }, [themeJson, mode])

  // Convert elevation name (elevation-0, elevation-1, etc.) to number (0, 1, etc.)
  const elevationNameToNumber = useCallback((elevationName: string): number => {
    const match = elevationName.match(/elevation-(\d+)/)
    return match ? Number(match[1]) : 0
  }, [])

  // Convert number to elevation name
  const numberToElevationName = useCallback((num: number): string => {
    return `elevation-${num}`
  }, [])

  // Get current elevation value from CSS var
  // IMPORTANT: Only read from the mode-specific CSS variable - never fall back to other modes
  const getCurrentElevationName = useCallback((): string => {
    // Only check inline style for the current mode-specific CSS variable
    // Don't fall back to computed styles as they might cascade from other modes
    const inlineValue = typeof document !== 'undefined' 
      ? document.documentElement.style.getPropertyValue(elevationVar).trim()
      : ''
    
    // If no inline value exists for this mode, return default (don't read computed as it might be from another mode)
    if (!inlineValue) {
      return 'elevation-0'
    }
    
    // Parse token reference format: {brand.themes.light.elevations.elevation-0}
    // Check if the token reference is for the correct mode
    const tokenMatch = inlineValue.match(/themes\.(light|dark)\.elevations?\.(elevation-\d+)/i)
    if (tokenMatch) {
      const refMode = tokenMatch[1].toLowerCase() as 'light' | 'dark'
      const elevationName = tokenMatch[2]
      
      // If the token reference is for a different mode, ignore it and return default
      // This prevents reading light mode values when in dark mode
      if (refMode !== mode) {
        return 'elevation-0'
      }
      
      return elevationName
    }
    
    // Fallback: try to match without mode check (for backwards compatibility)
    const fallbackMatch = inlineValue.match(/elevations?\.(elevation-\d+)/i)
    if (fallbackMatch) {
      return fallbackMatch[1]
    }
    // Parse direct elevation name format: elevation-0
    if (/^elevation-\d+$/.test(inlineValue)) {
      return inlineValue
    }
    
    return 'elevation-0'
  }, [elevationVar, mode])

  const [currentElevationName, setCurrentElevationName] = useState(() => getCurrentElevationName())

  // Re-read elevation value when elevationVar changes (including when mode changes)
  // This allows each mode to have its own independent elevation value
  // IMPORTANT: Only read, never write when mode changes - each mode maintains its own value
  useEffect(() => {
    const newElevationName = getCurrentElevationName()
    setCurrentElevationName(newElevationName)
  }, [elevationVar, mode, getCurrentElevationName])

  useEffect(() => {
    const handleUpdate = () => {
      const newElevationName = getCurrentElevationName()
      setCurrentElevationName(newElevationName)
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [elevationVar, getCurrentElevationName])

  // Convert current elevation name to index for slider
  const currentElevationIndex = useMemo(() => {
    const index = elevationOptions.findIndex(opt => opt.name === currentElevationName)
    return index >= 0 ? index : 0
  }, [elevationOptions, currentElevationName])

  const handleElevationChange = useCallback((value: number | [number, number]) => {
    const numValue = Array.isArray(value) ? value[0] : value
    const clampedIndex = Math.max(0, Math.min(Math.round(numValue), elevationOptions.length - 1))
    const selectedOption = elevationOptions[clampedIndex]
    
    if (selectedOption) {
      const elevationName = selectedOption.name
      
      // Update CSS var with elevation token reference (use token format, not CSS var format)
      const elevationTokenRef = `{brand.themes.${mode}.elevations.${elevationName}}`
      updateCssVar(elevationVar, elevationTokenRef)
      
      // Update local state immediately for responsive UI feedback
      setCurrentElevationName(elevationName)
      
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [elevationVar] }
      }))
    }
  }, [elevationVar, mode, elevationOptions])

  const handleElevationChangeCommitted = useCallback((value: number | [number, number]) => {
    handleElevationChange(value)
  }, [handleElevationChange])

  // Extract elevation number from token name for labels
  const getElevationNumber = useCallback((elevationName: string): number => {
    const match = elevationName.match(/elevation-(\d+)/)
    return match ? Number(match[1]) : 0
  }, [])

  const getValueLabel = useCallback((value: number): string => {
    const index = Math.max(0, Math.min(Math.round(value), elevationOptions.length - 1))
    const option = elevationOptions[index]
    if (!option) return 'None'
    const elevationNum = getElevationNumber(option.name)
    return elevationNum === 0 ? 'None' : String(elevationNum)
  }, [elevationOptions, getElevationNumber])

  const minOption = elevationOptions[0]
  const maxOption = elevationOptions[elevationOptions.length - 1]
  const minElevationNum = minOption ? getElevationNumber(minOption.name) : 0
  const maxElevationNum = maxOption ? getElevationNumber(maxOption.name) : 4
  const minLabel = minElevationNum === 0 ? 'None' : String(minElevationNum)
  const maxLabel = String(maxElevationNum)

  return (
    <div className="elevation-toolbar">
      <div className="elevation-control">
        <Slider
          value={currentElevationIndex}
          onChange={handleElevationChange}
          onChangeCommitted={handleElevationChangeCommitted}
          min={0}
          max={elevationOptions.length - 1}
          step={1}
          layer={selectedLayer as any}
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={getValueLabel}
          minLabel={minLabel}
          maxLabel={maxLabel}
          showMinMaxLabels={false}
          label={<Label layer={selectedLayer as any} layout="stacked">Elevation</Label>}
        />
      </div>
    </div>
  )
}
