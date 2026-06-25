import { useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved, isVarInChain } from '../../../core/css/readCssVar'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { Slider } from '../../../components/adapters/Slider'
import { Label } from '../../../components/adapters/Label'

interface PixelValueSliderInlineProps {
  targetCssVar: string
  label: string
  minPixelValue?: number
  maxPixelValue?: number
}

export default function PixelValueSliderInline({
  targetCssVar,
  label,
  minPixelValue = 0,
  maxPixelValue = 20,
}: PixelValueSliderInlineProps) {
  const [value, setValue] = useState(() => {
    const currentValue = readCssVar(targetCssVar)
    const resolvedValue = readCssVarResolved(targetCssVar)
    const valueStr = resolvedValue || currentValue || `${minPixelValue}px`
    const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
    return match ? Math.max(minPixelValue, Math.min(maxPixelValue, parseFloat(match[1]))) : minPixelValue
  })

  useEffect(() => {
    const handleUpdate = (event?: Event) => {
      if (event && event.type === 'cssVarsUpdated') {
        const updatedVars = (event as CustomEvent).detail?.cssVars
        if (updatedVars && Array.isArray(updatedVars)) {
          const hasRelevantUpdate = isVarInChain(targetCssVar, updatedVars)
          if (!hasRelevantUpdate) return
        }
      }

      setTimeout(() => {
        const currentValue = readCssVar(targetCssVar)
        const resolvedValue = readCssVarResolved(targetCssVar)
        const valueStr = resolvedValue || currentValue || `${minPixelValue}px`
        const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
        if (match) {
          setValue(Math.max(minPixelValue, Math.min(maxPixelValue, parseFloat(match[1]))))
        }
      }, 0)
    }
    window.addEventListener('cssVarsUpdated', handleUpdate as EventListener)
    window.addEventListener('cssVarsReset', handleUpdate as EventListener)
    return () => {
      window.removeEventListener('cssVarsUpdated', handleUpdate as EventListener)
      window.removeEventListener('cssVarsReset', handleUpdate as EventListener)
    }
  }, [targetCssVar, minPixelValue, maxPixelValue])

  const updateCssVars = useCallback((clampedValue: number) => {
    updateCssVar(targetCssVar, `${clampedValue}px`)
    
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [targetCssVar] }
    }))
  }, [targetCssVar])

  const handleChange = (newValue: number | [number, number]) => {
    const numValue = typeof newValue === 'number' ? newValue : newValue[0]
    const clampedValue = Math.max(minPixelValue, Math.min(maxPixelValue, numValue))
    setValue(clampedValue)
    document.documentElement.style.setProperty(targetCssVar, `${clampedValue}px`)
  }

  const handleChangeCommitted = (newValue: number | [number, number]) => {
    const numValue = typeof newValue === 'number' ? newValue : newValue[0]
    const clampedValue = Math.max(minPixelValue, Math.min(maxPixelValue, numValue))
    document.documentElement.style.setProperty(targetCssVar, `${clampedValue}px`)
    updateCssVars(clampedValue)
  }

  const getValueLabel = useCallback((val: number) => {
    return `${Math.round(val)}px`
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <Label size="small" htmlFor={targetCssVar}>{label}</Label>
      <div style={{ padding: '0 8px' }}>
        <Slider
          value={value}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={minPixelValue}
          max={maxPixelValue}
          step={1}
          valueLabel={getValueLabel}
        />
      </div>
    </div>
  )
}
