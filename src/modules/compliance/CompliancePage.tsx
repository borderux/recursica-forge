/**
 * CompliancePage
 *
 * Shell page for WCAG AA compliance. Renders two sections:
 * - ThemeCompliance: mode-specific palette, core, and layer issues
 * - ComponentCompliance: dual-mode component issues (must pass both light & dark)
 */

import React, { useEffect } from 'react'
import { useCompliance } from '../../core/compliance/ComplianceContext'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Button } from '../../components/adapters/Button'
import { genericLayerText, genericLayerProperty } from '../../core/css/cssVarBuilder'
import { ThemeCompliance } from './ThemeCompliance'
import { ComponentCompliance } from './ComponentCompliance'
import './CompliancePage.css'

export default function CompliancePage() {
    const { issues, componentIssues, runScan } = useCompliance()
    const { applySuggestion } = useCompliance()

    const CheckIcon = iconNameToReactComponent('check-circle')

    // Anchor scrolling: scroll to the issue matching the URL hash on mount
    useEffect(() => {
        const hash = window.location.hash.replace('#', '')
        if (!hash) return
        const timeout = setTimeout(() => {
            const el = document.getElementById(hash)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.classList.add('compliance-table__row--highlight')
                setTimeout(() => el.classList.remove('compliance-table__row--highlight'), 2000)
            }
        }, 300)
        return () => clearTimeout(timeout)
    }, [])

    const handleRescan = () => {
        runScan()
    }

    const totalIssues = issues.length + componentIssues.length

    return (
        <div
            className="compliance-page"
            style={{
                padding: 'var(--recursica_brand_dimensions_general_xl)',
                backgroundColor: `var(${genericLayerProperty(0, 'surface')})`,
                color: `var(${genericLayerText(0, 'color')})`,
                minHeight: '100%',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div className="compliance-page__header">
                <h1
                    style={{
                        fontSize: 'var(--recursica_brand_typography_h1-font-size)',
                        fontWeight: 'var(--recursica_brand_typography_h1-font-weight)',
                        fontFamily: 'var(--recursica_brand_typography_h1-font-family)',
                        letterSpacing: 'var(--recursica_brand_typography_h1-font-letter-spacing)',
                        lineHeight: 'var(--recursica_brand_typography_h1-line-height)',
                        color: `var(${genericLayerText(0, 'color')})`,
                        opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
                        margin: 0,
                    }}
                >
                    WCAG AA compliance
                </h1>
                <div className="compliance-page__header-actions">
                    <Button variant="outline" onClick={handleRescan}>
                        Rescan
                    </Button>
                </div>
            </div>

            {/* Empty state */}
            {totalIssues === 0 && (
                <div className="compliance-page__empty">
                    <div className="compliance-page__empty-icon" style={{
                        color: `var(--recursica_brand_palettes_palette-1_primary_color_tone)`,
                    }}>
                        {CheckIcon && <CheckIcon style={{
                            width: 'var(--recursica_brand_dimensions_icons_lg)',
                            height: 'var(--recursica_brand_dimensions_icons_lg)',
                        }} />}
                    </div>
                    <h3 style={{
                        margin: 0,
                        fontSize: 'var(--recursica_brand_typography_h3-font-size)',
                        fontWeight: 'var(--recursica_brand_typography_h3-font-weight)',
                        fontFamily: 'var(--recursica_brand_typography_h3-font-family)',
                        letterSpacing: 'var(--recursica_brand_typography_h3-font-letter-spacing)',
                        lineHeight: 'var(--recursica_brand_typography_h3-line-height)',
                        color: `var(${genericLayerText(0, 'color')})`,
                        opacity: `var(${genericLayerText(0, 'low-emphasis')})`,
                    }}>
                        All clear — no compliance issues!
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: 'var(--recursica_brand_typography_body-font-size)',
                        fontWeight: 'var(--recursica_brand_typography_body-font-weight)',
                        fontFamily: 'var(--recursica_brand_typography_body-font-family)',
                        letterSpacing: 'var(--recursica_brand_typography_body-font-letter-spacing)',
                        lineHeight: 'var(--recursica_brand_typography_body-line-height)',
                        color: `var(${genericLayerText(0, 'color')})`,
                        opacity: `var(${genericLayerText(0, 'low-emphasis')})`,
                    }}>
                        Your theme meets WCAG AA contrast requirements.
                    </p>
                </div>
            )}

            {/* Issue sections */}
            {totalIssues > 0 && (
                <>
                    <ThemeCompliance
                        issues={issues}
                        runScan={runScan}
                        applySuggestion={applySuggestion}
                    />
                    <ComponentCompliance
                        issues={componentIssues}
                        runScan={runScan}
                    />
                </>
            )}
        </div>
    )
}
