/**
 * Tabs — shared CSS variable computation (Material + Carbon)
 *
 * Neither library's own Tabs primitive reads Recursica tokens natively, so Material's and
 * Carbon's `Tabs`/`Tabs.Tab` hand-set color/typography from these token-derived CSS custom
 * properties instead of getting it for free the way Mantine's real, fully token-driven CSS
 * does. The computation is identical for both kits — only the JSX consuming it differs — so it
 * lives here once rather than being duplicated in both `Tabs.tsx`/`TabsTab.tsx` pairs.
 */

import type { CSSProperties } from 'react'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../utils/cssVarNames'

type TabsVariant = 'default' | 'pills' | 'outline'
type TabsOrientation = 'horizontal' | 'vertical'

/**
 * Root-level color/background/border-radius/gap vars — computed once per `<Tabs>` and read by
 * descendant `Tabs.Tab`s via ordinary CSS custom property inheritance, rather than every tab
 * recomputing the same token lookups itself.
 */
export function buildTabsRootCssVars(variant: TabsVariant, layer: string, orientation: TabsOrientation): CSSProperties {
    const activeBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'properties', 'active', 'colors', layer, 'background-color')
    const activeBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'properties', 'active', 'colors', layer, 'border-color')
    const activeTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'properties', 'active', 'colors', layer, 'text-color')

    const inactiveBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'properties', 'inactive', 'colors', layer, 'background-color')
    const inactiveBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'properties', 'inactive', 'colors', layer, 'border-color')
    const inactiveTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'properties', 'inactive', 'colors', layer, 'text-color')

    const borderRadiusVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'properties', 'border-radius')
    const tabsContentGapVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variant, 'variants', 'orientation', orientation, 'properties', 'tabs-content-gap')

    return {
        '--recursica_tabs_active_background': activeBackgroundVar ? `var(${activeBackgroundVar})` : undefined,
        '--recursica_tabs_active_border-color': activeBorderColorVar ? `var(${activeBorderColorVar})` : undefined,
        '--recursica_tabs_active_text-color': activeTextColorVar ? `var(${activeTextColorVar})` : undefined,
        '--recursica_tabs_inactive_background': inactiveBackgroundVar ? `var(${inactiveBackgroundVar})` : undefined,
        '--recursica_tabs_inactive_border-color': inactiveBorderColorVar ? `var(${inactiveBorderColorVar})` : undefined,
        '--recursica_tabs_inactive_text-color': inactiveTextColorVar ? `var(${inactiveTextColorVar})` : undefined,
        '--recursica_tabs_border-radius': borderRadiusVar ? `var(${borderRadiusVar})` : undefined,
        '--recursica_tabs_gap': tabsContentGapVar ? `var(${tabsContentGapVar})` : undefined,
    } as CSSProperties
}

type TextVarSet = {
    fontFamily: string
    fontSize: string
    fontWeight: string
    letterSpacing: string
    lineHeight: string
    textDecoration: string
    textTransform: string
    fontStyle: string
}

export interface TabsTextVars {
    active: TextVarSet
    inactive: TextVarSet
}

/**
 * Per-tab text CSS var *paths* (not resolved values) — active/inactive text styling that
 * `Tabs.Tab` applies directly, since (unlike color/background) it isn't funneled through the
 * root's runtime custom properties above.
 */
export function buildTabsTextVars(): TabsTextVars {
    const set = (state: 'active-text' | 'inactive-text'): TextVarSet => ({
        fontFamily: getComponentTextCssVar('Tabs', state, 'font-family'),
        fontSize: getComponentTextCssVar('Tabs', state, 'font-size'),
        fontWeight: getComponentTextCssVar('Tabs', state, 'font-weight'),
        letterSpacing: getComponentTextCssVar('Tabs', state, 'letter-spacing'),
        lineHeight: getComponentTextCssVar('Tabs', state, 'line-height'),
        textDecoration: getComponentTextCssVar('Tabs', state, 'text-decoration'),
        textTransform: getComponentTextCssVar('Tabs', state, 'text-transform'),
        fontStyle: getComponentTextCssVar('Tabs', state, 'font-style'),
    })
    return { active: set('active-text'), inactive: set('inactive-text') }
}
