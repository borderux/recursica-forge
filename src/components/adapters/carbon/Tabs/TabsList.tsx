/**
 * Carbon Tabs.List Adapter
 *
 * No real Carbon primitive to delegate to — a flexbox container of `Tabs.Tab` buttons, with a
 * border on whichever edge separates it from the panel content given the current orientation.
 */

import React from 'react'
import { useTabsContext } from '../../common/tabsContext'
import type { TabsListProps } from '../../common/Tabs'

export default React.forwardRef<any, TabsListProps>(function TabsList({ children, style, className }, ref) {
    const { orientation } = useTabsContext('Tabs.List')

    return (
        <div
            ref={ref}
            className={`recursica-tabs-list ${className || ''}`}
            style={{
                display: 'flex',
                flexDirection: orientation === 'vertical' ? 'column' : 'row',
                gap: 'var(--recursica_tabs_gap, 12px)',
                borderBottom: orientation === 'horizontal' ? '1px solid var(--recursica_tabs_inactive_border-color, var(--recursica_brand_palettes_neutral_100_color_border, #e2e8f0))' : 'none',
                borderRight: orientation === 'vertical' ? '1px solid var(--recursica_tabs_inactive_border-color, var(--recursica_brand_palettes_neutral_100_color_border, #e2e8f0))' : 'none',
                ...style,
            }}
        >
            {children}
        </div>
    )
})
