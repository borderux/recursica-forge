/**
 * Material UI Loader Implementation
 * 
 * Renders all three loader types (oval, bars, dots) using MUI CircularProgress
 * for oval, and CSS-based animations for bars and dots.
 * Uses CSS variables from recursica_ui-kit.json for indicator color, track color, size,
 * border-radius, and stroke-thickness.
 */

import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import type { LoaderProps as AdapterLoaderProps } from '../../Loader'
import { getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { toCssVarName } from '../../../utils/cssVarNames'
import './Loader.css'

export default function Loader({
    size = 'default',
    className,
    style,
    material,
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

    // Map size to px for MUI fallback
    const muiSize = size === 'small' ? 24 : size === 'large' ? 48 : 36
    const fallbackStroke = size === 'small' ? '3px' : size === 'large' ? '5px' : '4px'

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        justifyContent: 'center',
        '--loader-indicator-color': `var(${indicatorColorVar})`,
        '--loader-track-color': `var(${trackColorVar})`,
        '--loader-size-var': `var(${sizeVar}, ${muiSize}px)`,
        '--loader-border-radius': `var(${borderRadiusVar}, 50%)`,
        '--loader-stroke': `var(${strokeVar}, ${fallbackStroke})`,
        ...style,
    } as React.CSSProperties

    return (
        <div className={`recursica-loader recursica-loader-material ${className || ''}`} style={containerStyle}>
            {/* Oval - use MUI CircularProgress */}
            <div className="recursica-loader-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CircularProgress
                    size={muiSize}
                    className="recursica-loader-oval"
                    sx={{
                        color: `var(${indicatorColorVar})`,
                        width: `var(${sizeVar}, ${muiSize}px) !important`,
                        height: `var(${sizeVar}, ${muiSize}px) !important`,
                        '& circle': {
                            strokeWidth: `var(${strokeVar}, ${fallbackStroke})`,
                        },
                    }}
                    {...material}
                />
                <span className="recursica-loader-label" style={{ fontSize: 11, opacity: 0.6 }}>Oval</span>
            </div>

            {/* Bars - CSS-based animation */}
            <div className="recursica-loader-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="recursica-loader-bars" style={{
                    width: `var(${sizeVar}, ${muiSize}px)`,
                    height: `var(${sizeVar}, ${muiSize}px)`,
                    borderRadius: `var(${borderRadiusVar}, 50%)`,
                }}>
                    <span /><span /><span /><span /><span />
                </div>
                <span className="recursica-loader-label" style={{ fontSize: 11, opacity: 0.6 }}>Bars</span>
            </div>

            {/* Dots - CSS-based animation */}
            <div className="recursica-loader-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="recursica-loader-dots" style={{
                    width: `var(${sizeVar}, ${muiSize}px)`,
                    height: `calc(var(${sizeVar}, ${muiSize}px) * 0.35)`,
                }}>
                    <span /><span /><span />
                </div>
                <span className="recursica-loader-label" style={{ fontSize: 11, opacity: 0.6 }}>Dots</span>
            </div>
        </div>
    )
}
