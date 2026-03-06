/**
 * ComplianceService — Centralized AA Compliance Scanner
 * 
 * Singleton service that maintains a live list of WCAG AA compliance issues.
 * Triggered by color, opacity, palette, and mode changes.
 * Replaces the scattered compliance checking across the codebase.
 */

import { readCssVar } from '../css/readCssVar'
import { resolveCssVarToHex } from './layerColorStepping'
import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { contrastRatio } from '../../modules/theme/contrastUtil'
import { findColorFamilyAndLevel, stepUntilAACompliant, hexToCssVarRef } from './layerColorStepping'
import { updateCssVar } from '../css/updateCssVar'

// ─── Types ───

export interface SuggestedFix {
    description: string
    targetCssVar: string
    suggestedValue: string       // Token reference or CSS var
    suggestedHex: string         // For preview swatch
    resultingRatio: number
}

export interface ComplianceIssue {
    id: string
    type: 'palette-on-tone' | 'layer-text' | 'layer-interactive' | 'core-on-tone'
    mode: 'light' | 'dark'
    location: string
    toneHex: string
    onToneHex: string
    contrastRatio: number
    requiredRatio: number
    message: string
    suggestion: SuggestedFix | null
}

// ─── Service ───

const AA_THRESHOLD = 4.5

class ComplianceServiceImpl {
    private issues: ComplianceIssue[] = []
    private scanTimeout: ReturnType<typeof setTimeout> | null = null
    private isScanning = false

    // External references — set by VarsStore
    private getTokens: (() => JsonLike) | null = null
    private getTheme: (() => JsonLike) | null = null

    /**
     * Connect the service to the VarsStore's token/theme getters.
     * Called once from VarsStore constructor.
     */
    connect(getTokens: () => JsonLike, getTheme: () => JsonLike) {
        this.getTokens = getTokens
        this.getTheme = getTheme
    }

    /**
     * Run a full compliance scan. Called on trigger events.
     * Returns the issues found.
     */
    runFullScan(): ComplianceIssue[] {
        if (!this.getTokens || !this.getTheme) return this.issues
        if (this.isScanning) return this.issues

        this.isScanning = true
        try {
            const tokens = this.getTokens()
            const theme = this.getTheme()
            const newIssues: ComplianceIssue[] = []
            const tokenIndex = buildTokenIndex(tokens)

            for (const mode of ['light', 'dark'] as const) {
                // 1. Check palette on-tone combinations
                this.checkPaletteOnTones(newIssues, tokenIndex, theme, tokens, mode)

                // 2. Check core color on-tones
                this.checkCoreOnTones(newIssues, tokenIndex, tokens, mode)

                // 3. Check layer text colors
                this.checkLayerTextColors(newIssues, tokenIndex, tokens, mode)

                // 4. Check layer interactive colors
                this.checkLayerInteractiveColors(newIssues, tokenIndex, tokens, mode)
            }

            this.issues = newIssues
            // Emit event for React consumers
            window.dispatchEvent(new CustomEvent('complianceIssuesChanged', {
                detail: { issueCount: newIssues.length }
            }))

            return newIssues
        } finally {
            this.isScanning = false
        }
    }

