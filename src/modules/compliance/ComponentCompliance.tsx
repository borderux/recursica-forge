/**
 * ComponentCompliance — Dual-mode component WCAG AA compliance section
 *
 * Shows component text/icon contrast issues with both light and dark mode
 * results side-by-side. Components use mode-agnostic UIKit references that
 * must pass AA in both modes simultaneously.
 */

import React, { useState, useMemo, useCallback } from 'react'
import type { ComponentComplianceIssue } from '../../core/compliance/ComplianceService'
import { getVarsStore } from '../../core/store/varsStore'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Badge } from '../../components/adapters/Badge'
import { Button } from '../../components/adapters/Button'
import { Link } from '../../components/adapters/Link'
import { Tooltip } from '../../components/adapters/Tooltip'
import { Modal } from '../../components/adapters/Modal'
import { genericLayerText, genericLayerProperty } from '../../core/css/cssVarBuilder'

interface ComponentComplianceProps {
    issues: ComponentComplianceIssue[]
    runScan: () => void
}

export function ComponentCompliance({ issues, runScan }: ComponentComplianceProps) {
    const [fixedMap, setFixedMap] = useState<Record<string, string>>({})
    const [showConfirmAll, setShowConfirmAll] = useState(false)
    const [isFixingAll, setIsFixingAll] = useState(false)

    const WrenchIcon = iconNameToReactComponent('wrench')
    const SunIcon = iconNameToReactComponent('sun')
    const MoonIcon = iconNameToReactComponent('moon')
    const ArrowRightIcon = iconNameToReactComponent('arrow-right')

    // Group by component name
    const groupedIssues = useMemo(() => {
        const groups: Record<string, ComponentComplianceIssue[]> = {}
        issues.forEach(issue => {
            if (!groups[issue.componentName]) groups[issue.componentName] = []
            groups[issue.componentName].push(issue)
        })
        return groups
    }, [issues])

    const compGroupKeys = Object.keys(groupedIssues).sort()

    const unfixedCount = issues.filter(i => i.suggestion && !fixedMap[i.id]).length

    const handleFix = useCallback((issue: ComponentComplianceIssue) => {
        if (!issue.suggestion) return
        const store = getVarsStore()
        // Apply the fix to both modes via the light-mode var (the UIKit resolver generates both)
        store.writeCssVarsDirect({ [issue.suggestion.targetCssVar]: issue.suggestion.suggestedValue })
        setFixedMap(prev => ({ ...prev, [issue.id]: issue.suggestion!.suggestedValue }))
        setTimeout(() => { runScan() }, 500)
    }, [runScan])

    const handleFixAll = useCallback(() => {
        setIsFixingAll(true)
        requestAnimationFrame(() => {
            setTimeout(() => {
                const store = getVarsStore()
                const updates: Record<string, string> = {}
                issues.forEach(issue => {
                    if (issue.suggestion && !fixedMap[issue.id]) {
                        updates[issue.suggestion.targetCssVar] = issue.suggestion.suggestedValue
                        setFixedMap(prev => ({ ...prev, [issue.id]: issue.suggestion!.suggestedValue }))
                    }
                })
                if (Object.keys(updates).length > 0) {
                    store.writeCssVarsDirect(updates)
                    setTimeout(() => { runScan() }, 500)
                }
                setIsFixingAll(false)
                setShowConfirmAll(false)
            }, 0)
        })
    }, [issues, fixedMap, runScan])

    const getComponentHref = (issue: ComponentComplianceIssue): string => {
        const path = `/components/${issue.componentName}`
        const params = new URLSearchParams()

        // Extract layer and variant from the issue ID for deep linking
        const layerMatch = issue.id.match(/layer-(\d+)/)
        if (layerMatch) params.set('layer', `layer-${layerMatch[1]}`)

        const prefix = `comp-${issue.componentName}-`
        const afterPrefix = issue.id.startsWith(prefix) ? issue.id.slice(prefix.length) : ''
        const variantValue = afterPrefix.split('-layer-')[0]

        if (variantValue) {
            const formFields = [
                'text-field', 'textarea', 'dropdown', 'autocomplete', 'number-input',
                'date-picker', 'time-picker', 'file-input', 'file-upload', 'transfer-list'
            ]
            if (formFields.includes(issue.componentName)) {
                params.set('states', variantValue)
            } else if (['button', 'chip', 'badge'].includes(issue.componentName)) {
                params.set('style', variantValue)
            }
        }

        const qs = params.toString()
        return qs ? `${path}?${qs}` : path
    }

    const groupHeadingStyle: React.CSSProperties = {
        fontSize: 'var(--recursica_brand_typography_h3-font-size)',
        fontWeight: 'var(--recursica_brand_typography_h3-font-weight)',
        fontFamily: 'var(--recursica_brand_typography_h3-font-family)',
        letterSpacing: 'var(--recursica_brand_typography_h3-font-letter-spacing)',
        lineHeight: 'var(--recursica_brand_typography_h3-line-height)',
        color: `var(${genericLayerText(0, 'color')})`,
        opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
        margin: 0,
    }

    if (compGroupKeys.length === 0) return null

    const renderGroup = (compName: string, groupIssues: ComponentComplianceIssue[]) => {
        const label = compName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        return (
            <div key={compName} className="compliance-page__group">
                <h3 className="compliance-page__group-title" style={groupHeadingStyle}>
                    {label}
                    <Badge variant="alert" size="small">
                        {groupIssues.length} {groupIssues.length === 1 ? 'issue' : 'issues'}
                    </Badge>
                </h3>

                <div
                    className="compliance-table__wrapper"
                    data-recursica-layer="1"
                    style={{
                        borderColor: `var(${genericLayerProperty(0, 'border-color')})`,
                        backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
                    }}
                >
                    <table className="compliance-table">
                        <thead>
                            <tr style={{ borderColor: `var(${genericLayerProperty(0, 'border-color')})` }}>
                                <th style={{ width: 72, textAlign: 'center' }}>
                                    {SunIcon && <SunIcon style={{ width: 14, height: 14, opacity: 0.6, verticalAlign: 'middle' }} />}
                                </th>
                                <th style={{ width: 72, textAlign: 'center' }}>
                                    {MoonIcon && <MoonIcon style={{ width: 14, height: 14, opacity: 0.6, verticalAlign: 'middle' }} />}
                                </th>
                                <th></th>
                                <th style={{ width: 400 }}>Location</th>
                                <th style={{ width: 90, textAlign: 'center' }}>
                                    {SunIcon && <SunIcon style={{ width: 12, height: 12, opacity: 0.4, verticalAlign: 'middle', marginRight: 4 }} />}
                                    Ratio
                                </th>
                                <th style={{ width: 90, textAlign: 'center' }}>
                                    {MoonIcon && <MoonIcon style={{ width: 12, height: 12, opacity: 0.4, verticalAlign: 'middle', marginRight: 4 }} />}
                                    Ratio
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupIssues.map(issue => {
                                const isFixed = !!fixedMap[issue.id]
                                return (
                                    <tr
                                        key={issue.id}
                                        id={issue.id}
                                        className="compliance-table__row"
                                        style={{
                                            borderColor: `var(${genericLayerProperty(0, 'border-color')})`,
                                            opacity: isFixed ? 0.45 : 1,
                                        }}
                                    >
                                        {/* Light mode swatch */}
                                        <td>
                                            <div className="compliance-table__swatch" style={{ backgroundColor: issue.light.bgHex }}>
                                                <span style={{ color: issue.light.fgHex }}>Aa</span>
                                            </div>
                                        </td>

                                        {/* Dark mode swatch */}
                                        <td>
                                            <div className="compliance-table__swatch" style={{ backgroundColor: issue.dark.bgHex }}>
                                                <span style={{ color: issue.dark.fgHex }}>Aa</span>
                                            </div>
                                        </td>

                                        {/* Fix button */}
                                        <td>
                                            {issue.suggestion ? (
                                                isFixed ? (
                                                    <span style={{ opacity: 0.5, fontSize: 12 }}>Applied</span>
                                                ) : (
                                                    <Button
                                                        variant="outline" size="small"
                                                        onClick={() => handleFix(issue)}
                                                        title={issue.suggestion.description}
                                                        icon={WrenchIcon ? <WrenchIcon style={{ width: 12, height: 12 }} /> : undefined}
                                                    >Fix</Button>
                                                )
                                            ) : (
                                                <Tooltip label="No color found that passes both light and dark mode simultaneously">
                                                    <span style={{ opacity: 0.5, fontSize: 12 }}>
                                                        No dual-mode fix
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </td>

                                        {/* Location */}
                                        <td>
                                            <Link href={getComponentHref(issue)}>
                                                {issue.location}
                                            </Link>
                                        </td>

                                        {/* Light ratio */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Badge
                                                variant={issue.light.passes ? 'success' : 'alert'}
                                                size="small"
                                            >
                                                {issue.light.contrastRatio.toFixed(1)}:1
                                            </Badge>
                                        </td>

                                        {/* Dark ratio */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Badge
                                                variant={issue.dark.passes ? 'success' : 'alert'}
                                                size="small"
                                            >
                                                {issue.dark.contrastRatio.toFixed(1)}:1
                                            </Badge>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="compliance-page__section">
            <h2 className="compliance-page__section-title" style={{
                fontSize: 'var(--recursica_brand_typography_h2-font-size)',
                fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
                fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
                letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
                lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
                color: `var(${genericLayerText(0, 'color')})`,
                opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
                margin: 0,
                justifyContent: 'space-between',
                width: '100%',
            }}>
                Components
                <Button
                    variant="solid" size="small"
                    onClick={() => setShowConfirmAll(true)}
                    icon={WrenchIcon ? <WrenchIcon style={{ width: 14, height: 14 }} /> : undefined}
                    disabled={unfixedCount === 0}
                >
                    Fix all components{unfixedCount > 0 ? ` (${unfixedCount})` : ''}
                </Button>
            </h2>

            {compGroupKeys.map(key => renderGroup(key, groupedIssues[key]))}

            <Modal
                isOpen={showConfirmAll}
                onClose={() => !isFixingAll && setShowConfirmAll(false)}
                title="Apply all component fixes?"
                layer="layer-1"
                centered={true}
                showFooter={true}
                showSecondaryButton={true}
                secondaryActionLabel="Cancel"
                onSecondaryAction={() => !isFixingAll && setShowConfirmAll(false)}
                secondaryActionDisabled={isFixingAll}
                primaryActionLabel={isFixingAll ? 'Fixing...' : 'Apply all'}
                onPrimaryAction={handleFixAll}
                primaryActionDisabled={isFixingAll}
                content={`This will apply ${unfixedCount} fixes that pass both light and dark mode. Some changes may alter your component's visual design.`}
            />
        </div>
    )
}
