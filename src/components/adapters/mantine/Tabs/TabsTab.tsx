/**
 * Mantine Tabs.Tab Adapter
 *
 * Clean pass-through — `value`/`leftSection`/`rightSection`/`disabled`/`style`/`className` all
 * match the real `Tabs.Tab` directly. `overStyled: true` is needed to pass `style`/`className`
 * at all — a TS formality (see `TabsList.tsx`'s header for the full reasoning), not an
 * escape hatch for arbitrary styling. Active/inactive styling is entirely token-driven by the
 * real adapter's own CSS (`Tabs.module.css`), unlike Material/Carbon's `TabsTab`, which hand-set
 * the same colors/typography via CSS vars because neither library's own Tab primitive reads
 * Recursica tokens natively.
 */

import React from 'react'
import { Tabs as MantineTabs } from '@recursica/mantine-adapter'
import type { TabsTabProps } from '../../common/Tabs'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TabsTabProps>(function TabsTab({ value, children, leftSection, rightSection, disabled, style, className }, ref) {
    return (
        <MantineTabs.Tab
            overStyled
            value={value}
            leftSection={leftSection}
            rightSection={rightSection}
            disabled={disabled}
            style={style}
            className={className}
            ref={ref}
        >
            {children}
        </MantineTabs.Tab>
    )
})

// Compile-time only — fails the build the moment TabsTabProps declares a prop with no real,
// type-compatible home on the real Tabs.Tab.
type _Wiring = AssertWired<TabsTabProps, typeof MantineTabs.Tab>
const _wiringCheck: _Wiring = true
