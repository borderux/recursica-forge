/**
 * RadioButtonItem Component Adapter
 * 
 * RadioButtonItem represents a RadioButton with a label, configured in the Forge.
 * It wraps the platform-specific implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { RadioButtonItemProps } from './common/RadioButtonItem'

// Re-exported so existing `import type { RadioButtonItemProps } from '.../adapters/RadioButtonItem'`
// call sites keep working — the types now live in common/RadioButtonItem.ts.
export type { RadioButtonItemProps } from './common/RadioButtonItem'

export function RadioButtonItem(props: RadioButtonItemProps) {
    const Component = useComponent('RadioButtonItem')

    return (
        <Suspense fallback={null}>
            <Component {...props} />
        </Suspense>
    )
}
