/**
 * RadioButtonItem Component Adapter
 * 
 * RadioButtonItem represents a RadioButton with a label, configured in the Forge.
 * It wraps the platform-specific implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { RadioButtonItemProps } from './common/RadioButtonItem'
import { isLocalAdapter } from '../registry/activeAdapter'
import { RadioButtonItem as LocalRadioButtonItem } from './local/dispatch/RadioButtonItem'

// Re-exported so existing `import type { RadioButtonItemProps } from '.../adapters/RadioButtonItem'`
// call sites keep working — the types now live in common/RadioButtonItem.ts.
export type { RadioButtonItemProps } from './common/RadioButtonItem'

function SharedRadioButtonItem(props: RadioButtonItemProps) {
    const Component = useComponent('RadioButtonItem')

    return (
        <Suspense fallback={null}>
            <Component {...props} />
        </Suspense>
    )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const RadioButtonItem = (isLocalAdapter ? LocalRadioButtonItem : SharedRadioButtonItem) as typeof SharedRadioButtonItem
