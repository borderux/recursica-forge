/**
 * CompliancePage
 *
 * Shows all WCAG AA compliance issues in a compact, scannable table.
 * Grouped by type, with inline swatch previews and one-click fix buttons.
 */

import { useState, useMemo, useRef } from 'react'
import { useCompliance } from '../../core/compliance/ComplianceContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import type { ComplianceIssue } from '../../core/compliance/ComplianceService'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Badge } from '../../components/adapters/Badge'
import { Button } from '../../components/adapters/Button'
import { Link } from '../../components/adapters/Link'
import { Tooltip } from '../../components/adapters/Tooltip'
import { findColorFamilyAndLevel } from '../../core/compliance/layerColorStepping'
import { getVarsStore } from '../../core/store/varsStore'
import { updateCssVar } from '../../core/css/updateCssVar'
import './CompliancePage.css'

const typeLabels: Record<string, string> = {
    'palette-on-tone': 'Palette on-tone',
    'layer-text': 'Layer text',
    'layer-interactive': 'Layer interactive',
    'core-on-tone': 'Core color',
}

/**
 * Format a hex color into a human-readable scale label.
 * e.g. { family: 'scale-01', level: '500' } → 'Scale 1 / 500'
 */
function formatColorLabel(hex: string): string {
    try {
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return ''
        const info = findColorFamilyAndLevel(hex, tokens)
        if (!info) return ''
        // Convert 'scale-01' → 'Scale 1', 'scale-10' → 'Scale 10'
        const scaleMatch = info.family.match(/^scale-(\d+)$/)
        const familyLabel = scaleMatch
            ? `Scale ${parseInt(scaleMatch[1], 10)}`
            : info.family.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        return `${familyLabel} / ${info.level}`
    } catch {
        return ''
    }
}

/**
 * Build an href for an issue's target page, including ?mode= query param.
 */
function getIssueHref(issue: ComplianceIssue): string {
    let path: string
    switch (issue.type) {
        case 'palette-on-tone':
        case 'core-on-tone':
            path = '/theme/palettes'
            break
        case 'layer-text':
        case 'layer-interactive':
            path = '/theme/layers'
            break
        default:
            path = '/theme/core-properties'
    }
    return `${path}?mode=${issue.mode}`
}