    /**
     * Trigger a scan with a small delay to let CSS vars settle.
     * Multiple rapid calls are coalesced.
     */
    triggerScan() {
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout)
        }
        this.scanTimeout = setTimeout(() => {
            this.runFullScan()
            this.scanTimeout = null
        }, 150)
    }

    getIssues(): ComplianceIssue[] {
        return this.issues
    }

    getIssueCount(): number {
        return this.issues.length
    }

    /**
     * Apply a single suggested fix.
     */
    applySuggestion(issueId: string): boolean {
        if (!this.getTokens) return false

        const issue = this.issues.find(i => i.id === issueId)
        if (!issue || !issue.suggestion) return false

        const tokens = this.getTokens()
        updateCssVar(issue.suggestion.targetCssVar, issue.suggestion.suggestedValue, tokens)

        // Re-scan after applying fix
        this.triggerScan()
        return true
    }

    /**
     * Apply all suggested fixes.
     */
    applyAllSuggestions(): number {
        if (!this.getTokens) return 0

        const tokens = this.getTokens()
        let applied = 0

        for (const issue of this.issues) {
            if (issue.suggestion) {
                updateCssVar(issue.suggestion.targetCssVar, issue.suggestion.suggestedValue, tokens)
                applied++
            }
        }

        // Re-scan after applying fixes
        this.triggerScan()
        return applied
    }

    // ─── Private scan methods ───

    private checkPaletteOnTones(
        issues: ComplianceIssue[],
        tokenIndex: ReturnType<typeof buildTokenIndex>,
        theme: JsonLike,
        tokens: JsonLike,
        mode: 'light' | 'dark'
    ) {
        try {
            const root: any = (theme as any)?.brand ? (theme as any).brand : theme
            const themes = root?.themes || root
            const palettes = themes?.[mode]?.palettes || {}
            const levels = ['900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']

            Object.keys(palettes).forEach((paletteKey) => {
                if (paletteKey === 'core' || paletteKey === 'core-colors') return

                levels.forEach((level) => {
                    const toneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-tone`
                    const onToneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-on-tone`

                    const toneValue = readCssVar(toneVar)
                    const onToneValue = readCssVar(onToneVar)
                    if (!toneValue || !onToneValue) return

                    const toneHex = resolveCssVarToHex(toneValue, tokenIndex as any)
                    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex as any)
                    if (!toneHex || !onToneHex) return

                    const ratio = contrastRatio(toneHex, onToneHex)
                    if (ratio < AA_THRESHOLD) {
                        const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode)
                        issues.push({
                            id: `palette-${paletteKey}-${level}-${mode}`,
                            type: 'palette-on-tone',
                            mode,
                            location: `Palette ${paletteKey}, Level ${level}`,
                            toneHex,
                            onToneHex,
                            contrastRatio: ratio,
                            requiredRatio: AA_THRESHOLD,
                            message: `On-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                            suggestion
                        })
                    }
                })
            })
        } catch (err) {
            console.warn('Error checking palette compliance:', err)
        }
    }

    private checkCoreOnTones(
        issues: ComplianceIssue[],
        tokenIndex: ReturnType<typeof buildTokenIndex>,
        tokens: JsonLike,
        mode: 'light' | 'dark'
    ) {
        const coreColorKeys = ['alert', 'warning', 'success', 'black', 'white']

        coreColorKeys.forEach((colorKey) => {
            const toneVar = `--recursica-brand-themes-${mode}-palettes-core-${colorKey}-tone`
            const onToneVar = `--recursica-brand-themes-${mode}-palettes-core-${colorKey}-on-tone`

            const toneValue = readCssVar(toneVar)
            const onToneValue = readCssVar(onToneVar)
            if (!toneValue || !onToneValue) return

            const toneHex = resolveCssVarToHex(toneValue, tokenIndex as any)
            const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex as any)
            if (!toneHex || !onToneHex) return

            const ratio = contrastRatio(toneHex, onToneHex)
            if (ratio < AA_THRESHOLD) {
                const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode)
                issues.push({
                    id: `core-${colorKey}-${mode}`,
                    type: 'core-on-tone',
                    mode,
                    location: `Core color: ${colorKey}`,
                    toneHex,
                    onToneHex,
                    contrastRatio: ratio,
                    requiredRatio: AA_THRESHOLD,
                    message: `On-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                    suggestion
                })
            }
        })
    }

    private checkLayerTextColors(
        issues: ComplianceIssue[],
        tokenIndex: ReturnType<typeof buildTokenIndex>,
        tokens: JsonLike,
        mode: 'light' | 'dark'
    ) {
        for (let layer = 0; layer <= 3; layer++) {
            const surfaceVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-properties-surface`
            const surfaceValue = readCssVar(surfaceVar)
            if (!surfaceValue) continue

            const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex as any)
            if (!surfaceHex) continue

            const textProps = [
                { key: 'text-color', label: 'Text Color' },
                { key: 'text-alert', label: 'Alert Text' },
                { key: 'text-success', label: 'Success Text' },
                { key: 'text-warning', label: 'Warning Text' },
            ]

            textProps.forEach(({ key, label }) => {
                const textVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-elements-${key}`
                const textValue = readCssVar(textVar)
                if (!textValue) return

                const textHex = resolveCssVarToHex(textValue, tokenIndex as any)
                if (!textHex) return

                const ratio = contrastRatio(surfaceHex, textHex)
                if (ratio < AA_THRESHOLD) {
                    const suggestion = this.generateSteppedColorSuggestion(
                        textHex, surfaceHex, textVar, tokens, mode
                    )
                    issues.push({
                        id: `layer-${layer}-${key}-${mode}`,
                        type: 'layer-text',
                        mode,
                        location: `Layer ${layer}: ${label}`,
                        toneHex: surfaceHex,
                        onToneHex: textHex,
                        contrastRatio: ratio,
                        requiredRatio: AA_THRESHOLD,
                        message: `${label} contrast ${ratio.toFixed(2)}:1 vs surface is below ${AA_THRESHOLD}:1`,
                        suggestion
                    })
                }
            })
        }
    }

    private checkLayerInteractiveColors(
        issues: ComplianceIssue[],
        tokenIndex: ReturnType<typeof buildTokenIndex>,
        tokens: JsonLike,
        mode: 'light' | 'dark'
    ) {
        for (let layer = 0; layer <= 3; layer++) {
            const surfaceVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-properties-surface`
            const surfaceValue = readCssVar(surfaceVar)
            if (!surfaceValue) continue

            const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex as any)
            if (!surfaceHex) continue

            // Check interactive-color vs surface
            const interactiveVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-elements-interactive-color`
            const interactiveValue = readCssVar(interactiveVar)
            if (interactiveValue) {
                const interactiveHex = resolveCssVarToHex(interactiveValue, tokenIndex as any)
                if (interactiveHex) {
                    const ratio = contrastRatio(surfaceHex, interactiveHex)
                    if (ratio < AA_THRESHOLD) {
                        const suggestion = this.generateSteppedColorSuggestion(
                            interactiveHex, surfaceHex, interactiveVar, tokens, mode
                        )
                        issues.push({
                            id: `layer-${layer}-interactive-color-${mode}`,
                            type: 'layer-interactive',
                            mode,
                            location: `Layer ${layer}: Interactive Color`,
                            toneHex: surfaceHex,
                            onToneHex: interactiveHex,
                            contrastRatio: ratio,
                            requiredRatio: AA_THRESHOLD,
                            message: `Interactive color contrast ${ratio.toFixed(2)}:1 vs surface is below ${AA_THRESHOLD}:1`,
                            suggestion
                        })
                    }
                }
            }

            // Check interactive tone vs on-tone
            const iToneVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-elements-interactive-tone`
            const iOnToneVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-elements-interactive-on-tone`
            const iToneValue = readCssVar(iToneVar)
            const iOnToneValue = readCssVar(iOnToneVar)
            if (iToneValue && iOnToneValue) {
                const iToneHex = resolveCssVarToHex(iToneValue, tokenIndex as any)
                const iOnToneHex = resolveCssVarToHex(iOnToneValue, tokenIndex as any)
                if (iToneHex && iOnToneHex) {
                    const ratio = contrastRatio(iToneHex, iOnToneHex)
                    if (ratio < AA_THRESHOLD) {
                        const suggestion = this.generateSteppedColorSuggestion(
                            iOnToneHex, iToneHex, iOnToneVar, tokens, mode
                        )
                        issues.push({
                            id: `layer-${layer}-interactive-ontone-${mode}`,
                            type: 'layer-interactive',
                            mode,
                            location: `Layer ${layer}: Interactive On-Tone`,
                            toneHex: iToneHex,
                            onToneHex: iOnToneHex,
                            contrastRatio: ratio,
                            requiredRatio: AA_THRESHOLD,
                            message: `Interactive on-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                            suggestion
                        })
                    }
                }
            }
        }
    }

    // ─── Suggestion generators ───

    private generateOnToneSuggestion(
        toneHex: string,
        onToneCssVar: string,
        tokens: JsonLike,
        _tokenIndex: ReturnType<typeof buildTokenIndex>,
        _mode: 'light' | 'dark'
    ): SuggestedFix | null {
        try {
            // Try black and white as on-tone
            const blackContrast = contrastRatio(toneHex, '#000000')
            const whiteContrast = contrastRatio(toneHex, '#ffffff')

            if (blackContrast >= AA_THRESHOLD || whiteContrast >= AA_THRESHOLD) {
                const useBlack = blackContrast >= whiteContrast
                const suggestedHex = useBlack ? '#000000' : '#ffffff'
                const suggestedLabel = useBlack ? 'black' : 'white'
                const cssVarRef = hexToCssVarRef(suggestedHex, tokens)

                return {
                    description: `Change on-tone to ${suggestedLabel} (${contrastRatio(toneHex, suggestedHex).toFixed(2)}:1)`,
                    targetCssVar: onToneCssVar,
                    suggestedValue: cssVarRef,
                    suggestedHex,
                    resultingRatio: useBlack ? blackContrast : whiteContrast,
                }
            }

            // Try stepping through token scale
            const steppedHex = stepUntilAACompliant(toneHex, toneHex, 'lighter', tokens)
            if (steppedHex && steppedHex !== toneHex) {
                const steppedRatio = contrastRatio(toneHex, steppedHex)
                if (steppedRatio >= AA_THRESHOLD) {
                    const cssVarRef = hexToCssVarRef(steppedHex, tokens)
                    return {
                        description: `Step color to ${steppedHex} (${steppedRatio.toFixed(2)}:1)`,
                        targetCssVar: onToneCssVar,
                        suggestedValue: cssVarRef,
                        suggestedHex: steppedHex,
                        resultingRatio: steppedRatio,
                    }
                }
            }

            return null
        } catch {
            return null
        }
    }

    private generateSteppedColorSuggestion(
        foregroundHex: string,
        backgroundHex: string,
        targetCssVar: string,
        tokens: JsonLike,
        _mode: 'light' | 'dark'
    ): SuggestedFix | null {
        try {
            // Try stepping darker
            const darkerHex = stepUntilAACompliant(foregroundHex, backgroundHex, 'darker', tokens)
            const darkerRatio = contrastRatio(backgroundHex, darkerHex)

            // Try stepping lighter
            const lighterHex = stepUntilAACompliant(foregroundHex, backgroundHex, 'lighter', tokens)
            const lighterRatio = contrastRatio(backgroundHex, lighterHex)

            // Pick the better option that's closer to the original color
            let bestHex = foregroundHex
            let bestRatio = contrastRatio(backgroundHex, foregroundHex)

            if (darkerRatio >= AA_THRESHOLD && lighterRatio >= AA_THRESHOLD) {
                // Both work — pick the one closer to the original
                const darkerDist = Math.abs(darkerRatio - AA_THRESHOLD)
                const lighterDist = Math.abs(lighterRatio - AA_THRESHOLD)
                bestHex = darkerDist <= lighterDist ? darkerHex : lighterHex
                bestRatio = darkerDist <= lighterDist ? darkerRatio : lighterRatio
            } else if (darkerRatio >= AA_THRESHOLD) {
                bestHex = darkerHex
                bestRatio = darkerRatio
            } else if (lighterRatio >= AA_THRESHOLD) {
                bestHex = lighterHex
                bestRatio = lighterRatio
            }

            if (bestRatio >= AA_THRESHOLD && bestHex !== foregroundHex) {
                const cssVarRef = hexToCssVarRef(bestHex, tokens)
                const family = findColorFamilyAndLevel(bestHex, tokens)
                const desc = family
                    ? `Step to ${family.family}/${family.level} (${bestRatio.toFixed(2)}:1)`
                    : `Step to ${bestHex} (${bestRatio.toFixed(2)}:1)`

                return {
                    description: desc,
                    targetCssVar,
                    suggestedValue: cssVarRef,
                    suggestedHex: bestHex,
                    resultingRatio: bestRatio,
                }
            }

            return null
        } catch {
            return null
        }
    }
}

// ─── Singleton ───

let instance: ComplianceServiceImpl | null = null

export function getComplianceService(): ComplianceServiceImpl {
    if (!instance) {
        instance = new ComplianceServiceImpl()
    }
    return instance
}

export type { ComplianceServiceImpl as ComplianceService }
