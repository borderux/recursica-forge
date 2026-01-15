import React from 'react'

export interface NumericSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  formatValue?: (value: number) => string
}

export default function NumericSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  formatValue,
}: NumericSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString()
  const displayLabel = unit ? `${displayValue} ${unit}` : displayValue

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.currentTarget.value)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.currentTarget.value)
    if (Number.isFinite(newValue)) {
      const clamped = Math.max(min, Math.min(max, newValue))
      onChange(clamped)
    }
  }

  return (
    <div className="control-group">
      {label && (
        <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          style={{
            width: 70,
            padding: '4px 8px',
            border: '1px solid var(--recursica-brand-themes-light-layer-layer-1-property-border-color)',
            borderRadius: 4,
            background: 'var(--recursica-brand-themes-light-layer-layer-1-property-surface)',
            color: 'var(--recursica-brand-themes-light-layer-layer-1-property-element-text-color)',
            fontSize: 13,
          }}
        />
        {unit && (
          <span style={{ fontSize: 13, color: 'var(--recursica-brand-themes-light-layer-layer-1-property-element-text-color)', opacity: 0.7 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
