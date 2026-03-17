/**
 * Carbon Loader Implementation
 * 
 * Renders all three loader types (oval, bars, dots).
 * Uses CSS-based animations for all three since Carbon's Loading component
 * has limited type support. Uses CSS variables from recursica_ui-kit.json.
 */

import { useState, useEffect } from 'react'
import type { LoaderProps as AdapterLoaderProps } from '../../Loader'
import { getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { toCssVarName } from '../../../utils/cssVarNames'
import './Loader.css'

export default function Loader({
    size = 'default',
    className,
    style,
    carbon,
    ...props
}: AdapterLoaderProps) {
    // Get CSS variables for loader properties
    const indicatorColorVar = getComponentLevelCssVar('Loader', 'indicator-color')
    const trackColorVar = getComponentLevelCssVar('Loader', 'track-color')

    // Build variant-level CSS var names
    const mode = typeof document !== 'undefined'
        ? (document.documentElement.getAttribute('data-theme-mode') as 'light' | 'dark' | null) ?? 'light'
        : 'light'

    const sizeVar = toCssVarName(`components.loader.variants.sizes.${size}.properties.size`, mode)
    const borderRadiusVar = toCssVarName(`components.loader.variants.sizes.${size}.properties.border-radius`, mode)
    const strokeVar = toCssVarName(`components.loader.variants.sizes.${size}.properties.stroke-thickness`, mode)

    // Force re-render when CSS vars change
    const [, setUpdateKey] = useState(0)

    useEffect(() => {
        const handleCssVarUpdate = () => {
            setUpdateKey(prev => prev + 1)
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            setUpdateKey(prev => prev + 1)
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [])

    // Fallback px sizes
    const fallbackSize = size === 'small' ? '24px' : size === 'large' ? '48px' : '36px'
    const fallbackStroke = size === 'small' ? '3px' : size === 'large' ? '5px' : '4px'

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        justifyContent: 'center',
        '--loader-indicator-color': `var(${indicatorColorVar})`,
        '--loader-track-color': `var(${trackColorVar})`,
        '--loader-size-var': `var(${sizeVar}, ${fallbackSize})`,
        '--loader-border-radius': `var(${borderRadiusVar}, 50%)`,
        '--loader-stroke': `var(${strokeVar}, ${fallbackStroke})`,
        ...style,
    } as React.CSSProperties

    return (
        <div className={`recursica-loader recursica-loader-carbon ${className || ''}`} style={containerStyle}>
            {/* Oval - CSS-based spinner */}
            <div className="recursica-loader-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                    className="recursica-loader-oval-carbon"
                    style={{
                        width: `var(${sizeVar}, ${fallbackSize})`,
                        height: `var(${sizeVar}, ${fallbackSize})`,
                        borderRadius: `var(${borderRadiusVar}, 50%)`,
                        borderWidth: `var(${strokeVar}, ${fallbackStroke})`,
                    }}
                />
                <span className="recursica-loader-label" style={{ fontSize: 11, opacity: 0.6 }}>Oval</span>
            </div>

            {/* Bars - CSS-based animation */}
            <div className="recursica-loader-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="recursica-loader-bars-carbon" style={{
                    width: `var(${sizeVar}, ${fallbackSize})`,
                    height: `var(${sizeVar}, ${fallbackSize})`,
                }}>
                    <span /><span /><span /><span /><span />
                </div>
                <span className="recursica-loader-label" style={{ fontSize: 11, opacity: 0.6 }}>Bars</span>
            </div>

            {/* Dots - CSS-based animation */}
            <div className="recursica-loader-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="recursica-loader-dots-carbon" style={{
                    width: `var(${sizeVar}, ${fallbackSize})`,
                    height: `calc(var(${sizeVar}, ${fallbackSize}) * 0.35)`,
                }}>
                    <span /><span /><span />
                </div>
                <span className="recursica-loader-label" style={{ fontSize: 11, opacity: 0.6 }}>Dots</span>
            </div>
        </div>
    )
}
