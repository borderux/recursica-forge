/**
 * CompliancePage
 *
 * Shows all WCAG AA compliance issues in a compact, scannable table.
 * Grouped by type, with inline swatch previews and one-click fix buttons.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useCompliance } from '../../core/compliance/ComplianceContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import type { ComplianceIssue } from '../../core/compliance/ComplianceService'
import { getComplianceService } from '../../core/compliance/ComplianceService'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Badge } from '../../components/adapters/Badge'
import { Button } from '../../components/adapters/Button'
import { Link } from '../../components/adapters/Link'
import { Tooltip } from '../../components/adapters/Tooltip'
import { findColorFamilyAndLevel, getAllFamilyColorsByKey } from '../../core/compliance/layerColorStepping'
import { getVarsStore } from '../../core/store/varsStore'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVarNumber } from '../../core/css/readCssVar'
import { generateSuggestedTones } from './toneInterpolation'
import { SuggestTonesModal } from './SuggestTonesModal'
import { Modal } from '../../components/adapters/Modal'
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
 * Resolve the on-tone tooltip label for a compliance issue.
 * Try direct lookup first (works for unblended on-tones like warning/alert colors).
 * Only fall back to core-black/core-white resolution for blended palette on-tones.
 */
function formatOnToneLabel(issue: ComplianceIssue): string {
    try {
        // 1. Try direct lookup — works for layer-text, layer-interactive, and
        //    any on-tone whose hex exactly matches a scale color
        const directLabel = formatColorLabel(issue.onToneHex)
        if (directLabel) return directLabel

        // 2. For blended on-tones (palette/core issues where emphasis opacity
        //    is applied), determine if it's black-based or white-based and
        //    resolve the unblended core color from CSS vars
        const h = issue.onToneHex.replace('#', '')
        const r = parseInt(h.slice(0, 2), 16)
        const g = parseInt(h.slice(2, 4), 16)
        const b = parseInt(h.slice(4, 6), 16)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

        const th = issue.toneHex.replace('#', '')
        const tr = parseInt(th.slice(0, 2), 16)
        const tg = parseInt(th.slice(2, 4), 16)
        const tb = parseInt(th.slice(4, 6), 16)
        const toneLuminance = (0.299 * tr + 0.587 * tg + 0.114 * tb) / 255

        const isBlackBased = luminance < toneLuminance

        const coreVar = `--recursica-brand-themes-${issue.mode}-palettes-core-${isBlackBased ? 'black' : 'white'}`
        const resolved = getComputedStyle(document.documentElement).getPropertyValue(coreVar).trim()

        if (resolved && resolved.startsWith('#')) {
            const label = formatColorLabel(resolved)
            if (label) return label
        }

        return issue.onToneHex
    } catch {
        return issue.onToneHex
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
    const [suggestIssue, setSuggestIssue] = useState<ComplianceIssue | null>(null)

    // Snapshot issues so rows persist after fixing (not removed by auto-rescan)
    const snapshotRef = useRef<ComplianceIssue[] | null>(null)
    const resettingRef = useRef(false)

    // Initial snapshot: only set once on first render with data, and not during reset
    if (snapshotRef.current === null && issues.length > 0 && !resettingRef.current) {
        snapshotRef.current = [...issues]
    }

    // Track which issues have been fixed (id → original CSS var value for undo)
    const [fixedMap, setFixedMap] = useState<Record<string, string>>({})

    // Track suggest-tone fixes (id → { family, level, originalHex } for undo)
    const [suggestFixedMap, setSuggestFixedMap] = useState<Record<string, { family: string; level: string; originalHex: string }>>({})

    // Listen for reset events to clear local state
    useEffect(() => {
        const handleReset = () => {
            snapshotRef.current = null
            resettingRef.current = true
            setFixedMap({})
            setSuggestFixedMap({})
        }
        window.addEventListener('complianceReset', handleReset)
        return () => window.removeEventListener('complianceReset', handleReset)
    }, [])

    // After reset, wait for fresh issues from rescan then re-snapshot
    useEffect(() => {
        if (resettingRef.current && issues.length > 0) {
            snapshotRef.current = [...issues]
            resettingRef.current = false
        }
    }, [issues])

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
        const success = applySuggestion(issue.id)
        if (success) {
            setFixedMap(prev => ({ ...prev, [issue.id]: originalValue }))
        }
    }

    const handleUndo = (issue: ComplianceIssue) => {
        if (!issue.suggestion || !fixedMap[issue.id]) return
        // Restore the original CSS var value and persist to theme JSON
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (tokens) {
            updateCssVar(issue.suggestion.targetCssVar, fixedMap[issue.id], tokens)
            // Also persist the undo to theme JSON
            getComplianceService().persistUndo(issue.suggestion.targetCssVar, fixedMap[issue.id])
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
        setSuggestFixedMap({})
        runScan()
    }

    // Handle applying a suggested tone replacement
    const handleSuggestApply = (issue: ComplianceIssue, newHex: string, family: string, level: string) => {
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return

        // Store original hex for undo before modifying
        const tokensAny = tokens as any
        const originalHex = tokensAny?.tokens?.colors?.[family]?.[level]?.$value || ''

        // Deep clone tokens and update the scale level value
        const tokensCopy = JSON.parse(JSON.stringify(tokens))
        const colorsRoot = tokensCopy?.tokens?.colors || {}
        const scaleObj = colorsRoot[family]
        if (scaleObj && scaleObj[level]) {
            if (typeof scaleObj[level] === 'object' && '$value' in scaleObj[level]) {
                scaleObj[level].$value = newHex
            } else {
                scaleObj[level] = { $type: 'color', $value: newHex }
            }
        }

        // Normalize level for CSS var name
        const normalizedLevel = level === '000' ? '000' : level === '1000' ? '1000' : String(level).padStart(3, '0')

        // Directly update the token-level CSS var on the DOM as a safety net
        const tokenCssVar = `--recursica-tokens-colors-${family}-${normalizedLevel}`
        document.documentElement.style.setProperty(tokenCssVar, newHex)

        // Persist token change (triggers recomputeAndApplyAll)
        store.setTokens(tokensCopy)

        // Track for undo
        setSuggestFixedMap(prev => ({ ...prev, [issue.id]: { family, level, originalHex } }))

        // Re-scan after CSS vars rebuild (don't use handleRescan — it clears undo maps)
        setTimeout(() => {
            document.documentElement.style.setProperty(tokenCssVar, newHex)
            snapshotRef.current = null
            runScan()
        }, 500)
    }

    // Handle undoing a suggest-tone replacement
    const handleSuggestUndo = (issue: ComplianceIssue) => {
        const undoInfo = suggestFixedMap[issue.id]
        if (!undoInfo) return

        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return

        // Deep clone tokens and restore the original value
        const tokensCopy = JSON.parse(JSON.stringify(tokens))
        const colorsRoot = tokensCopy?.tokens?.colors || {}
        const scaleObj = colorsRoot[undoInfo.family]
        if (scaleObj && scaleObj[undoInfo.level]) {
            if (typeof scaleObj[undoInfo.level] === 'object' && '$value' in scaleObj[undoInfo.level]) {
                scaleObj[undoInfo.level].$value = undoInfo.originalHex
            }
        }

        // Normalize level for CSS var name
        const normalizedLevel = undoInfo.level === '000' ? '000' : undoInfo.level === '1000' ? '1000' : String(undoInfo.level).padStart(3, '0')
        const tokenCssVar = `--recursica-tokens-colors-${undoInfo.family}-${normalizedLevel}`
        document.documentElement.style.setProperty(tokenCssVar, undoInfo.originalHex)

        // Persist token change
        store.setTokens(tokensCopy)

        // Remove from undo map
        setSuggestFixedMap(prev => {
            const next = { ...prev }
            delete next[issue.id]
            return next
        })

        // Re-scan after restoring (don't use handleRescan — it clears undo maps)
        setTimeout(() => {
            document.documentElement.style.setProperty(tokenCssVar, undoInfo.originalHex)
            snapshotRef.current = null
            runScan()
        }, 500)
    }

    // Standard scale levels in order
    const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

    // Pre-compute which unfixable issues have compliant tone suggestions
    const suggestableIssues = useMemo(() => {
        const set = new Set<string>()
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return set

        // Include issues that have no fix suggestion, OR whose suggestion doesn't actually pass
        const unfixable = (snapshotRef.current || issues).filter(i =>
            !i.suggestion || (i.suggestion.resultingRatio < i.requiredRatio)
        )
        for (const issue of unfixable) {
            const info = findColorFamilyAndLevel(issue.toneHex, tokens)
            if (!info) continue

            const { family, level } = info
            const familyColors = getAllFamilyColorsByKey(family, tokens)
            if (familyColors.length === 0) continue

            const orderedLevels = issue.mode === 'dark' ? [...LEVELS].reverse() : [...LEVELS]
            const currentIdx = orderedLevels.indexOf(level)
            if (currentIdx === -1) continue

            const aboveIdx = currentIdx > 0 ? currentIdx - 1 : -1
            const belowIdx = currentIdx < orderedLevels.length - 1 ? currentIdx + 1 : -1
            const aboveLevel = aboveIdx >= 0 ? orderedLevels[aboveIdx] : null
            const belowLevel = belowIdx >= 0 ? orderedLevels[belowIdx] : null

            const colorMap = new Map(familyColors.map(c => [c.level, c.hex]))
            const aboveHex = aboveLevel ? colorMap.get(aboveLevel) || null : null
            const belowHex = belowLevel ? colorMap.get(belowLevel) || null : null
            const failingHex = colorMap.get(level) || issue.toneHex

            const emphasis = issue.emphasis || 'high'
            const emphasisVar = emphasis === 'high'
                ? `--recursica-brand-themes-${issue.mode}-text-emphasis-high`
                : `--recursica-brand-themes-${issue.mode}-text-emphasis-low`
            const emphasisOpacity = readCssVarNumber(emphasisVar, emphasis === 'high' ? 1 : 0.6)

            const tones = generateSuggestedTones(
                failingHex, aboveHex, belowHex,
                aboveLevel, belowLevel, level,
                emphasis, emphasisOpacity,
                issue.rawOnToneHex,
            )

            const hasCompliant = tones.some(t => !t.isReference && !t.isFailing && t.isCompliant)
            if (hasCompliant) set.add(issue.id)
        }
        return set
    }, [issues])


    const CheckIcon = iconNameToReactComponent('check-circle')
    const WrenchIcon = iconNameToReactComponent('wrench')
    const SunIcon = iconNameToReactComponent('sun')
    const MoonIcon = iconNameToReactComponent('moon')
    const ArrowRightIcon = iconNameToReactComponent('arrow-right')
    const ArrowUpIcon = iconNameToReactComponent('arrow-up')
    const ArrowDownIcon = iconNameToReactComponent('arrow-down')

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
                    <Button
                        variant="solid"
                        onClick={() => setShowConfirmAll(true)}
                        icon={WrenchIcon ? <WrenchIcon style={{ width: 14, height: 14 }} /> : undefined}
                        disabled={unfixedCount === 0}
                    >
                        Fix all{unfixedCount > 0 ? ` (${unfixedCount})` : ''}
                    </Button>
                </div>
            </div>

            {/* Confirm Fix All dialog */}
            <Modal
                isOpen={showConfirmAll}
                onClose={() => setShowConfirmAll(false)}
                title="Apply all fixes?"
                layer="layer-1"
                centered={true}
                showFooter={true}
                showSecondaryButton={true}
                secondaryActionLabel="Cancel"
                onSecondaryAction={() => setShowConfirmAll(false)}
                primaryActionLabel="Apply all"
                onPrimaryAction={handleFixAll}
                content={`This will apply ${unfixedCount} suggested fixes. Some changes may alter your theme's visual design.`}
            />

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


            {/* Issue tables grouped by type — only show when there are active issues */}
            {issues.length > 0 && Object.entries(groupedIssues).map(([type, groupIssues]) => (
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
                                    <th style={{ width: 400 }}>Location</th>
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
                                                opacity: (fixedMap[issue.id] || suggestFixedMap[issue.id]) ? 0.45 : 1,
                                            }}
                                        >
                                            {/* Mode */}
                                            <td className="compliance-table__td-center">
                                                {issue.mode === 'light'
                                                    ? SunIcon && <SunIcon style={{ width: 16, height: 16, opacity: 0.6 }} />
                                                    : MoonIcon && <MoonIcon style={{ width: 16, height: 16, opacity: 0.6 }} />
                                                }
                                            </td>

                                            {/* Issue swatch (current) — always show */}
                                            <td>
                                                <Tooltip label={formatOnToneLabel(issue)}>
                                                    <div
                                                        className="compliance-table__swatch"
                                                        style={{ backgroundColor: issue.toneHex }}
                                                    >
                                                        <span style={{ color: issue.onToneHex }}>Aa</span>
                                                    </div>
                                                </Tooltip>
                                            </td>

                                            {/* Fix swatch (suggested) — only show when there's a valid suggestion */}
                                            <td>
                                                {issue.suggestion && suggestionPasses ? (
                                                    <Tooltip label={formatColorLabel(issue.suggestion.suggestedHex) || issue.suggestion.suggestedHex}>
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
                                                {issue.suggestion && suggestionPasses ? (
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
                                                ) : suggestFixedMap[issue.id] ? (
                                                    <Button
                                                        variant="outline"
                                                        size="small"
                                                        onClick={() => handleSuggestUndo(issue)}
                                                    >
                                                        Undo
                                                    </Button>
                                                ) : suggestableIssues.has(issue.id) ? (
                                                    <Button
                                                        variant="outline"
                                                        size="small"
                                                        onClick={() => setSuggestIssue(issue)}
                                                    >
                                                        Suggest tones
                                                    </Button>
                                                ) : (
                                                    <span style={{ opacity: 0.5, fontSize: 12 }}>
                                                        Cannot find a compliant on-tone color for this tone
                                                    </span>
                                                )}
                                            </td>

                                            {/* Location (link) with emphasis icon */}
                                            <td>
                                                <Link
                                                    href={getIssueHref(issue)}
                                                    endIcon={
                                                        issue.emphasis === 'high' && ArrowUpIcon
                                                            ? <Tooltip label="High emphasis"><ArrowUpIcon style={{ width: 14, height: 14 }} /></Tooltip>
                                                            : issue.emphasis === 'low' && ArrowDownIcon
                                                                ? <Tooltip label="Low emphasis"><ArrowDownIcon style={{ width: 14, height: 14 }} /></Tooltip>
                                                                : undefined
                                                    }
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

            {/* Suggest Tones Modal */}
            {suggestIssue && (
                <SuggestTonesModal
                    issue={suggestIssue}
                    isOpen={!!suggestIssue}
                    onClose={() => setSuggestIssue(null)}
                    onApply={handleSuggestApply}
                />
            )}
        </div>
    )
}
