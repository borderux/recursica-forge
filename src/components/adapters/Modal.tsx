/**
 * Modal Component Adapter
 * 
 * Unified Modal component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { parseElevationValue } from '../utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ModalProps } from './common/Modal'

// Re-exported so existing `import type { ModalProps } from '.../adapters/Modal'`
// call sites keep working — the types now live in common/Modal.ts.
export type { ModalProps } from './common/Modal'

export function Modal({
    children,
    content,
    isOpen,
    onClose,
    title,
    showHeader = true,
    showCloseButton = true,
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
        const headerStyleVar = getComponentLevelCssVar('Modal', 'header-style')

        const contentStyleVar = getComponentLevelCssVar('Modal', 'content-style')

        const textCssVars = [
            headerStyleVar,
            contentStyleVar
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
        <Suspense fallback={null}>
            <Component
                isOpen={isOpen}
                onClose={onClose}
                title={title}
                content={content}
                children={children}
                showHeader={showHeader}
                showCloseButton={showCloseButton}
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
