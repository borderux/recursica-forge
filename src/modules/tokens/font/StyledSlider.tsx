import React from 'react'
import { useThemeMode } from '../../theme/ThemeModeContext'

type StyledSliderProps = {
  id?: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  style?: React.CSSProperties
}

export function StyledSlider({
  id,
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled = false,
  style,
}: StyledSliderProps) {
  const { mode } = useThemeMode()
  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-${mode}-layer-layer-1-property`
  const interactiveColor = `--recursica-brand-${mode}-palettes-core-interactive`
  const blackColor = `--recursica-brand-${mode}-palettes-core-black`
  const iconSize = 'var(--recursica-brand-dimensions-icon-default)'
  
  // Calculate percentage for the fill
  const percentage = ((value - min) / (max - min)) * 100
  
  const sliderId = id || `slider-${Math.random().toString(36).substr(2, 9)}`
  
  // Handle color: black when value is higher, element-text-color with low emphasis when lower
  const isHighValue = percentage > 30
  const thumbColor = disabled 
    ? `var(${layer1Base}-border-color)` 
    : isHighValue 
      ? `var(${blackColor})` 
      : `var(${layer0Base}-element-text-color)`
  
  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--recursica-brand-dimensions-spacer-xs)', 
        ...style 
      }}
    >
      {/* Min label */}
      <span style={{ 
        fontSize: 'var(--recursica-brand-typography-caption-font-size)',
        color: `var(${layer0Base}-element-text-color)`,
        opacity: `var(${layer0Base}-element-text-low-emphasis)`,
        flexShrink: 0,
        lineHeight: 1,
      }}>
        {min}
      </span>
      
      {/* Slider container */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          flex: 1, 
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Track background (light gray) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 4,
          transform: 'translateY(-50%)',
          backgroundColor: `var(${layer1Base}-border-color)`,
          borderRadius: 2,
          opacity: disabled ? 0.3 : 0.4,
        }} />
        
        {/* Filled track (colored) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: `${percentage}%`,
          height: 4,
          transform: 'translateY(-50%)',
          backgroundColor: `var(${interactiveColor})`,
          borderRadius: 2,
          opacity: disabled ? 0.3 : 1,
        }} />
        
        {/* Slider input */}
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            zIndex: 1,
          }}
        />
        
        {/* Custom thumb styling */}
        <style>{`
          #${sliderId}::-webkit-slider-thumb {
            appearance: none;
            -webkit-appearance: none;
            width: ${iconSize};
            height: ${iconSize};
            border-radius: 50%;
            background: ${thumbColor};
            opacity: ${disabled ? 0.3 : (isHighValue ? 1 : `var(${layer0Base}-element-text-low-emphasis)`)};
            border: none;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
            margin-top: calc(-1 * (${iconSize} - 4px) / 2);
          }
          
          #${sliderId}::-moz-range-thumb {
            width: ${iconSize};
            height: ${iconSize};
            border-radius: 50%;
            background: ${thumbColor};
            opacity: ${disabled ? 0.3 : (isHighValue ? 1 : `var(${layer0Base}-element-text-low-emphasis)`)};
            border: none;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          }
          
          #${sliderId}::-ms-thumb {
            width: ${iconSize};
            height: ${iconSize};
            border-radius: 50%;
            background: ${thumbColor};
            opacity: ${disabled ? 0.3 : (isHighValue ? 1 : `var(${layer0Base}-element-text-low-emphasis)`)};
            border: none;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          }
          
          #${sliderId}::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            background: transparent;
            border: none;
          }
          
          #${sliderId}::-moz-range-track {
            width: 100%;
            height: 4px;
            background: transparent;
            border: none;
          }
          
          #${sliderId}::-ms-track {
            width: 100%;
            height: 4px;
            background: transparent;
            border: none;
            color: transparent;
          }
        `}</style>
      </div>
      
      {/* Max label */}
      <span style={{ 
        fontSize: 'var(--recursica-brand-typography-caption-font-size)',
        color: `var(${layer0Base}-element-text-color)`,
        opacity: `var(${layer0Base}-element-text-low-emphasis)`,
        flexShrink: 0,
        lineHeight: 1,
      }}>
        {max}
      </span>
    </div>
  )
}
