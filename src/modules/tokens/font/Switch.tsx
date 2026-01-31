import React, { useMemo } from 'react'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../components/utils/cssVarNames'

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
  // Build UIKit CSS var names using buildComponentCssVarPath (automatically includes mode)
  // Switch structure: components.switch.properties.colors.layer-0.thumb-selected
  const thumbSelectedVar = useMemo(() => {
    return buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'thumb-selected')
  }, [layer])

  const thumbUnselectedVar = useMemo(() => {
    return buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'thumb-unselected')
  }, [layer])

  const trackSelectedVar = useMemo(() => {
    return buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'track-selected')
  }, [layer])

  const trackUnselectedVar = useMemo(() => {
    return buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'track-unselected')
  }, [layer])

  const borderRadiusVar = useMemo(() => {
    return getComponentLevelCssVar('Switch', 'track-border-radius')
  }, [])

  const thumbSizeVar = useMemo(() => {
    return buildComponentCssVarPath('Switch', 'properties', 'thumb-width')
  }, [])

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
          background: checked 
            ? `var(${thumbSelectedVar})` 
            : `var(${thumbUnselectedVar})`,
          zIndex: 1,
          transition: 'left 0.2s',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      />
    </button>
  )
}

