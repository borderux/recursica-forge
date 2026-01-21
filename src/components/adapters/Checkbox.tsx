/**
 * Checkbox Component Adapter
 * 
 * Unified Checkbox component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useRef, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type CheckboxProps = {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: CheckboxProps) {
  const Component = useComponent('Checkbox')
  
  if (!Component) {
    // Fallback to native checkbox if component not available
    const checkboxRef = useRef<HTMLInputElement>(null)
    
    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])
    
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
        className={className}
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checked && !indeterminate}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        {label && <span style={{ opacity: disabled ? 0.6 : 1 }}>{label}</span>}
      </label>
    )
  }
  
  return (
    <Suspense fallback={
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="checkbox" 
          checked={checked && !indeterminate} 
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          ref={(el) => {
            if (el) el.indeterminate = indeterminate
          }}
        />
        {label && <span>{label}</span>}
      </label>
    }>
      <Component
        checked={checked}
        indeterminate={indeterminate}
        onChange={onChange}
        disabled={disabled}
        label={label}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
