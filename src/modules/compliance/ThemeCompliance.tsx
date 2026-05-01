/**
 * ThemeCompliance — Theme-specific WCAG AA compliance section
 *
 * Renders palette on-tone, core on-tone, layer text, and layer interactive
 * issues. These are mode-specific (light/dark managed independently).
 */

import React, { useState, useMemo, useCallback } from 'react'
import type { ComplianceIssue } from '../../core/compliance/ComplianceService'
import { getComplianceService } from '../../core/compliance/ComplianceService'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Badge } from '../../components/adapters/Badge'
import { Button } from '../../components/adapters/Button'
import { Link } from '../../components/adapters/Link'
import { Tooltip } from '../../components/adapters/Tooltip'
import { findColorFamilyAndLevel, getAllFamilyColorsByKey, traceToTokenRef } from '../../core/compliance/layerColorStepping'
import { getVarsStore } from '../../core/store/varsStore'
import { tokenColors, genericLayerText, genericLayerProperty, paletteCore, textEmphasis } from '../../core/css/cssVarBuilder'
import { updateCssVar } from '../../core/css/updateCssVar'
import { updateBrandValue } from '../../core/css/updateBrandValue'
import { readCssVarNumber } from '../../core/css/readCssVar'
import { generateSuggestedTones } from './toneInterpolation'
import { SuggestTonesModal } from './SuggestTonesModal'
import { Modal } from '../../components/adapters/Modal'

const typeLabels: Record<string, string> = {
    'palette-on-tone': 'Palette on-tone',
    'layer-text': 'Layer text',
    'layer-interactive': 'Layer interactive',
    'core-on-tone': 'Core color',
}

function formatColorLabel(hex: string): string {
    try {
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return ''
        const info = findColorFamilyAndLevel(hex, tokens)
        if (!info) return ''
        const scaleMatch = info.family.match(/^scale-(\d+)$/)
        const familyLabel = scaleMatch
            ? `Scale ${parseInt(scaleMatch[1], 10)}`
            : info.family.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        return `${familyLabel} / ${info.level}`
    } catch {
        return ''
    }
}

