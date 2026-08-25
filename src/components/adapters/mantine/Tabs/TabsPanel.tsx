/**
 * Mantine Tabs.Panel Adapter
 *
 * Clean pass-through — `value`/`children`/`style`/`className` all match the real `Tabs.Panel`
 * directly. `overStyled: true` is needed to pass `style`/`className` at all — a TS formality
 * (see `TabsList.tsx`'s header for the full reasoning), not an escape hatch for arbitrary
 * styling. Visibility is handled internally by the real Mantine `Tabs` (it only renders the
 * active panel's content), unlike Material/Carbon's `TabsPanel`, which has to check the active
 * value itself since it's a plain `<div>`, not a real Mantine tab-aware component.
 */

import React from 'react'
import { Tabs as MantineTabs } from '@recursica/mantine-adapter'
import type { TabsPanelProps } from '../../common/Tabs'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TabsPanelProps>(function TabsPanel({ value, children, style, className }, ref) {
    return (
        <MantineTabs.Panel overStyled value={value} style={style} className={className} ref={ref}>
            {children}
        </MantineTabs.Panel>
    )
})

// Compile-time only — fails the build the moment TabsPanelProps declares a prop with no real,
// type-compatible home on the real Tabs.Panel.
type _Wiring = AssertWired<TabsPanelProps, typeof MantineTabs.Panel>
const _wiringCheck: _Wiring = true
