/**
 * Material Tabs Adapter
 *
 * MUI has no notion of Recursica's token-driven color/background/border-radius/gap, so this
 * root renders a plain layout `<div>` that computes them once (`buildTabsRootCssVars`) as CSS
 * custom properties and relies on ordinary inheritance to reach descendant `Tabs.Tab`s — the
 * real interactive MUI `<Tabs>` itself is rendered one level down, by `Tabs.List` (see
 * `TabsList.tsx`), since that's the component that actually owns MUI's `value`/`onChange`.
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
