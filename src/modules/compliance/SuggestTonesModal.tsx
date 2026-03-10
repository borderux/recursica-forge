/**
 * SuggestTonesModal
 *
 * Modal for suggesting replacement tone values when a compliant on-tone
 * cannot be found. Generates 6 interpolated tones between adjacent scale
 * levels and allows the user to pick one that passes AA contrast.
 */

import { useState, useMemo } from 'react'
import { Modal } from '../../components/adapters/Modal'
import { Badge } from '../../components/adapters/Badge'
import { RadioButton } from '../../components/adapters/RadioButton'
import type { ComplianceIssue } from '../../core/compliance/ComplianceService'
import { generateSuggestedTones, type SuggestedTone } from './toneInterpolation'
import {
    findColorFamilyAndLevel,
    getAllFamilyColorsByKey,
} from '../../core/compliance/layerColorStepping'
import { getVarsStore } from '../../core/store/varsStore'
import { readCssVarNumber } from '../../core/css/readCssVar'
import { iconNameToReactComponent } from '../components/iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import './SuggestTonesModal.css'

// Standard scale levels in order from lightest to darkest (light mode)
const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

export interface SuggestTonesModalProps {
    issue: ComplianceIssue
    isOpen: boolean
    onClose: () => void
    onApply: (issue: ComplianceIssue, newHex: string, family: string, level: string) => void
}

