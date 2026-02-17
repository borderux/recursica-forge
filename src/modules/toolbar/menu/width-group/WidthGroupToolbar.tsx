/**
 * WidthGroupToolbar Component
 * 
 * A reusable toolbar for editing width properties (min-width, max-width, optional min-height)
 * for component width groups.
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import { Slider } from '../../../../components/adapters/Slider'
import { Label } from '../../../../components/adapters/Label'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import './WidthGroupToolbar.css'

interface WidthGroupToolbarProps {
  componentName: string
  prop: ComponentProp // The parent "width" prop
  selectedVariants: Record<string, string>
  selectedLayer: string
  groupedPropsConfig?: Record<string, ToolbarPropConfig> // Config for grouped props with visibility
  config?: {
    includeHeight?: boolean // Whether to include min-height control
    propNameMapping?: {
      min?: string // default: "min-width"
      max?: string // default: "max-width"
      height?: string // default: "min-height"
    }
  }
  onClose?: () => void
}

export default function WidthGroupToolbar({
  componentName,
  prop,
  selectedVariants,
  selectedLayer,
  groupedPropsConfig,
  config = {},
  onClose,
}: WidthGroupToolbarProps) {
  const {
    includeHeight = false,
    propNameMapping = {},
  } = config

  const minWidthPropName = propNameMapping.min || 'min-width'
  const maxWidthPropName = propNameMapping.max || 'max-width'
  const minHeightPropName = propNameMapping.height || 'min-height'

  // Find width-related props from component structure
  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  const minWidthProp = useMemo(() => {
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== minWidthPropName.toLowerCase()) return false
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, minWidthPropName, selectedVariants])

  const maxWidthProp = useMemo(() => {
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== maxWidthPropName.toLowerCase()) return false
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, maxWidthPropName, selectedVariants])

  const minHeightProp = useMemo(() => {
    if (!includeHeight) return undefined
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== minHeightPropName.toLowerCase()) return false
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, minHeightPropName, includeHeight, selectedVariants])

  // Get CSS variables
  const minWidthVar = minWidthProp?.cssVar || ''
  const maxWidthVar = maxWidthProp?.cssVar || ''
  const minHeightVar = minHeightProp?.cssVar || ''

  // Get min/max values based on component and prop type
  const getWidthSliderRange = useCallback((propName: string, compName: string) => {
    const compNameLower = compName.toLowerCase().replace(/\s+/g, '-')
    const propNameLower = propName.toLowerCase()

    // Component-specific ranges
    if (compNameLower === 'accordion') {
      if (propNameLower === 'min-width') return { min: 20, max: 200 }
      if (propNameLower === 'max-width') return { min: 100, max: 1500 }
    } else if (compNameLower === 'chip') {
      if (propNameLower === 'min-width') return { min: 50, max: 500 }
      if (propNameLower === 'max-width') return { min: 200, max: 1000 }
    } else if (compNameLower === 'button') {
      if (propNameLower === 'min-width') return { min: 50, max: 500 }
      if (propNameLower === 'max-width') return { min: 200, max: 1000 }
    } else if (compNameLower === 'menu') {
      if (propNameLower === 'min-width') return { min: 50, max: 500 }
      if (propNameLower === 'max-width') return { min: 200, max: 1000 }
    } else if (compNameLower === 'menu-item') {
      if (propNameLower === 'min-width') return { min: 50, max: 500 }
      if (propNameLower === 'max-width') return { min: 200, max: 1000 }
    } else if (compNameLower === 'toast') {
      if (propNameLower === 'min-width') return { min: 200, max: 800 }
      if (propNameLower === 'max-width') return { min: 400, max: 1200 }
      if (propNameLower === 'min-height') return { min: 40, max: 200 }
    } else if (compNameLower === 'read-only-field') {
      if (propNameLower === 'min-height') return { min: 32, max: 200 }
    }

    // Default ranges
    if (propNameLower === 'min-width') return { min: 50, max: 500 }
    if (propNameLower === 'max-width') return { min: 200, max: 1000 }
    if (propNameLower === 'min-height') return { min: 40, max: 200 }

    return { min: 0, max: 1000 }
  }, [])

  // Min Width Control
  const MinWidthControl = useMemo(() => {
    if (!minWidthVar) return null
    const range = getWidthSliderRange('min-width', componentName)

    return () => {
      const [value, setValue] = useState(() => {
        const currentValue = readCssVar(minWidthVar)
        const resolvedValue = readCssVarResolved(minWidthVar)
        const valueStr = resolvedValue || currentValue || '0px'
        const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
        return match ? Math.max(range.min, Math.min(range.max, parseFloat(match[1]))) : range.min
      })

      useEffect(() => {
        const handleUpdate = () => {
          const currentValue = readCssVar(minWidthVar)
          const resolvedValue = readCssVarResolved(minWidthVar)
          const valueStr = resolvedValue || currentValue || '0px'
          const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
          if (match) {
            setValue(Math.max(range.min, Math.min(range.max, parseFloat(match[1]))))
          }
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
      }, [minWidthVar, range])

      const handleChange = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(range.min, Math.min(range.max, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(minWidthVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [minWidthVar] }
        }))
      }, [minWidthVar, range])

      const handleChangeCommitted = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(range.min, Math.min(range.max, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(minWidthVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [minWidthVar] }
        }))
      }, [minWidthVar, range])

      return (
        <Slider
          value={value}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={range.min}
          max={range.max}
          step={1}
          layer="layer-1"
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${Math.round(val)}px`}
          minLabel={`${range.min}px`}
          maxLabel={`${range.max}px`}
          showMinMaxLabels={false}
          label={<Label layer="layer-1" layout="stacked">Min width</Label>}
        />
      )
    }
  }, [minWidthVar, componentName, getWidthSliderRange])

  // Max Width Control
  const MaxWidthControl = useMemo(() => {
    if (!maxWidthVar) return null
    const range = getWidthSliderRange('max-width', componentName)

    return () => {
      const [value, setValue] = useState(() => {
        const currentValue = readCssVar(maxWidthVar)
        const resolvedValue = readCssVarResolved(maxWidthVar)
        const valueStr = resolvedValue || currentValue || '0px'
        const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
        return match ? Math.max(range.min, Math.min(range.max, parseFloat(match[1]))) : range.min
      })

      useEffect(() => {
        const handleUpdate = () => {
          const currentValue = readCssVar(maxWidthVar)
          const resolvedValue = readCssVarResolved(maxWidthVar)
          const valueStr = resolvedValue || currentValue || '0px'
          const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
          if (match) {
            setValue(Math.max(range.min, Math.min(range.max, parseFloat(match[1]))))
          }
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
      }, [maxWidthVar, range])

      const handleChange = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(range.min, Math.min(range.max, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(maxWidthVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [maxWidthVar] }
        }))
      }, [maxWidthVar, range])

      const handleChangeCommitted = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(range.min, Math.min(range.max, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(maxWidthVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [maxWidthVar] }
        }))
      }, [maxWidthVar, range])

      return (
        <Slider
          value={value}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={range.min}
          max={range.max}
          step={1}
          layer="layer-1"
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${Math.round(val)}px`}
          minLabel={`${range.min}px`}
          maxLabel={`${range.max}px`}
          showMinMaxLabels={false}
          label={<Label layer="layer-1" layout="stacked">Max width</Label>}
        />
      )
    }
  }, [maxWidthVar, componentName, getWidthSliderRange])

  // Min Height Control
  const MinHeightControl = useMemo(() => {
    if (!includeHeight || !minHeightVar) return null
    const range = getWidthSliderRange('min-height', componentName)

    return () => {
      const [value, setValue] = useState(() => {
        const currentValue = readCssVar(minHeightVar)
        const resolvedValue = readCssVarResolved(minHeightVar)
        const valueStr = resolvedValue || currentValue || '0px'
        const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
        return match ? Math.max(range.min, Math.min(range.max, parseFloat(match[1]))) : range.min
      })

      useEffect(() => {
        const handleUpdate = () => {
          const currentValue = readCssVar(minHeightVar)
          const resolvedValue = readCssVarResolved(minHeightVar)
          const valueStr = resolvedValue || currentValue || '0px'
          const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
          if (match) {
            setValue(Math.max(range.min, Math.min(range.max, parseFloat(match[1]))))
          }
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
      }, [minHeightVar, range])

      const handleChange = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(range.min, Math.min(range.max, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(minHeightVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [minHeightVar] }
        }))
      }, [minHeightVar, range])

      const handleChangeCommitted = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(range.min, Math.min(range.max, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(minHeightVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [minHeightVar] }
        }))
      }, [minHeightVar, range])

      return (
        <Slider
          value={value}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={range.min}
          max={range.max}
          step={1}
          layer="layer-1"
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${Math.round(val)}px`}
          minLabel={`${range.min}px`}
          maxLabel={`${range.max}px`}
          showMinMaxLabels={false}
          label={<Label layer="layer-1" layout="stacked">Min height</Label>}
        />
      )
    }
  }, [minHeightVar, includeHeight, componentName, getWidthSliderRange])

  // Check visibility from toolbar config
  const minWidthVisible = groupedPropsConfig?.['min-width']?.visible !== false
  const maxWidthVisible = groupedPropsConfig?.['max-width']?.visible !== false
  const minHeightVisible = groupedPropsConfig?.['min-height']?.visible !== false

  return (
    <div className="width-group-toolbar">
      {MinWidthControl && minWidthVisible && (
        <div className="width-group-control">
          <MinWidthControl />
        </div>
      )}
      {MaxWidthControl && maxWidthVisible && (
        <div className="width-group-control">
          <MaxWidthControl />
        </div>
      )}
      {MinHeightControl && minHeightVisible && (
        <div className="width-group-control">
          <MinHeightControl />
        </div>
      )}
    </div>
  )
}
