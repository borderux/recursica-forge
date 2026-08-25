/**
 * Mantine Tabs Adapter
 *
 * Root `<Tabs>` only — `Tabs.List`/`Tabs.Tab`/`Tabs.Panel` live in their own sibling files
 * (`TabsList.tsx`/`TabsTab.tsx`/`TabsPanel.tsx`), each its own registered component. Clean
 * pass-through: `value`/`defaultValue`/`onChange`/`orientation`/`variant`/`children` all match
 * the real props directly — the real Mantine `Tabs` manages controlled/uncontrolled active-tab
 * state itself, so this file doesn't need to.
 *
 * `tabContentAlignment` isn't a real root-`Tabs` prop (Mantine's alignment lives on `Tabs.List`)
 * — never reaches the real component. Provided on `TabsContext` instead, purely so `TabsList`
 * can read it (the only sub-component here that needs anything from context).
 *
 * `inverted`/`placement` (2026-08, added as real Forge props — previously only reachable,
 * Mantine-only, via the `mantine={{inverted:true}}`/`mantine={{placement:'right'}}` escape
 * hatch): both are real, native raw-`@mantine/core` `Tabs` props (confirmed in
 * `@mantine/core`'s own source — `inverted` only applies when `orientation="horizontal"`,
 * `placement` only when `orientation="vertical"`, each driving the real component's own
 * `data-inverted`/`data-placement` internally via its own context + `mod` system), which the
 * real adapter's `Tabs.tsx` correctly forwards (implicitly, via its untyped `...rest` spread —
 * neither is explicitly named there, but nothing blocks or drops them either). Passed directly
 * now instead of through the escape hatch, so they work the same way for every caller without
 * needing kit-specific knowledge.
 */

import React from 'react'
import { Tabs as MantineTabs } from '@recursica/mantine-adapter'
import { TabsContext } from '../../common/tabsContext'
import type { TabsProps } from '../../common/Tabs'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TabsProps>(function Tabs({
    value,
    defaultValue,
    onChange,
    orientation = 'horizontal',
    variant = 'default',
    tabContentAlignment = 'left',
    inverted,
    placement,
    layer = 'layer-0',
    children,
    mantine,
}, ref) {
    const contextValue = React.useMemo(
        () => ({ value, onChange, orientation, variant, layer, tabContentAlignment }),
        [value, onChange, orientation, variant, layer, tabContentAlignment]
    )

    return (
        <TabsContext.Provider value={contextValue}>
            <MantineTabs
                ref={ref}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                orientation={orientation}
                variant={variant}
                inverted={inverted}
                placement={placement}
                {...mantine}
            >
                {children}
            </MantineTabs>
        </TabsContext.Provider>
    )
})

// Compile-time only. `tabContentAlignment` is excluded: handled outside this file — see header.
type _Wiring = AssertWired<
    TabsProps,
    typeof MantineTabs,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'tabContentAlignment'
>
const _wiringCheck: _Wiring = true
