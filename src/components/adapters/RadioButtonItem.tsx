/**
 * RadioButtonItem Component Adapter
 * 
 * RadioButtonItem represents a RadioButton with a label, configured in the Forge.
 * It wraps the platform-specific implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { RadioButtonProps } from './RadioButton'
import type { LibrarySpecificProps } from '../registry/types'

export type RadioButtonItemProps = RadioButtonProps & LibrarySpecificProps

export function RadioButtonItem(props: RadioButtonItemProps) {
    const Component = useComponent('RadioButtonItem')

    // Fallback behavior if component not found (same as RadioButton fallback)
    if (!Component) {
        const {
            selected,
            onChange,
            disabled,
            label,
            value,
            className,
            style
        } = props

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
                    type="radio"
                    checked={selected}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    value={value}
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
