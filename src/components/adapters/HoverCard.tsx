/**
 * HoverCard Component Adapter
 * 
 * Unified HoverCard component that renders the appropriate library implementation
 * based on the current UI kit selection. Shares styling with Popover via
 * the 'hover-card-popover' recursica_ui-kit.json entry.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { parseElevationValue } from '../utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { HoverCardProps } from './common/HoverCard'

// Re-exported so existing `import type { HoverCardProps } from '.../adapters/HoverCard'`
// call sites keep working — the types now live in common/HoverCard.ts.
export type { HoverCardProps } from './common/HoverCard'

export function HoverCard({
    children,
    content,
    isOpen,
    layer = 'layer-1',
    elevation,
    className,
    style,
    withBeak = false,
    position = 'bottom',
    zIndex,
    mantine,
    material,
    carbon,
}: HoverCardProps) {
    const Component = useComponent('HoverCard')

    // Get elevation from CSS vars if not provided as props
    const elevationVar = getComponentLevelCssVar('HoverCardPopover', 'elevation')

    // Reactively read elevation from CSS variable
    const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
        const value = readCssVar(elevationVar)
        return value ? parseElevationValue(value) : undefined
    })

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        const contentFontFamilyVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-family')
        const contentFontSizeVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-size')
        const contentFontWeightVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-weight')
        const contentLetterSpacingVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'letter-spacing')
        const contentLineHeightVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'line-height')
        const contentFontStyleVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-style')
        const contentTextDecorationVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'text-decoration')
        const contentTextTransformVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'text-transform')

        const textCssVars = [
            contentFontFamilyVar, contentFontSizeVar, contentFontWeightVar,
            contentLetterSpacingVar, contentLineHeightVar, contentFontStyleVar,
            contentTextDecorationVar, contentTextTransformVar
        ]

        const handleCssVarUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const shouldUpdateElevation = !detail?.cssVars || detail.cssVars.includes(elevationVar)
            const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))

            if (shouldUpdateElevation) {
                const value = readCssVar(elevationVar)
                setElevationFromVar(value ? parseElevationValue(value) : undefined)
            }

            if (shouldUpdateText) {
                setTextVarsUpdate(prev => prev + 1)
            }
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            const elevationValue = readCssVar(elevationVar)
            setElevationFromVar(elevationValue ? parseElevationValue(elevationValue) : undefined)
            setTextVarsUpdate(prev => prev + 1)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [elevationVar])

    const componentElevation = elevation ?? elevationFromVar ?? undefined

    return (
        <Suspense fallback={<span />}>
            <Component
                content={content}
                isOpen={isOpen}
                layer={layer}
                elevation={componentElevation}
                className={className}
                style={style}
                withBeak={withBeak}
                position={position}
                zIndex={zIndex}
                mantine={mantine}
                material={material}
                carbon={carbon}
            >
                {children}
            </Component>
        </Suspense>
    )
}
