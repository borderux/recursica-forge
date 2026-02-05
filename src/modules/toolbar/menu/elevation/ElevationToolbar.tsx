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
import './ElevationToolbar.css'

interface ElevationToolbarProps {
  componentName: string
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
    if (prop.path.includes('properties') && prop.path.includes('elevation') && prop.path.length === 2) {
      // This is a layer-specific elevation, build the CSS var for the selected layer
      return buildComponentCssVarPath(componentName, 'properties', 'elevation', selectedLayer)
    }
    // Fallback to prop's CSS var (for non-layer-specific elevations)
    return prop.cssVar
  }, [componentName, prop.path, prop.cssVar, selectedLayer])

  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.light?.elevations || root?.light?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        return { name: n, index: idx }
      })
    } catch {
      return []
    }
  }, [themeJson])

  const maxElevation = elevationOptions.length > 0 ? elevationOptions[elevationOptions.length - 1].index : 4

  // Convert elevation name (elevation-0, elevation-1, etc.) to number (0, 1, etc.)
  const elevationNameToNumber = useCallback((elevationName: string): number => {
    const match = elevationName.match(/elevation-(\d+)/)
    return match ? Number(match[1]) : 0
  }, [])

  // Convert number to elevation name
  const numberToElevationName = useCallback((num: number): string => {
    return `elevation-${num}`
  }, [])

  const [currentElevationValue, setCurrentElevationValue] = useState(() => {
    const currentValue = readCssVar(elevationVar)
    // Extract elevation number from CSS var value (e.g., "var(--recursica-brand-elevations-elevation-0)" -> 0)
    const match = currentValue?.match(/elevation-(\d+)/)
    if (match) {
      return Number(match[1])
    }
    return 0
  })

  useEffect(() => {
    const currentValue = readCssVar(elevationVar)
    const match = currentValue?.match(/elevation-(\d+)/)
    if (match) {
      setCurrentElevationValue(Number(match[1]))
    } else {
      setCurrentElevationValue(0)
    }
  }, [elevationVar])

  useEffect(() => {
    const handleUpdate = () => {
      const currentValue = readCssVar(elevationVar)
      const match = currentValue?.match(/elevation-(\d+)/)
      if (match) {
        setCurrentElevationValue(Number(match[1]))
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [elevationVar])

  const handleElevationChange = useCallback((value: number | [number, number]) => {
    // Update local state immediately for responsive UI feedback
    const numValue = Array.isArray(value) ? value[0] : value
    setCurrentElevationValue(numValue)
  }, [])

  const handleElevationChangeCommitted = useCallback((value: number | [number, number]) => {
    const numValue = Array.isArray(value) ? value[0] : value
    const elevationName = numberToElevationName(numValue)
    
    // Update CSS var with elevation token reference (use token format, not CSS var format)
    const elevationTokenRef = `{brand.themes.${mode}.elevations.${elevationName}}`
    updateCssVar(elevationVar, elevationTokenRef)
    
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [elevationVar] }
    }))
  }, [elevationVar, numberToElevationName, mode])

  const getValueLabel = useCallback((value: number): string => {
    return String(value)
  }, [])

  return (
    <div className="elevation-toolbar">
      <div className="elevation-control">
        <Slider
          value={currentElevationValue}
          onChange={handleElevationChange}
          onChangeCommitted={handleElevationChangeCommitted}
          min={0}
          max={maxElevation}
          step={1}
          layer={selectedLayer as any}
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={getValueLabel}
          showMinMaxLabels={false}
          label={<Label layer={selectedLayer as any} layout="stacked">Elevation</Label>}
        />
      </div>
    </div>
  )
}