export function SuggestTonesModal({ issue, isOpen, onClose, onApply }: SuggestTonesModalProps) {
    const [selectedHex, setSelectedHex] = useState<string | null>(null)
    const { mode } = useThemeMode()

    const WarningIcon = iconNameToReactComponent('warning')

    // Resolve the issue's tone to its scale family/level and compute suggestions
    const { tones, family, level, emphasisOpacity } = useMemo(() => {
        if (!isOpen) return { tones: [] as SuggestedTone[], family: '', level: '', emphasisOpacity: 1 }

        const store = getVarsStore()
        const tokens = store.getState().tokens
        if (!tokens) return { tones: [] as SuggestedTone[], family: '', level: '', emphasisOpacity: 1 }

        // Find what scale family & level the failing tone belongs to
        const info = findColorFamilyAndLevel(issue.toneHex, tokens)
        if (!info) return { tones: [] as SuggestedTone[], family: '', level: '', emphasisOpacity: 1 }

        const { family, level } = info

        // Get all colors in this family
        const familyColors = getAllFamilyColorsByKey(family, tokens)
        if (familyColors.length === 0) return { tones: [] as SuggestedTone[], family, level, emphasisOpacity: 1 }

        // Determine level ordering based on mode
        // In dark mode, levels are reversed: 1000 = lightest, so "darker" means lower level number
        const orderedLevels = issue.mode === 'dark' ? [...LEVELS].reverse() : [...LEVELS]

        const currentIdx = orderedLevels.indexOf(level)
        if (currentIdx === -1) return { tones: [] as SuggestedTone[], family, level, emphasisOpacity: 1 }

        // "Above" = one step toward darker
        // "Below" = one step toward lighter
        const aboveIdx = currentIdx > 0 ? currentIdx - 1 : -1
        const belowIdx = currentIdx < orderedLevels.length - 1 ? currentIdx + 1 : -1

        const aboveLevel = aboveIdx >= 0 ? orderedLevels[aboveIdx] : null
        const belowLevel = belowIdx >= 0 ? orderedLevels[belowIdx] : null

        const colorMap = new Map(familyColors.map(c => [c.level, c.hex]))
        const aboveHex = aboveLevel ? colorMap.get(aboveLevel) || null : null
        const belowHex = belowLevel ? colorMap.get(belowLevel) || null : null
        const failingHex = colorMap.get(level) || issue.toneHex

        // Get emphasis opacity
        const emphasis = issue.emphasis || 'high'
        const emphasisVar = emphasis === 'high'
            ? `--recursica-brand-themes-${issue.mode}-text-emphasis-high`
            : `--recursica-brand-themes-${issue.mode}-text-emphasis-low`
        const emphasisOpacity = readCssVarNumber(emphasisVar, emphasis === 'high' ? 1 : 0.6)

        const tones = generateSuggestedTones(
            failingHex,
            aboveHex,
            belowHex,
            aboveLevel,
            belowLevel,
            level,
            emphasis,
            emphasisOpacity,
        )

        // Override the failing tone's contrast ratio with the actual value from the issue
        // testOnToneCompliance tests both black & white, but the issue has the actual failing ratio
        const failingTone = tones.find(t => t.isFailing)
        if (failingTone) {
            failingTone.contrastRatio = issue.contrastRatio
            failingTone.isCompliant = false // It's always failing, that's why we're here
        }

        return { tones, family, level, emphasisOpacity }
    }, [isOpen, issue])

    const handleSave = () => {
        if (!selectedHex || !family || !level) return
        onApply(issue, selectedHex, family, level)
        setSelectedHex(null)
        onClose()
    }

    const handleClose = () => {
        setSelectedHex(null)
        onClose()
    }

    const scaleMatch = family.match(/^scale-(\d+)$/)
    const familyLabel = scaleMatch
        ? `Scale ${parseInt(scaleMatch[1], 10)}`
        : family.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const emphasisLabel = issue.emphasis === 'low' ? 'low emphasis' : 'high emphasis'
    const hasSelectableTones = tones.some(t => !t.isReference && !t.isFailing && t.isCompliant)

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Suggest tones"
            primaryActionLabel="Save"
            onPrimaryAction={handleSave}
            primaryActionDisabled={!selectedHex}
            secondaryActionLabel="Cancel"
            onSecondaryAction={handleClose}
            size="sm"
            centered
            scrollable
        >
            <div className="suggest-tones">
                <p
                    className="suggest-tones__subtitle"
                    style={{
                        color: `var(--recursica-brand-themes-${mode}-layers-layer-1-elements-text-color)`,
                        fontFamily: 'var(--recursica-brand-typography-body-small-font-family)',
                        fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                        fontWeight: 'var(--recursica-brand-typography-body-small-font-weight)',
                        letterSpacing: 'var(--recursica-brand-typography-body-small-font-letter-spacing)',
                        lineHeight: 'var(--recursica-brand-typography-body-small-line-height)',
                    }}
                >
                    {issue.location} · {familyLabel} · {emphasisLabel}
                </p>

                {tones.map((tone, idx) => {
                    const isSelectable = !tone.isReference && !tone.isFailing && tone.isCompliant
                    const isSelected = selectedHex === tone.hex

                    let rowClass = 'suggest-tones__row'
                    if (isSelectable) rowClass += ' suggest-tones__row--selectable'
                    if (isSelected) rowClass += ' suggest-tones__row--selected'

                    // Show divider before the failing tone and after it
                    const showDividerBefore = tone.isFailing && tones[idx - 1] && !tones[idx - 1].isReference
                    const prevTone = idx > 0 ? tones[idx - 1] : null
                    const showDividerAfterPrev = !tone.isReference && !tone.isFailing && prevTone?.isFailing

                    // Determine on-tone dot color
                    const onToneHex = tone.onToneColor === 'white' ? '#ffffff' : '#000000'

                    return (
                        <div key={`${tone.hex}-${idx}`}>
                            {showDividerBefore && (
                                <div className="suggest-tones__divider" style={{ backgroundColor: 'currentColor' }} />
                            )}
                            {showDividerAfterPrev && (
                                <div className="suggest-tones__divider" style={{ backgroundColor: 'currentColor' }} />
                            )}
                            <div
                                className={rowClass}
                                onClick={isSelectable ? () => setSelectedHex(tone.hex) : undefined}
                            >
                                {/* Radio button for selectable rows, empty space for others */}
                                <div className="suggest-tones__radio-cell">
                                    {isSelectable && (
                                        <RadioButton
                                            selected={isSelected}
                                            onChange={() => setSelectedHex(tone.hex)}
                                        />
                                    )}
                                </div>

                                {/* Swatch */}
                                <div
                                    className="suggest-tones__swatch"
                                    style={{ backgroundColor: tone.hex }}
                                >
                                    {tone.isFailing ? (
                                        /* Failing tone: show warning icon (like palettes) */
                                        WarningIcon && (
                                            <WarningIcon
                                                className="suggest-tones__warning-icon"
                                                style={{
                                                    color: tone.onToneColor === 'white' ? '#fff' : '#000',
                                                    opacity: emphasisOpacity,
                                                }}
                                            />
                                        )
                                    ) : tone.onToneColor ? (
                                        <div
                                            className="suggest-tones__on-tone-dot"
                                            style={{
                                                backgroundColor: onToneHex,
                                                opacity: emphasisOpacity,
                                            }}
                                        />
                                    ) : null}
                                </div>

                                {/* Info */}
                                <div className="suggest-tones__info">
                                    <span className="suggest-tones__label">
                                        {tone.label}
                                        {tone.isReference && ' (ref)'}
                                        {tone.isFailing && ' (current)'}
                                    </span>
                                    <span className="suggest-tones__hex">{tone.hex.toUpperCase()}</span>
                                </div>

                                {/* Compliance status */}
                                <div className="suggest-tones__compliance">
                                    {tone.isCompliant ? (
                                        <Badge variant="success" size="small">
                                            {tone.contrastRatio.toFixed(1)}:1
                                        </Badge>
                                    ) : (
                                        <Badge variant="alert" size="small">
                                            {tone.contrastRatio.toFixed(1)}:1
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {!hasSelectableTones && tones.length > 0 && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.5, textAlign: 'center' }}>
                        No compliant options found — try adjusting the scale.
                    </p>
                )}
            </div>
        </Modal>
    )
}
