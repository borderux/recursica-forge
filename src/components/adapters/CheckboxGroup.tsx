/**
 * CheckboxGroup Component Adapter
 * 
 * Groups multiple CheckboxItems together, handling layout and common properties.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type CheckboxGroupProps = {
    children?: React.ReactNode
    label?: React.ReactNode
    description?: React.ReactNode
    error?: React.ReactNode
    required?: boolean
    padding?: string // CSS var or token
    itemGap?: string // CSS var or token
    orientation?: 'horizontal' | 'vertical'
    layer?: ComponentLayer
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps

export function CheckboxGroup(props: CheckboxGroupProps) {
    const Component = useComponent('CheckboxGroup')

    if (!Component) {
        // Fallback
        return (
            <div style={{ display: 'flex', flexDirection: props.orientation === 'horizontal' ? 'row' : 'column', gap: props.itemGap || '8px', ...props.style }} className={props.className}>
                {props.label && <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{props.label}</div>}
                {props.children}
                {props.error && <div style={{ color: 'red', fontSize: '0.8em', marginTop: '4px' }}>{props.error}</div>}
            </div>
        )
    }

    return (
        <Suspense fallback={null}>
            <Component {...props} />
        </Suspense>
    )
}
