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
import { SegmentedControl } from '../../../../components/adapters/SegmentedControl'
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
  
  const elevationVar = prop.cssVar

  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.light?.elevations || root?.light?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx}`
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson])

  const [currentElevation, setCurrentElevation] = useState(() => {
    const currentValue = readCssVar(elevationVar)
    // Extract elevation name from CSS var value (e.g., "var(--recursica-brand-elevations-elevation-0)" -> "elevation-0")
    const match = currentValue?.match(/elevation-(\d+)/)
    if (match) {
      return `elevation-${match[1]}`
    }
    return elevationOptions[0]?.name || ''
  })

  useEffect(() => {
    const handleUpdate = () => {
      const currentValue = readCssVar(elevationVar)
      const match = currentValue?.match(/elevation-(\d+)/)
      if (match) {
        setCurrentElevation(`elevation-${match[1]}`)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [elevationVar])

  const handleElevationChange = useCallback((elevationName: string) => {
    setCurrentElevation(elevationName)
    // Update CSS var with elevation token reference
    const elevationTokenVar = `--recursica-brand-elevations-${elevationName}`
    updateCssVar(elevationVar, `var(${elevationTokenVar})`)
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [elevationVar] }
    }))
  }, [elevationVar])

  const segmentedControlItems = elevationOptions.map(opt => ({
    label: opt.label,
    value: opt.name,
  }))

  return (
    <div className="elevation-toolbar">
      <div className="elevation-control">
        <Label layer="layer-1" layout="stacked">Elevation</Label>
        <SegmentedControl
          items={segmentedControlItems}
          value={currentElevation}
          onChange={handleElevationChange}
          layer="layer-1"
          showLabel={false}
        />
      </div>
    </div>
  )
}
