/**
 * RadioButton Component Adapter
 * 
 * Unified RadioButton component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type RadioButtonProps = {
    selected: boolean
    onChange: (selected: boolean) => void
    disabled?: boolean
    label?: React.ReactNode
    value?: string
    layer?: ComponentLayer
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps

export function RadioButton({
    selected,
    onChange,
    disabled = false,
    label,
    value,
    layer = 'layer-0',
    className,
    style,
    mantine,
    material,
    carbon,
}: RadioButtonProps) {
    const Component = useComponent('RadioButton')

    if (!Component) {
        // Fallback to native radio if component not available
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
        <Suspense fallback={<span />}>
            <Component
                selected={selected}
                onChange={onChange}
                disabled={disabled}
                label={label}
                value={value}
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
