/**
 * SwitchItem Component Adapter
 * 
 * SwitchItem represents a Switch with a label, configured in the Forge.
 * It wraps the Switch component.
 */

import { Suspense, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { genericLayerText } from '../../core/css/cssVarBuilder'
import { readCssVar } from '../../core/css/readCssVar'
import type { SwitchItemProps } from './common/SwitchItem'
import { isLocalAdapter } from '../registry/activeAdapter'
import { SwitchItem as LocalSwitchItem } from './local/dispatch/SwitchItem'

// Re-exported so existing `import type { SwitchItemProps } from '.../adapters/SwitchItem'`
// call sites keep working — the types now live in common/SwitchItem.ts.
export type { SwitchItemProps } from './common/SwitchItem'

function SharedSwitchItem(props: SwitchItemProps) {
    const Component = useComponent('SwitchItem')

    return (
        <Suspense fallback={null}>
            <Component {...props} />
        </Suspense>
    )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const SwitchItem = (isLocalAdapter ? LocalSwitchItem : SharedSwitchItem) as typeof SharedSwitchItem
