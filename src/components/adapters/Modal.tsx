/**
 * Modal Component Adapter
 * 
 * Unified Modal component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ModalProps = {
    children?: React.ReactNode
    content?: React.ReactNode // Slot content, can be text or component
    isOpen: boolean
    onClose: () => void
    title?: React.ReactNode
    showHeader?: boolean
    showFooter?: boolean
    scrollable?: boolean
    padding?: boolean
    showSecondaryButton?: boolean
    primaryActionLabel?: string
    onPrimaryAction?: () => void
    secondaryActionLabel?: string
    onSecondaryAction?: () => void
    primaryActionDisabled?: boolean
    secondaryActionDisabled?: boolean
    size?: string | number
    layer?: ComponentLayer
    elevation?: string // e.g., "elevation-0", "elevation-1", etc.
    className?: string
    style?: React.CSSProperties
    withOverlay?: boolean
    centered?: boolean
    position?: { x: number; y: number }
    trapFocus?: boolean
    zIndex?: number
    draggable?: boolean
    onPositionChange?: (position: { x: number; y: number }) => void
} & LibrarySpecificProps

export function Modal({
    children,
    content,
    isOpen,
    onClose,
    title,
    showHeader = true,
    showFooter = true,
    scrollable = false,
    padding = true,
    showSecondaryButton = true,
    primaryActionLabel = 'Save',
    onPrimaryAction,
    secondaryActionLabel = 'Cancel',
    onSecondaryAction,
    primaryActionDisabled = false,
    secondaryActionDisabled = false,
    size = 'md',
    layer = 'layer-1', // Default to layer-1 for modals as they usually sit on top
    elevation,
    className,
    style,
    withOverlay = true,
    centered = true,
    position,
    trapFocus,
    zIndex,
    draggable,
    onPositionChange,
    mantine,
    material,
    carbon,
}: ModalProps) {
    const Component = useComponent('Modal')
    const { mode } = useThemeMode()

    // Get elevation from CSS vars if not provided as props
    const elevationVar = getComponentLevelCssVar('Modal', 'elevation')

    // Reactively read elevation from CSS variable
    const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
        const value = readCssVar(elevationVar)
        return value ? parseElevationValue(value) : undefined
    })

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        // Get text CSS variables for reactive updates
        const headerFontFamilyVar = getComponentTextCssVar('Modal', 'header-text', 'font-family')
        const headerFontSizeVar = getComponentTextCssVar('Modal', 'header-text', 'font-size')
        const headerFontWeightVar = getComponentTextCssVar('Modal', 'header-text', 'font-weight')
        const headerLetterSpacingVar = getComponentTextCssVar('Modal', 'header-text', 'letter-spacing')
        const headerLineHeightVar = getComponentTextCssVar('Modal', 'header-text', 'line-height')
        const headerFontStyleVar = getComponentTextCssVar('Modal', 'header-text', 'font-style')
        const headerTextDecorationVar = getComponentTextCssVar('Modal', 'header-text', 'text-decoration')
        const headerTextTransformVar = getComponentTextCssVar('Modal', 'header-text', 'text-transform')

        const contentFontFamilyVar = getComponentTextCssVar('Modal', 'content-text', 'font-family')
        const contentFontSizeVar = getComponentTextCssVar('Modal', 'content-text', 'font-size')
        const contentFontWeightVar = getComponentTextCssVar('Modal', 'content-text', 'font-weight')
        const contentLetterSpacingVar = getComponentTextCssVar('Modal', 'content-text', 'letter-spacing')
        const contentLineHeightVar = getComponentTextCssVar('Modal', 'content-text', 'line-height')
        const contentFontStyleVar = getComponentTextCssVar('Modal', 'content-text', 'font-style')
        const contentTextDecorationVar = getComponentTextCssVar('Modal', 'content-text', 'text-decoration')
        const contentTextTransformVar = getComponentTextCssVar('Modal', 'content-text', 'text-transform')

        const textCssVars = [
            headerFontFamilyVar, headerFontSizeVar, headerFontWeightVar,
            headerLetterSpacingVar, headerLineHeightVar, headerFontStyleVar,
            headerTextDecorationVar, headerTextTransformVar,
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

    if (!Component) {
        // Basic fallback if no library implementation is available
        if (!isOpen) return null

        return (
            <div
                className={className}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    ...style
                }}
                onClick={onClose}
            >
                <div
                    style={getModalFallbackStyles(layer, componentElevation, mode)}
                    onClick={(e) => e.stopPropagation()}
                >
                    {showHeader && (
                        <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 'bold' }}>{title}</div>
                            <button onClick={onClose}>&times;</button>
                        </div>
                    )}
                    <div style={{ padding: padding ? '16px' : 0, overflowY: scrollable ? 'auto' : 'visible', flex: 1 }}>
                        {(() => {
                            const slotContent = content || children
                            if (!slotContent) return null
                            if (typeof slotContent === 'string') {
                                return <p style={{ margin: 0 }}>{slotContent}</p>
                            }
                            return slotContent
                        })()}
                    </div>
                    {showFooter && (
                        <div style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {showSecondaryButton && (
                                <button
                                    onClick={onSecondaryAction}
                                    disabled={secondaryActionDisabled}
                                >
                                    {secondaryActionLabel}
                                </button>
                            )}
                            <button
                                onClick={onPrimaryAction}
                                disabled={primaryActionDisabled}
                            >
                                {primaryActionLabel}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Suspense fallback={null}>
            <Component
                isOpen={isOpen}
                onClose={onClose}
                title={title}
                content={content}
                children={children}
                showHeader={showHeader}
                showFooter={showFooter}
                scrollable={scrollable}
                padding={padding}
                showSecondaryButton={showSecondaryButton}
                primaryActionLabel={primaryActionLabel}
                onPrimaryAction={onPrimaryAction}
                secondaryActionLabel={secondaryActionLabel}
                onSecondaryAction={onSecondaryAction}
                primaryActionDisabled={primaryActionDisabled}
                secondaryActionDisabled={secondaryActionDisabled}
                size={size}
                layer={layer}
                elevation={componentElevation}
                className={className}
                style={style}
                withOverlay={withOverlay}
                centered={centered}
                position={position}
                trapFocus={trapFocus}
                zIndex={zIndex}
                draggable={draggable}
                onPositionChange={onPositionChange}
                mantine={mantine}
                material={material}
                carbon={carbon}
            />
        </Suspense>
    )
}

function getModalFallbackStyles(
    layer: ComponentLayer,
    elevation?: string,
    mode: 'light' | 'dark' = 'light'
): React.CSSProperties {
    const bgVar = getComponentCssVar('Modal', 'colors', 'background', layer)
    const borderRadiusVar = getComponentLevelCssVar('Modal', 'border-radius')
    const minWidthVar = getComponentLevelCssVar('Modal', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Modal', 'max-width')

    const styles: React.CSSProperties = {
        backgroundColor: `var(${bgVar}, #fff)`,
        borderRadius: `var(${borderRadiusVar}, 8px)`,
        minWidth: `var(${minWidthVar}, 304px)`,
        maxWidth: `var(${maxWidthVar}, 542px)`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
    }

    const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
    if (elevationBoxShadow) {
        styles.boxShadow = elevationBoxShadow
    }

    return styles
}
