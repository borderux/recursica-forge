/**
 * RadioButton Component Adapter
 * 
 * Unified RadioButton component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { RadioButtonProps } from './common/RadioButton'

// Re-exported so existing `import type { RadioButtonProps } from '.../adapters/RadioButton'`
// call sites keep working — the types now live in common/RadioButton.ts.
export type { RadioButtonProps } from './common/RadioButton'

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