function formatOnToneLabel(issue: ComplianceIssue): string {
    try {
        const directLabel = formatColorLabel(issue.onToneHex)
        if (directLabel) return directLabel

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
        const coreVar = paletteCore(issue.mode, isBlackBased ? 'black' : 'white')
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

function getIssueHref(issue: ComplianceIssue): string {
    let path: string
    const params = new URLSearchParams()
    params.set('mode', issue.mode)

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
    return `${path}?${params.toString()}`
}

interface ThemeComplianceProps {
    issues: ComplianceIssue[]
    runScan: () => void
    applySuggestion: (id: string) => boolean
}

export function ThemeCompliance({ issues, runScan, applySuggestion }: ThemeComplianceProps) {
    const [fixedMap, setFixedMap] = useState<Record<string, string>>({})
    const [suggestFixedMap, setSuggestFixedMap] = useState<Record<string, { family: string; level: string; originalHex: string }>>({})
    const [suggestIssue, setSuggestIssue] = useState<ComplianceIssue | null>(null)
    const [showConfirmAll, setShowConfirmAll] = useState(false)
    const [isFixingAll, setIsFixingAll] = useState(false)

    const WrenchIcon = iconNameToReactComponent('wrench')
    const SunIcon = iconNameToReactComponent('sun')
    const MoonIcon = iconNameToReactComponent('moon')
    const ArrowRightIcon = iconNameToReactComponent('arrow-right')
    const ArrowUpIcon = iconNameToReactComponent('arrow-up')
    const ArrowDownIcon = iconNameToReactComponent('arrow-down')

    const THEME_TYPES = ['palette-on-tone', 'core-on-tone', 'layer-text', 'layer-interactive']

    const groupedIssues = useMemo(() => {
        const groups: Record<string, ComplianceIssue[]> = {}
        issues.forEach(issue => {
            if (THEME_TYPES.includes(issue.type)) {
                if (!groups[issue.type]) groups[issue.type] = []
                groups[issue.type].push(issue)
            }
        })
        return groups
    }, [issues])

    const themeGroupKeys = THEME_TYPES.filter(t => !!groupedIssues[t])

    const unfixedCount = issues.filter(i =>
        THEME_TYPES.includes(i.type) && i.suggestion && !fixedMap[i.id] && i.suggestion.resultingRatio >= i.requiredRatio
    ).length

    const handleFix = useCallback((issue: ComplianceIssue) => {
        if (!issue.suggestion) return
        const style = getComputedStyle(document.documentElement)
        const originalValue = style.getPropertyValue(issue.suggestion.targetCssVar).trim()
        const success = applySuggestion(issue.id)
        if (success) {
            setFixedMap(prev => ({ ...prev, [issue.id]: originalValue }))
        }
    }, [applySuggestion])

    const handleUndo = useCallback((issue: ComplianceIssue) => {
        if (!issue.suggestion || !fixedMap[issue.id]) return
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (tokens) {
            updateCssVar(issue.suggestion.targetCssVar, fixedMap[issue.id], tokens)
            getComplianceService().persistUndo(issue.suggestion.targetCssVar, fixedMap[issue.id])
        }
        setFixedMap(prev => {
            const next = { ...prev }
            delete next[issue.id]
            return next
        })
    }, [fixedMap])

    const handleFixAll = useCallback(() => {
        setIsFixingAll(true)
        requestAnimationFrame(() => {
            setTimeout(() => {
                issues.forEach(issue => {
                    if (THEME_TYPES.includes(issue.type) && issue.suggestion && !fixedMap[issue.id] && issue.suggestion.resultingRatio >= issue.requiredRatio) {
                        handleFix(issue)
                    }
                })
                setIsFixingAll(false)
                setShowConfirmAll(false)
            }, 0)
        })
    }, [issues, fixedMap, handleFix])

    const handleSuggestApply = useCallback((issue: ComplianceIssue, newHex: string, family: string, level: string, newOnToneColor?: 'white' | 'black') => {
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return

        const traced = issue.toneCssVar ? traceToTokenRef(issue.toneCssVar) : null
        const resolvedFamily = traced?.family || family
        const resolvedLevel = traced?.level || level

        const tokensAny = tokens as any
        const colorsRootAny = tokensAny?.tokens?.colors || {}
        const originalHex = colorsRootAny[resolvedFamily]?.[resolvedLevel]?.$value || ''

        const tokensCopy = JSON.parse(JSON.stringify(tokens))
        const colorsRoot = tokensCopy?.tokens?.colors || {}
        const scaleObj = colorsRoot[resolvedFamily]
        if (scaleObj && scaleObj[resolvedLevel]) {
            if (typeof scaleObj[resolvedLevel] === 'object' && '$value' in scaleObj[resolvedLevel]) {
                scaleObj[resolvedLevel].$value = newHex
            } else {
                scaleObj[resolvedLevel] = { $type: 'color', $value: newHex }
            }
        }

        const normalizedLevel = resolvedLevel === '000' ? '000' : resolvedLevel === '1000' ? '1000' : String(resolvedLevel).padStart(3, '0')
        const tokenCssVar = tokenColors(resolvedFamily, normalizedLevel)
        store.setTokensSilent(tokensCopy)
        setSuggestFixedMap(prev => ({ ...prev, [issue.id]: { family: resolvedFamily, level: resolvedLevel, originalHex } }))

        const cssUpdates: Record<string, string> = { [tokenCssVar]: newHex }

        if (newOnToneColor && issue.suggestion?.targetCssVar) {
            const mode = issue.mode || 'light'
            const onToneValueJson = `{brand.palettes.core-colors.${newOnToneColor}.tone}`
            const onToneCssVarValue = `var(--recursica_brand_themes_${mode}_palettes_core-colors_${newOnToneColor}_tone)`
            const onToneCssVar = issue.suggestion.targetCssVar
            updateBrandValue(onToneCssVar, onToneValueJson)
            cssUpdates[onToneCssVar] = onToneCssVarValue
        }

        store.writeCssVarsDirect(cssUpdates)
        setTimeout(() => { runScan() }, 500)
    }, [runScan])

    const handleSuggestUndo = useCallback((issue: ComplianceIssue) => {
        const undoInfo = suggestFixedMap[issue.id]
        if (!undoInfo) return

        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return

        const tokensCopy = JSON.parse(JSON.stringify(tokens))
        const colorsRoot = tokensCopy?.tokens?.colors || {}
        const scaleObj = colorsRoot[undoInfo.family]
        if (scaleObj && scaleObj[undoInfo.level]) {
            if (typeof scaleObj[undoInfo.level] === 'object' && '$value' in scaleObj[undoInfo.level]) {
                scaleObj[undoInfo.level].$value = undoInfo.originalHex
            }
        }

        const normalizedLevel = undoInfo.level === '000' ? '000' : undoInfo.level === '1000' ? '1000' : String(undoInfo.level).padStart(3, '0')
        const tokenCssVar = tokenColors(undoInfo.family, normalizedLevel)
        document.documentElement.style.setProperty(tokenCssVar, undoInfo.originalHex)
        store.setTokensSilent(tokensCopy)

        setSuggestFixedMap(prev => {
            const next = { ...prev }
            delete next[issue.id]
            return next
        })
        setTimeout(() => {
            document.documentElement.style.setProperty(tokenCssVar, undoInfo.originalHex)
            runScan()
        }, 500)
    }, [suggestFixedMap, runScan])

    const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

    const suggestableIssues = useMemo(() => {
        const set = new Set<string>()
        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return set

        const unfixable = issues.filter(i =>
            THEME_TYPES.includes(i.type) && (!i.suggestion || (i.suggestion.resultingRatio < i.requiredRatio))
        )
        for (const issue of unfixable) {
            const traced = issue.toneCssVar ? traceToTokenRef(issue.toneCssVar) : null
            const info = traced || findColorFamilyAndLevel(issue.toneHex, tokens)
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
            const emphasisVar = emphasis === 'high' ? textEmphasis(issue.mode, 'high') : textEmphasis(issue.mode, 'low')
            const emphasisOpacity = readCssVarNumber(emphasisVar, emphasis === 'high' ? 1 : 0.6)

            const tones = generateSuggestedTones(failingHex, aboveHex, belowHex, aboveLevel, belowLevel, level, emphasis, emphasisOpacity)
            const hasCompliant = tones.some(t => !t.isReference && !t.isFailing && t.isCompliant)
            if (hasCompliant) set.add(issue.id)
        }
        return set
    }, [issues])

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

    if (themeGroupKeys.length === 0) return null

    const renderGroup = (groupKey: string, groupIssues: ComplianceIssue[]) => {
        const label = typeLabels[groupKey] || groupKey
        return (
            <div key={groupKey} className="compliance-page__group">
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
                                        id={issue.id}
                                        className="compliance-table__row"
                                        style={{
                                            borderColor: `var(${genericLayerProperty(0, 'border-color')})`,
                                            opacity: (fixedMap[issue.id] || suggestFixedMap[issue.id]) ? 0.45 : 1,
                                        }}
                                    >
                                        <td className="compliance-table__td-center">
                                            {issue.mode === 'light'
                                                ? SunIcon && <SunIcon style={{ width: 16, height: 16, opacity: 0.6 }} />
                                                : MoonIcon && <MoonIcon style={{ width: 16, height: 16, opacity: 0.6 }} />}
                                        </td>
                                        <td>
                                            <Tooltip label={formatOnToneLabel(issue)}>
                                                <div className="compliance-table__swatch" style={{ backgroundColor: issue.toneHex }}>
                                                    <span style={{ color: issue.onToneHex }}>Aa</span>
                                                </div>
                                            </Tooltip>
                                        </td>
                                        <td>
                                            {issue.suggestion && suggestionPasses ? (
                                                <Tooltip label={formatColorLabel(issue.suggestion.suggestedHex) || issue.suggestion.suggestedHex}>
                                                    <div className="compliance-table__swatch" style={{ backgroundColor: issue.toneHex }}>
                                                        <span style={{ color: issue.suggestion.suggestedHex }}>Aa</span>
                                                    </div>
                                                </Tooltip>
                                            ) : (
                                                <span style={{ opacity: 0.25 }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            {issue.suggestion && suggestionPasses ? (
                                                fixedMap[issue.id] ? (
                                                    <Button variant="outline" size="small" onClick={() => handleUndo(issue)}>Undo</Button>
                                                ) : (
                                                    <Button
                                                        variant="outline" size="small"
                                                        onClick={() => handleFix(issue)}
                                                        title={issue.suggestion.description}
                                                        icon={WrenchIcon ? <WrenchIcon style={{ width: 12, height: 12 }} /> : undefined}
                                                    >Fix</Button>
                                                )
                                            ) : suggestFixedMap[issue.id] ? (
                                                <Button variant="outline" size="small" onClick={() => handleSuggestUndo(issue)}>Undo</Button>
                                            ) : suggestableIssues.has(issue.id) ? (
                                                <Button variant="outline" size="small" onClick={() => setSuggestIssue(issue)}>Suggest tones</Button>
                                            ) : (
                                                <span style={{ opacity: 0.5, fontSize: 12 }}>
                                                    Cannot find a compliant on-tone color for this tone
                                                </span>
                                            )}
                                        </td>
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
                Theme
                <Button
                    variant="solid" size="small"
                    onClick={() => setShowConfirmAll(true)}
                    icon={WrenchIcon ? <WrenchIcon style={{ width: 14, height: 14 }} /> : undefined}
                    disabled={unfixedCount === 0}
                >
                    Fix all theme{unfixedCount > 0 ? ` (${unfixedCount})` : ''}
                </Button>
            </h2>

            {themeGroupKeys.map(type => renderGroup(type, groupedIssues[type]))}

            <Modal
                isOpen={showConfirmAll}
                onClose={() => !isFixingAll && setShowConfirmAll(false)}
                title="Apply all theme fixes?"
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
                content={`This will apply ${unfixedCount} suggested fixes. Some changes may alter your theme's visual design.`}
            />

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
