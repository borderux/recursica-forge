/**
 * RadioButton Component Adapter
 * 
 * Unified RadioButton component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { RadioButtonProps } from './common/RadioButton'
import { isLocalAdapter } from '../registry/activeAdapter'
import { RadioButton as LocalRadioButton } from './local/dispatch/RadioButton'

// Re-exported so existing `import type { RadioButtonProps } from '.../adapters/RadioButton'`
// call sites keep working — the types now live in common/RadioButton.ts.
export type { RadioButtonProps } from './common/RadioButton'

function SharedRadioButton({
    checked,
    onChange,
    disabled = false,
    label,
    value,
    layer = 'layer-0',
    className,
    style,
    mantine,
}: RadioButtonProps) {
    const Component = useComponent('RadioButton')

    return (
        <Suspense fallback={<span />}>
            <Component
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                label={label}
                value={value}
                layer={layer}
                className={className}
                style={style}
                mantine={mantine}
            />
        </Suspense>
    )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const RadioButton = (isLocalAdapter ? LocalRadioButton : SharedRadioButton) as typeof SharedRadioButton
