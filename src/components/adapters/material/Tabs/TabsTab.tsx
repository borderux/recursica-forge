/**
 * Material Tabs.Tab Adapter
 *
 * MUI clones its own `Tab` and injects `value`/`selected`/`onChange` itself once it's a child
 * of `Tabs.List`'s `<MaterialTabs>` — this only supplies the label content and the
 * active/inactive styling, all token-driven CSS custom properties (the root already computed
 * the color/background ones; the text ones are computed here, since — unlike color — they
 * aren't funneled through the root's runtime custom properties).
 */

import React from 'react'
import { Tab as MaterialTab } from '@mui/material'
import { useTabsContext } from '../../common/tabsContext'
import { buildTabsTextVars } from '../../common/tabsCssVars'
import type { TabsTabProps } from '../../common/Tabs'

// forwardRef isn't just style consistency here: MUI's `Tabs` clones each `Tab` child and
// attaches its own ref to it (to measure position for the sliding indicator) — without
// forwarding, that clone-and-measure step silently fails on a plain function component.
export default React.forwardRef<any, TabsTabProps>(function TabsTab({ value, children, leftSection, rightSection, disabled, style, className }, ref) {
    const { variant } = useTabsContext('Tabs.Tab')
    const text = buildTabsTextVars()

    return (
        <MaterialTab
            ref={ref}
            value={value}
            disabled={disabled}
            label={
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'var(--recursica_tabs_content_align_flex, flex-start)',
                        width: '100%',
                        gap: '8px',
                    }}
                >
                    {leftSection}
                    {children}
                    {rightSection}
                </div>
            }
            style={style}
            className={className}
            sx={{
                color: 'var(--recursica_tabs_inactive_text-color)',
                fontFamily: `var(${text.inactive.fontFamily})`,
                fontSize: `var(${text.inactive.fontSize})`,
                fontWeight: `var(${text.inactive.fontWeight})`,
                letterSpacing: `var(${text.inactive.letterSpacing})`,
                lineHeight: `var(${text.inactive.lineHeight})`,
                textDecoration: `var(${text.inactive.textDecoration})`,
                textTransform: text.inactive.textTransform ? `var(${text.inactive.textTransform})` : 'none',
                fontStyle: `var(${text.inactive.fontStyle})`,
                minHeight: 'unset',
                '&.Mui-selected': {
                    color: 'var(--recursica_tabs_active_text-color)',
                    fontFamily: `var(${text.active.fontFamily})`,
                    fontSize: `var(${text.active.fontSize})`,
                    fontWeight: `var(${text.active.fontWeight})`,
                    letterSpacing: `var(${text.active.letterSpacing})`,
                    lineHeight: `var(${text.active.lineHeight})`,
                    textDecoration: `var(${text.active.textDecoration})`,
                    textTransform: text.active.textTransform ? `var(${text.active.textTransform})` : 'none',
                    fontStyle: `var(${text.active.fontStyle})`,
                    backgroundColor: variant === 'pills' ? 'var(--recursica_tabs_active_background)' : 'transparent',
                },
                borderRadius: 'var(--recursica_tabs_border-radius, 0px)',
                ...(variant === 'pills' && {
                    backgroundColor: 'var(--recursica_tabs_inactive_background)',
                    border: '1px solid var(--recursica_tabs_inactive_border-color, transparent)',
                    '&.Mui-selected': {
                        border: '1px solid var(--recursica_tabs_active_border-color, transparent)',
                    },
                }),
            }}
        />
    )
})
