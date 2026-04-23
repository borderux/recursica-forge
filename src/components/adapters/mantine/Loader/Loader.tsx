/**
 * Mantine Loader Implementation
 * 
 * Renders all three Mantine loader types (oval, bars, dots) side by side.
 * Stroke-thickness and border-radius are applied via CSS custom properties
 * that target Mantine's internal ::after pseudo-element and child spans.
 */

import { useState, useEffect, useMemo } from 'react'
import { Loader as MantineLoader } from '@mantine/core'
import type { LoaderProps as AdapterLoaderProps } from '../../Loader'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Loader.css'

const FALLBACK_SIZES: Record<string, number> = {
    small: 24,
    default: 36,
    large: 48,
}

const FALLBACK_STROKE: Record<string, number> = {
    small: 3,
    default: 4,
    large: 5,
}

export default function Loader({
    size = 'default',
    className,
    style,
    mantine,
    ...props
}: AdapterLoaderProps) {
    const indicatorColorVar = buildComponentCssVarPath('Loader', 'properties', 'indicator-color')
    const trackColorVar = buildComponentCssVarPath('Loader', 'properties', 'track-color')
    const sizeVarName = buildComponentCssVarPath('Loader', 'variants', 'sizes', size, 'properties', 'size')
    const borderRadiusVarName = buildComponentCssVarPath('Loader', 'variants', 'sizes', size, 'properties', 'border-radius')
    const strokeVarName = buildComponentCssVarPath('Loader', 'variants', 'sizes', size, 'properties', 'thickness')

    const [updateKey, setUpdateKey] = useState(0)

    useEffect(() => {
        const handleCssVarUpdate = () => setUpdateKey(prev => prev + 1)
        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
        const observer = new MutationObserver(() => setUpdateKey(prev => prev + 1))
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [])

    const resolvedValues = useMemo(() => {
        const colorRaw = readCssVar(indicatorColorVar)
        const trackRaw = readCssVar(trackColorVar)
        const sizeRaw = readCssVar(sizeVarName)
        const borderRadiusRaw = readCssVar(borderRadiusVarName)
        const strokeRaw = readCssVar(strokeVarName)

        let numericSize = FALLBACK_SIZES[size] || 36
        if (sizeRaw) {
            const parsed = parseInt(sizeRaw, 10)
            if (!isNaN(parsed) && parsed > 0) numericSize = parsed
        }

        let strokeThickness = FALLBACK_STROKE[size] || 4
        if (strokeRaw) {
            const parsed = parseInt(strokeRaw, 10)
            if (!isNaN(parsed) && parsed > 0) strokeThickness = parsed
        }

        let borderRadius = '9999px'
        if (borderRadiusRaw) {
            const parsed = parseInt(borderRadiusRaw, 10)
            if (!isNaN(parsed)) borderRadius = `${parsed}px`
            else borderRadius = borderRadiusRaw
        }

        return { color: colorRaw || undefined, trackColor: trackRaw || undefined, size: numericSize, borderRadius, strokeThickness }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [indicatorColorVar, trackColorVar, sizeVarName, borderRadiusVarName, strokeVarName, size, updateKey])

    const loaderTypes: Array<'oval' | 'bars' | 'dots'> = ['oval', 'bars', 'dots']

    return (
        <div className={`recursica-loader ${className || ''}`} style={{ display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center', ...style }}>
            {loaderTypes.map(type => (
                <div key={type} className="recursica-loader-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div
                        className={`recursica-loader-wrapper recursica-loader-${type}`}
                        style={{
                            // These CSS custom properties are inherited by the Loader.css rules
                            // targeting Mantine's hashed internal classes and ::after pseudo-elements
                            '--rl-stroke': `${resolvedValues.strokeThickness}px`,
                            '--rl-border-radius': resolvedValues.borderRadius,

                        } as React.CSSProperties}
                    >
                        <MantineLoader
                            type={type}
                            size={resolvedValues.size}
                            color={resolvedValues.color}
                            style={{
                                ...(type === 'oval' && resolvedValues.trackColor ? { '--loader-track-color': resolvedValues.trackColor } : {}),
                            } as React.CSSProperties}
                            {...mantine}
                        />
                    </div>
                    <span className="recursica-loader-label" style={{ fontSize: 12, opacity: 0.5, textTransform: 'capitalize', fontFamily: 'var(--recursica_brand_fonts_primary, inherit)' }}>
                        {type}
                    </span>
                </div>
            ))}
        </div>
    )
}