export default function CompliancePage() {
    const { issues, applySuggestion, applyAllSuggestions, runScan } = useCompliance()
    const { mode } = useThemeMode()
    const [showConfirmAll, setShowConfirmAll] = useState(false)

    // Snapshot issues on mount so rows persist after fixing
    const snapshotRef = useRef<ComplianceIssue[] | null>(null)
    if (snapshotRef.current === null && issues.length > 0) {
        snapshotRef.current = [...issues]
    }

    // Track which issues have been fixed (id → original CSS var value for undo)
    const [fixedMap, setFixedMap] = useState<Record<string, string>>({})

    const displayIssues = snapshotRef.current ?? issues

    const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`
    const layer1Base = `--recursica-brand-themes-${mode}-layers-layer-1-properties`
    const layer0Elements = layer0Base.replace('-properties', '-elements')

    const groupedIssues = useMemo(() => {
        const groups: Record<string, ComplianceIssue[]> = {}
        displayIssues.forEach(issue => {
            const groupKey = issue.type
            if (!groups[groupKey]) groups[groupKey] = []
            groups[groupKey].push(issue)
        })
        return groups
    }, [displayIssues])

    const unfixedCount = displayIssues.filter(i =>
        i.suggestion && !fixedMap[i.id] && i.suggestion.resultingRatio >= i.requiredRatio
    ).length

    const handleFix = (issue: ComplianceIssue) => {
        if (!issue.suggestion) return
        // Store the original value before applying the fix
        const style = getComputedStyle(document.documentElement)
        const originalValue = style.getPropertyValue(issue.suggestion.targetCssVar).trim()
        applySuggestion(issue.id)
        setFixedMap(prev => ({ ...prev, [issue.id]: originalValue }))
    }

    const handleUndo = (issue: ComplianceIssue) => {
        if (!issue.suggestion || !fixedMap[issue.id]) return
        // Restore the original CSS var value
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (tokens) {
            updateCssVar(issue.suggestion.targetCssVar, fixedMap[issue.id], tokens)
        }
        setFixedMap(prev => {
            const next = { ...prev }
            delete next[issue.id]
            return next
        })
    }

    const handleFixAll = () => {
        displayIssues.forEach(issue => {
            if (issue.suggestion && !fixedMap[issue.id] && issue.suggestion.resultingRatio >= issue.requiredRatio) {
                handleFix(issue)
            }
        })
        setShowConfirmAll(false)
    }

    const handleRescan = () => {
        snapshotRef.current = null
        setFixedMap({})
        runScan()
    }


    const CheckIcon = iconNameToReactComponent('check-circle')
    const WrenchIcon = iconNameToReactComponent('wrench')
    const SunIcon = iconNameToReactComponent('sun')
    const MoonIcon = iconNameToReactComponent('moon')
    const ArrowRightIcon = iconNameToReactComponent('arrow-right')

    return (
        <div
            className="compliance-page"
            style={{
                padding: 'var(--recursica-brand-dimensions-general-xl)',
                backgroundColor: `var(${layer0Base}-surface)`,
                color: `var(${layer0Elements}-text-color)`,
                minHeight: '100%',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div className="compliance-page__header">
                <h1
                    style={{
                        fontSize: 'var(--recursica-brand-typography-h1-font-size)',
                        fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
                        fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
                        letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
                        lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
                        color: `var(${layer0Elements}-text-color)`,
                        opacity: `var(${layer0Elements}-text-high-emphasis)`,
                        margin: 0,
                    }}
                >
                    WCAG AA compliance
                </h1>
                <div className="compliance-page__header-actions">
                    <Button variant="outline" onClick={handleRescan}>
                        Rescan
                    </Button>
                    {unfixedCount > 0 && (
                        <Button
                            variant="solid"
                            onClick={() => setShowConfirmAll(true)}
                            icon={WrenchIcon ? <WrenchIcon style={{ width: 14, height: 14 }} /> : undefined}
                        >
                            Fix all ({unfixedCount})
                        </Button>
                    )}
                </div>
            </div>

            {/* Confirm Fix All dialog */}
            {showConfirmAll && (
                <div
                    className="compliance-page__confirm-overlay"
                    onClick={() => setShowConfirmAll(false)}
                >
                    <div
                        className="compliance-page__confirm-dialog"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: `var(${layer1Base}-surface)`,
                            color: `var(${layer0Elements}-text-color)`,
                            borderColor: `var(${layer0Base}-border-color)`,
                        }}
                    >
                        <h3 style={{ margin: '0 0 8px 0' }}>Apply all fixes?</h3>
                        <p style={{
                            margin: '0 0 16px 0',
                            opacity: `var(${layer0Elements}-text-low-emphasis)`,
                            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                        }}>
                            This will apply {unfixedCount} suggested fixes. Some changes may alter your theme's visual design.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => setShowConfirmAll(false)}>
                                Cancel
                            </Button>
                            <Button variant="solid" onClick={handleFixAll}>
                                Apply all
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {issues.length === 0 && (
                <div className="compliance-page__empty" style={{
                    color: `var(${layer0Elements}-text-color)`,
                    opacity: `var(${layer0Elements}-text-low-emphasis)`,
                }}>
                    <div className="compliance-page__empty-icon">
                        {CheckIcon && <CheckIcon style={{ width: 48, height: 48 }} />}
                    </div>
                    <p style={{ fontSize: 'var(--recursica-brand-typography-h3-font-size, 18px)' }}>
                        All clear — no compliance issues!
                    </p>
                    <p style={{ fontSize: 'var(--recursica-brand-typography-body-small-font-size)' }}>
                        Your theme meets WCAG AA contrast requirements.
                    </p>
                </div>
            )}

            {/* Issue tables grouped by type */}
            {Object.entries(groupedIssues).map(([type, groupIssues]) => (
                <div key={type} className="compliance-page__group">
                    <h2
                        className="compliance-page__group-title"
                        style={{
                            fontSize: 'var(--recursica-brand-typography-h2-font-size)',
                            fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
                            fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
                            letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
                            lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
                            color: `var(${layer0Elements}-text-color)`,
                            opacity: `var(${layer0Elements}-text-high-emphasis)`,
                        }}
                    >
                        {typeLabels[type] || type}
                        <Badge variant="alert" size="small">
                            {groupIssues.length} {groupIssues.length === 1 ? 'issue' : 'issues'}
                        </Badge>
                    </h2>

                    <div
                        className="compliance-table__wrapper"
                        style={{
                            borderColor: `var(${layer0Base}-border-color)`,
                            backgroundColor: `var(${layer1Base}-surface)`,
                        }}
                    >
                        <table className="compliance-table">
                            <thead>
                                <tr style={{ borderColor: `var(${layer0Base}-border-color)` }}>
                                    <th style={{ width: 48 }} className="compliance-table__th-center">Mode</th>
                                    <th style={{ width: 72, textAlign: 'center' }}>Issue</th>
                                    <th style={{ width: 72, textAlign: 'center' }}>Fix</th>
                                    <th></th>
                                    <th style={{ width: 200 }}>Location</th>
                                    <th style={{ width: 170 }}>Contrast ratios</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupIssues.map(issue => {
                                    const suggestionPasses = issue.suggestion
                                        ? issue.suggestion.resultingRatio >= issue.requiredRatio
                                        : false
                                    return (
                                        <tr
                                            key={issue.id}
                                            className="compliance-table__row"
                                            style={{
                                                borderColor: `var(${layer0Base}-border-color)`,
                                                opacity: fixedMap[issue.id] ? 0.45 : 1,
                                            }}
                                        >
                                            {/* Mode */}
                                            <td className="compliance-table__td-center">
                                                {issue.mode === 'light'
                                                    ? SunIcon && <SunIcon style={{ width: 16, height: 16, opacity: 0.6 }} />
                                                    : MoonIcon && <MoonIcon style={{ width: 16, height: 16, opacity: 0.6 }} />
                                                }
                                            </td>

                                            {/* Issue swatch (current) */}
                                            <td>
                                                <Tooltip label={formatColorLabel(issue.onToneHex)}>
                                                    <div
                                                        className="compliance-table__swatch"
                                                        style={{ backgroundColor: issue.toneHex }}
                                                    >
                                                        <span style={{ color: issue.onToneHex }}>Aa</span>
                                                    </div>
                                                </Tooltip>
                                            </td>

                                            {/* Fix swatch (suggested) */}
                                            <td>
                                                {issue.suggestion ? (
                                                    <Tooltip label={formatColorLabel(issue.suggestion.suggestedHex)}>
                                                        <div
                                                            className="compliance-table__swatch"
                                                            style={{ backgroundColor: issue.toneHex }}
                                                        >
                                                            <span style={{ color: issue.suggestion.suggestedHex }}>Aa</span>
                                                        </div>
                                                    </Tooltip>
                                                ) : (
                                                    <span style={{ opacity: 0.25 }}>—</span>
                                                )}
                                            </td>

                                            {/* Fix / Undo button or message */}
                                            <td>
                                                {issue.suggestion && (
                                                    suggestionPasses ? (
                                                        fixedMap[issue.id] ? (
                                                            <Button
                                                                variant="outline"
                                                                size="small"
                                                                onClick={() => handleUndo(issue)}
                                                            >
                                                                Undo
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="small"
                                                                onClick={() => handleFix(issue)}
                                                                title={issue.suggestion.description}
                                                                icon={WrenchIcon ? <WrenchIcon style={{ width: 12, height: 12 }} /> : undefined}
                                                            >
                                                                Fix
                                                            </Button>
                                                        )
                                                    ) : (
                                                        <span style={{
                                                            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                                                            opacity: 0.5,
                                                        }}>
                                                            Cannot find a compliant on-tone color for this tone
                                                        </span>
                                                    )
                                                )}
                                            </td>

                                            {/* Location (link) */}
                                            <td>
                                                <Link
                                                    href={getIssueHref(issue)}
                                                >
                                                    {issue.location}
                                                </Link>
                                            </td>

                                            {/* Combined ratios */}
                                            <td>
                                                <div className="compliance-table__ratios">
                                                    <Badge variant="alert" size="small">
                                                        {issue.contrastRatio.toFixed(1)}:1
                                                    </Badge>
                                                    {issue.suggestion && suggestionPasses && (
                                                        <>
                                                            {ArrowRightIcon && (
                                                                <ArrowRightIcon style={{ width: 12, height: 12, opacity: 0.4, flexShrink: 0 }} />
                                                            )}
                                                            <Badge variant="success" size="small">
                                                                {issue.suggestion.resultingRatio.toFixed(1)}:1
                                                            </Badge>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    )
}
