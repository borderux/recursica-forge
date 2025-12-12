/**
 * Switch Component Adapter
 * 
 * Unified Switch component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'
import { toCssVarName } from '../utils/cssVarNames'

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  layer?: ComponentLayer
  colorVariant?: string
  sizeVariant?: string
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Switch({
  checked,
  onChange,
  disabled = false,
  layer = 'layer-0',
  colorVariant = 'default',
  sizeVariant = 'default',
  className,
  style,
  mantine,
  material,
  carbon,
}: SwitchProps) {
  const Component = useComponent('Switch')
  
  if (!Component) {
    // Fallback to our custom Switch implementation
    // Build UIKit CSS var names - these already include the layer in the path
    // e.g., --recursica-ui-kit-components-switch-color-layer-0-variant-default-thumb
    const thumbVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'thumb'].join('.'))
    const trackSelectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-selected'].join('.'))
    const trackUnselectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-unselected'].join('.'))
    const borderRadiusVar = toCssVarName(['components', 'switch', 'size', 'variant', sizeVariant, 'border-radius'].join('.'))
    
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={className}
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
          ...style,
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
  
  return (
    <Suspense fallback={<div style={{ width: 48, height: 24 }} />}>
      <Component
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        layer={layer}
        colorVariant={colorVariant}
        sizeVariant={sizeVariant}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}

