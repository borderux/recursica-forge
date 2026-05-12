/**
 * SwitchItem Component Adapter
 * 
 * SwitchItem represents a Switch with a label, configured in the Forge.
 * It wraps the Switch component.
 */

import { Suspense, useMemo, useEffect, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import { Switch, type SwitchProps } from './Switch'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import { genericLayerText } from '../../core/css/cssVarBuilder'
import { readCssVar } from '../../core/css/readCssVar'
import type { LibrarySpecificProps } from '../registry/types'

export type SwitchItemProps = SwitchProps & {
    label?: React.ReactNode
} & LibrarySpecificProps

export function SwitchItem(props: SwitchItemProps) {
    const Component = useComponent('SwitchItem')

    // Fallback behavior if component not found
    if (!Component) {
        const {
            checked,
            onChange,
            disabled,
            label,
            layer = 'layer-0',
            className,
            style,
            ...switchProps
        } = props

        const layerNum = layer.replace('layer-', '')

        // Get the label-gap CSS var
        const labelGapVar = buildComponentCssVarPath('SwitchItem', 'properties', 'label-gap')
        const labelMaxWidthVar = buildComponentCssVarPath('SwitchItem', 'properties', 'label-max-width')
        const disabledOpacityVar = buildComponentCssVarPath('SwitchItem', 'properties', 'disabled-opacity')

        // Get label text styling CSS variables
        const fontFamVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'font-family')
        const fontSizeVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'font-size')
        const fontWeightVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'font-weight')
        const letterSpacingVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'letter-spacing')
        const lineHeightVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'line-height')
        const textDecoVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'text-decoration')
        const textTransformVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'text-transform')
        const fontStyleVar = buildComponentCssVarPath('SwitchItem', 'properties', 'text', 'font-style')

        // Build layer text color CSS variables
        const textColor = buildComponentCssVarPath('SwitchItem', 'properties', 'colors', layer, 'text')
        const disabledTextColorVar = buildComponentCssVarPath('SwitchItem', 'properties', 'colors', layer, 'disabled-text')

        // State to force re-render when text CSS variables change
        const [textVarsUpdate, setTextVarsUpdate] = useState(0)

        // Listen for CSS variable updates from the toolbar
        useEffect(() => {
            const textCssVars = [
                fontFamVar, fontSizeVar, fontWeightVar, letterSpacingVar,
                lineHeightVar, textDecoVar, textTransformVar, fontStyleVar
            ]

            const handleCssVarUpdate = (e: Event) => {
                const detail = (e as CustomEvent).detail
                const updatedVars = detail?.cssVars || []
                const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) => textCssVars.includes(cssVar))
                if (shouldUpdate) {
                    setTextVarsUpdate(prev => prev + 1)
                }
            }

            window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

            const observer = new MutationObserver(() => {
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
        }, [fontFamVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecoVar, textTransformVar, fontStyleVar])

        const opacity = disabled ? `var(${disabledOpacityVar}, 0.5)` : 1
        const color = disabled ? `var(${disabledTextColorVar})` : `var(${textColor})`

        return (
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: `var(${labelGapVar}, 8px)`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity,
                    ...style,
                }}
                className={className}
            >
                <Switch
                    {...switchProps}
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    layer={layer}
                />
                {label && (
                    <span style={{
                        maxWidth: `var(${labelMaxWidthVar}, 200px)`,
                        display: 'inline-block',
                        fontFamily: `var(${fontFamVar})`,
                        fontSize: `var(${fontSizeVar})`,
                        fontWeight: `var(${fontWeightVar})`,
                        letterSpacing: `var(${letterSpacingVar})`,
                        lineHeight: `var(${lineHeightVar})`,
                        textDecoration: `var(${textDecoVar}, none)`,
                        textTransform: `var(${textTransformVar}, none)` as any,
                        fontStyle: `var(${fontStyleVar}, normal)`,
                        color,
                    }}>
                        {label}
                    </span>
                )}
            </label>
        )
    }

    return (
        <Suspense fallback={null}>
            <Component {...props} />
        </Suspense>
    )
}
