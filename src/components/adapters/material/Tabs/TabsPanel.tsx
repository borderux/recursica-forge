/**
 * Material Tabs.Panel Adapter
 *
 * MUI's `Tabs`/`Tab` don't manage panel content themselves, so this is a plain `<div>` that
 * checks the active value itself (via `TabsContext`) rather than a real tab-aware component
 * like Mantine's `Tabs.Panel`.
 */

import React from 'react'
import { useTabsContext } from '../../common/tabsContext'
import type { TabsPanelProps } from '../../common/Tabs'

export default React.forwardRef<any, TabsPanelProps>(function TabsPanel({ value, children, style, className }, ref) {
    const { value: activeValue } = useTabsContext('Tabs.Panel')
    if (activeValue !== value) return null

    return (
        <div ref={ref} className={`recursica-tabs-panel ${className || ''}`} style={{ flex: 1, ...style }}>
            {children}
        </div>
    )
})
