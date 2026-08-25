/**
 * Mantine Tabs.List Adapter
 *
 * `children`/`style`/`className` match the real `Tabs.List` directly — `overStyled: true` is
 * needed to pass `style`/`className` at all, purely a TS formality (the real `Tabs.List`'s type
 * gates them behind the `overStyled` discriminated union): these are Forge's own declared
 * `TabsListProps` fields, always meant to forward, not a caller-opt-in escape hatch — same
 * reasoning `mantine/Modal`/`mantine/Tooltip` already use for their own real, always-forwarded
 * props.
 *
 * `tabContentAlignment` isn't a prop of `Tabs.List` itself — it's read off the shared
 * `TabsContext` (set by the parent `<Tabs>`) and translated into `justify`, a real Mantine
 * `Tabs.List` prop. Material/Carbon's `TabsList` already drive the identical alignment via a
 * CSS var (`--recursica_tabs_content_align_flex`) for their hand-rolled flex containers — this
 * was the one kit where the same setting silently did nothing, since nothing ever read it here
 * (2026-08, fixed).
 */

import React from 'react'
import { Tabs as MantineTabs } from '@recursica/mantine-adapter'
import { useTabsContext } from '../../common/tabsContext'
import type { TabsListProps } from '../../common/Tabs'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TabsListProps>(function TabsList({ children, style, className }, ref) {
    const { tabContentAlignment } = useTabsContext('Tabs.List')

    const justify =
        tabContentAlignment === 'center' ? 'center' : tabContentAlignment === 'right' ? 'flex-end' : 'flex-start'

    return (
        <MantineTabs.List overStyled style={style} className={className} justify={justify} ref={ref}>
            {children}
        </MantineTabs.List>
    )
})

// Compile-time only — fails the build the moment TabsListProps declares a prop with no real,
// type-compatible home on the real Tabs.List.
type _Wiring = AssertWired<TabsListProps, typeof MantineTabs.List>
const _wiringCheck: _Wiring = true
