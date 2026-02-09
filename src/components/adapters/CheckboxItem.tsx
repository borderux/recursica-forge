/**
 * CheckboxItem Component Adapter
 * 
 * CheckboxItem represents a Checkbox with a label, configured in the Forge.
 * It wraps the platform-specific implementation.
 */

import { Suspense, useRef, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { CheckboxProps } from './Checkbox'
import type { LibrarySpecificProps } from '../registry/types'

export type CheckboxItemProps = CheckboxProps & LibrarySpecificProps

export function CheckboxItem(props: CheckboxItemProps) {
  const Component = useComponent('CheckboxItem')
  
  // Fallback behavior if component not found (same as Checkbox fallback)
  if (!Component) {
    const { 
      checked, 
      indeterminate, 
      onChange, 
      disabled, 
      label, 
      className, 
      style 
    } = props

    const checkboxRef = useRef<HTMLInputElement>(null)
    
    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = !!indeterminate
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
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}
