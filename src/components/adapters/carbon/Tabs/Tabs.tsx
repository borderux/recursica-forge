/**
 * Carbon Tabs Adapter
 *
 * Carbon has no native Tabs component, and no notion of Recursica's token-driven color/
 * background/border-radius/gap either — this root renders a plain layout `<div>` that computes
 * those once (`buildTabsRootCssVars`) as CSS custom properties and relies on ordinary
 * inheritance to reach descendant `Tabs.Tab`s. `Tabs.List`/`Tabs.Tab` (see their own files) are
 * hand-rolled buttons in the same style, since there's no real Carbon primitive to delegate to.
 */

import React from 'react'
import { buildTabsRootCssVars } from '../../common/tabsCssVars'
import { TabsContext } from '../../common/tabsContext'
import type { TabsProps } from '../../common/Tabs'

export default React.forwardRef<any, TabsProps>(function Tabs({
    value,
    defaultValue,
    onChange,
    orientation = 'horizontal',
    variant = 'default',
    tabContentAlignment = 'left',
    layer = 'layer-0',
    children,
    className,
    style,
}, ref) {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const activeValue = value !== undefined ? value : internalValue

    const handleChange = (val: string | null) => {
        if (value === undefined) setInternalValue(val ?? undefined)
        onChange?.(val)
    }

    const contextValue = React.useMemo(
        () => ({ value: activeValue, onChange: handleChange, orientation, variant, layer, tabContentAlignment }),
        [activeValue, orientation, variant, layer, tabContentAlignment]
    )

    const cssVars = buildTabsRootCssVars(variant, layer, orientation)

    return (
        <TabsContext.Provider value={contextValue}>
            <div
                ref={ref}
                className={`recursica-tabs ${className || ''}`}
                data-recursica-layer={layer.replace('layer-', '')}
                style={{
                    display: 'flex',
                    flexDirection: orientation === 'vertical' ? 'row' : 'column',
                    gap: 'var(--recursica_tabs_gap, 16px)',
                    ...cssVars,
                    ...style,
                }}
            >
                {children}
            </div>
        </TabsContext.Provider>
    )
})
