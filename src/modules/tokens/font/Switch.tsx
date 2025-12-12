import React, { useMemo } from 'react'
import { toCssVarName } from '../../../components/utils/cssVarNames'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  layer?: string // e.g., "layer-0"
  colorVariant?: string // e.g., "default"
  sizeVariant?: string // e.g., "default"
}

export function Switch({ 
  checked, 
  onChange, 
  disabled = false,
  layer = 'layer-0',
  colorVariant = 'default',
  sizeVariant = 'default',
}: SwitchProps) {
  // Build UIKit CSS var names
  const thumbVar = useMemo(() => {
    const path = ['components', 'switch', 'color', layer, 'variant', colorVariant, 'thumb']
    return toCssVarName(path.join('.'))
  }, [layer, colorVariant])

  const trackSelectedVar = useMemo(() => {
    const path = ['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-selected']
    return toCssVarName(path.join('.'))
  }, [layer, colorVariant])

  const trackUnselectedVar = useMemo(() => {
    const path = ['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-unselected']
    return toCssVarName(path.join('.'))
  }, [layer, colorVariant])

  const borderRadiusVar = useMemo(() => {
    const path = ['components', 'switch', 'size', 'variant', sizeVariant, 'border-radius']
    return toCssVarName(path.join('.'))
  }, [sizeVariant])

  const thumbSizeVar = useMemo(() => {
    const path = ['components', 'switch', 'size', 'variant', sizeVariant, 'thumb-size']
    return toCssVarName(path.join('.'))
  }, [sizeVariant])

  // CSS variables already include the layer in the path
  // e.g., --recursica-ui-kit-components-switch-color-layer-0-variant-default-thumb
  // These will resolve to the correct layer-specific values from UIKit.json
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: '48px',
        height: '24px',
        borderRadius: `var(${borderRadiusVar})`,
        border: 'none',
        background: checked 
          ? `var(${trackSelectedVar})` 
          : `var(${trackUnselectedVar})`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        padding: '2px',
        outline: 'none',
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          onChange(!checked)
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: checked ? 'calc(100% - 20px - 2px)' : '2px',
          transform: 'translateY(-50%)',
          width: '20px',
          height: '20px',
          borderRadius: `var(${borderRadiusVar})`,
          background: `var(${thumbVar})`,
          zIndex: 1,
          transition: 'left 0.2s',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      />
    </button>
  )
}

