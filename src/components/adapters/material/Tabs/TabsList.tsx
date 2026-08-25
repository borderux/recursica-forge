/**
 * Material Tabs.List Adapter
 *
 * The real interactive MUI `<Tabs>` lives here, not on the root — it's the component that
 * actually owns `value`/`onChange`/keyboard nav. Color/border comes from the CSS custom
 * properties the root already set (`--recursica_tabs_*`, inherited); `pills` additionally
 * hides MUI's own sliding indicator bar and gives tabs a gap instead, since pills render as
 * separate chips rather than an underlined strip.
 */

import React from 'react'
import { Tabs as MaterialTabs } from '@mui/material'
import { useTabsContext } from '../../common/tabsContext'
import type { TabsListProps } from '../../common/Tabs'

export default React.forwardRef<any, TabsListProps>(function TabsList({ children, style, className }, ref) {
    const { value, onChange, orientation, variant } = useTabsContext('Tabs.List')

    const handleChange = (_e: React.SyntheticEvent, newValue: string) => {
        onChange?.(newValue)
    }

    return (
        <MaterialTabs
            ref={ref}
            value={value}
            onChange={handleChange}
            orientation={orientation}
            variant={variant === 'pills' ? 'scrollable' : 'standard'}
            className={className}
            sx={{
                borderRight: orientation === 'vertical' ? 1 : 0,
                borderBottom: orientation === 'horizontal' ? 1 : 0,
                borderColor: 'var(--recursica_tabs_inactive_border-color, divider)',
                '& .MuiTabs-indicator': {
                    backgroundColor: 'var(--recursica_tabs_active_border-color, primary.main)',
                },
                ...(variant === 'pills' && {
                    '& .MuiTabs-indicator': {
                        display: 'none',
                    },
                    '& .MuiTabs-flexContainer': {
                        gap: 'var(--recursica_brand_dimensions_general_default)',
                    },
                }),
                ...style,
            }}
        >
            {children}
        </MaterialTabs>
    )
})
