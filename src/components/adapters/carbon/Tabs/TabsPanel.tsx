/**
 * Carbon Tabs.Panel Adapter
 *
 * No real Carbon tab-content primitive — a plain `<div>` that checks the active value itself
 * (via `TabsContext`) rather than a real tab-aware component like Mantine's `Tabs.Panel`.
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
