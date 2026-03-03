/**
 * Hook to read pagination configuration CSS variables.
 * Returns the current variant, size, and display settings for pagination elements.
 *
 * These correspond to properties in UIKit.json pagination section:
 *   - active-pages.style   → button variant (solid/outline/text)
 *   - active-pages.size    → button size (default/small)
 *   - inactive-pages.style → button variant
 *   - inactive-pages.size  → button size
 *   - navigation-controls.style   → button variant
 *   - navigation-controls.size    → button size
 *   - navigation-controls.display → icon | text | icon+text
 */

import { useState, useEffect, useCallback } from 'react'
import { buildComponentCssVarPath } from '../../utils/cssVarNames'
import { readCssVar } from '../../../core/css/readCssVar'

type ButtonVariant = 'solid' | 'outline' | 'text'
type ButtonSize = 'default' | 'small'
type NavDisplay = 'icon' | 'text' | 'icon+text'

interface PaginationConfig {
    activeStyle: ButtonVariant
    activeSize: ButtonSize
    inactiveStyle: ButtonVariant
    inactiveSize: ButtonSize
    navStyle: ButtonVariant
    navSize: ButtonSize
    navDisplay: NavDisplay
}

const DEFAULTS: PaginationConfig = {
    activeStyle: 'solid',
    activeSize: 'small',
    inactiveStyle: 'outline',
    inactiveSize: 'small',
    navStyle: 'text',
    navSize: 'small',
    navDisplay: 'icon',
}

function readConfigValue<T extends string>(cssVar: string, fallback: T): T {
    const raw = readCssVar(cssVar)
    if (!raw) return fallback
    const cleaned = raw.trim().replace(/^["']|["']$/g, '')
    return (cleaned || fallback) as T
}

export function usePaginationConfig(): PaginationConfig {
    const activeStyleVar = buildComponentCssVarPath('Pagination', 'properties', 'active-pages', 'style')
    const activeSizeVar = buildComponentCssVarPath('Pagination', 'properties', 'active-pages', 'size')
    const inactiveStyleVar = buildComponentCssVarPath('Pagination', 'properties', 'inactive-pages', 'style')
    const inactiveSizeVar = buildComponentCssVarPath('Pagination', 'properties', 'inactive-pages', 'size')
    const navStyleVar = buildComponentCssVarPath('Pagination', 'properties', 'navigation-controls', 'style')
    const navSizeVar = buildComponentCssVarPath('Pagination', 'properties', 'navigation-controls', 'size')
    const navDisplayVar = buildComponentCssVarPath('Pagination', 'properties', 'navigation-controls', 'display')

    const readAll = useCallback((): PaginationConfig => ({
        activeStyle: readConfigValue<ButtonVariant>(activeStyleVar, DEFAULTS.activeStyle),
        activeSize: readConfigValue<ButtonSize>(activeSizeVar, DEFAULTS.activeSize),
        inactiveStyle: readConfigValue<ButtonVariant>(inactiveStyleVar, DEFAULTS.inactiveStyle),
        inactiveSize: readConfigValue<ButtonSize>(inactiveSizeVar, DEFAULTS.inactiveSize),
        navStyle: readConfigValue<ButtonVariant>(navStyleVar, DEFAULTS.navStyle),
        navSize: readConfigValue<ButtonSize>(navSizeVar, DEFAULTS.navSize),
        navDisplay: readConfigValue<NavDisplay>(navDisplayVar, DEFAULTS.navDisplay),
    }), [activeStyleVar, activeSizeVar, inactiveStyleVar, inactiveSizeVar, navStyleVar, navSizeVar, navDisplayVar])

    const [config, setConfig] = useState<PaginationConfig>(readAll)

    useEffect(() => {
        const handleUpdate = () => {
            setConfig(readAll())
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)
        window.addEventListener('cssVarsReset', handleUpdate)
        const observer = new MutationObserver(handleUpdate)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
        return () => {
            window.removeEventListener('cssVarsUpdated', handleUpdate)
            window.removeEventListener('cssVarsReset', handleUpdate)
            observer.disconnect()
        }
    }, [readAll])

    return config
}
