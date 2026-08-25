/**
 * Carbon Tabs.Tab Adapter
 *
 * No real Carbon primitive to delegate to — a plain button that tracks its own active state via
 * `TabsContext` and hand-sets every active/inactive style itself, all token-driven CSS custom
 * properties (color/background/border-radius/gap come from the root; text vars are computed
 * here, since they aren't funneled through the root's runtime custom properties).
 */

import React from 'react'
import { useTabsContext } from '../../common/tabsContext'
import { buildTabsTextVars } from '../../common/tabsCssVars'
import type { TabsTabProps } from '../../common/Tabs'

export default React.forwardRef<any, TabsTabProps>(function TabsTab({ value, children, leftSection, rightSection, disabled, style, className }, ref) {
    const { value: activeValue, onChange, variant } = useTabsContext('Tabs.Tab')
    const text = buildTabsTextVars()
    const isActive = activeValue === value
    const t = isActive ? text.active : text.inactive

    const handleClick = () => {
        if (!disabled) onChange?.(value)
    }

    return (
        <button
            ref={ref}
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={`recursica-tabs-tab ${className || ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'var(--recursica_tabs_content_align_flex, flex-start)',
                gap: 'var(--recursica_brand_dimensions_general_xs, 8px)',
                padding: 'var(--recursica_brand_dimensions_general_default, 12px)',
                border: 'none',
                borderBottom: variant !== 'pills' && isActive ? '2px solid var(--recursica_tabs_active_border-color)' : 'none',
                borderRadius: 'var(--recursica_tabs_border-radius, 0px)',
                background: isActive
                    ? 'var(--recursica_tabs_active_background, var(--recursica_brand_palettes_primary_100_color_tone, #e2e8f0))'
                    : 'var(--recursica_tabs_inactive_background, transparent)',
                color: isActive
                    ? 'var(--recursica_tabs_active_text-color, var(--recursica_brand_palettes_primary_100_color_on-tone, #1a202c))'
                    : 'var(--recursica_tabs_inactive_text-color, var(--recursica_brand_palettes_neutral_100_color_on-tone, #4a5568))',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                fontFamily: `var(${t.fontFamily})`,
                fontSize: `var(${t.fontSize})`,
                fontWeight: isActive ? `var(${t.fontWeight}, 600)` : `var(${t.fontWeight}, 400)`,
                letterSpacing: `var(${t.letterSpacing})`,
                lineHeight: `var(${t.lineHeight})`,
                textDecoration: `var(${t.textDecoration})`,
                textTransform: (t.textTransform ? `var(${t.textTransform})` : 'none') as React.CSSProperties['textTransform'],
                fontStyle: `var(${t.fontStyle})`,
                ...style,
            }}
        >
            {leftSection}
            {children}
            {rightSection}
        </button>
    )
})
