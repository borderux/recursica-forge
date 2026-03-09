/**
 * ComplianceService — Centralized AA Compliance Scanner
 * 
 * Singleton service that maintains a live list of WCAG AA compliance issues.
 * Triggered by color, opacity, palette, and mode changes.
 * Replaces the scattered compliance checking across the codebase.
 */

import { readCssVar, readCssVarNumber } from '../css/readCssVar'
import { resolveCssVarToHex } from './layerColorStepping'
import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { contrastRatio, blendHexWithOpacity } from '../../modules/theme/contrastUtil'
import { findColorFamilyAndLevel, getAllFamilyColors, hexToCssVarRef } from './layerColorStepping'
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
    emphasis?: 'high' | 'low'
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

                // 4. Check layer text with emphasis opacity
                this.checkLayerTextEmphasis(newIssues, tokenIndex, tokens, mode)

                // 5. Check layer interactive colors
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
            const levels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']

            // Read emphasis opacity values (use readCssVarNumber to resolve var() references)
            const highEmphasisVar = `--recursica-brand-themes-${mode}-text-emphasis-high`
            const lowEmphasisVar = `--recursica-brand-themes-${mode}-text-emphasis-low`
            const highOpacity = readCssVarNumber(highEmphasisVar, 1)
            const lowOpacity = readCssVarNumber(lowEmphasisVar, 0.6)

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

                    // Check high-emphasis on-tone (on-tone blended at high emphasis opacity)
                    if (!isNaN(highOpacity) && highOpacity < 1) {
                        const blendedHigh = blendHexWithOpacity(onToneHex, toneHex, highOpacity)
                        if (blendedHigh) {
                            const highRatio = contrastRatio(toneHex, blendedHigh)
                            if (highRatio < AA_THRESHOLD) {
                                const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode)
                                issues.push({
                                    id: `palette-${paletteKey}-${level}-high-${mode}`,
                                    type: 'palette-on-tone',
                                    mode,
                                    location: `Palette ${paletteKey.replace('palette-', '')} / ${level}`,
                                    emphasis: 'high',
                                    toneHex,
                                    onToneHex: blendedHigh,
                                    contrastRatio: highRatio,
                                    requiredRatio: AA_THRESHOLD,
                                    message: `High emphasis on-tone contrast ${highRatio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                                    suggestion
                                })
                            }
                        }
                    } else {
                        // High emphasis is 1.0, check raw contrast
                        const ratio = contrastRatio(toneHex, onToneHex)
                        if (ratio < AA_THRESHOLD) {
                            const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode)
                            issues.push({
                                id: `palette-${paletteKey}-${level}-high-${mode}`,
                                type: 'palette-on-tone',
                                mode,
                                location: `Palette ${paletteKey.replace('palette-', '')} / ${level}`,
                                emphasis: 'high',
                                toneHex,
                                onToneHex,
                                contrastRatio: ratio,
                                requiredRatio: AA_THRESHOLD,
                                message: `High emphasis on-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                                suggestion
                            })
                        }
                    }

                    // Check low-emphasis on-tone (on-tone blended at low emphasis opacity)
                    if (!isNaN(lowOpacity) && lowOpacity < 1) {
                        const blendedLow = blendHexWithOpacity(onToneHex, toneHex, lowOpacity)
                        if (blendedLow) {
                            const lowRatio = contrastRatio(toneHex, blendedLow)
                            if (lowRatio < AA_THRESHOLD) {
                                issues.push({
                                    id: `palette-${paletteKey}-${level}-low-${mode}`,
                                    type: 'palette-on-tone',
                                    mode,
                                    location: `Palette ${paletteKey.replace('palette-', '')} / ${level}`,
                                    emphasis: 'low',
                                    toneHex,
                                    onToneHex: blendedLow,
                                    contrastRatio: lowRatio,
                                    requiredRatio: AA_THRESHOLD,
                                    message: `Low emphasis on-tone contrast ${lowRatio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                                    suggestion: null
                                })
                            }
                        }
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
        // Simple core colors: tone / on-tone
        const simpleCoreColors = ['alert', 'warning', 'success', 'black', 'white']

        simpleCoreColors.forEach((colorKey) => {
            const toneVar = `--recursica-brand-themes-${mode}-palettes-core-${colorKey}-tone`
            const onToneVar = `--recursica-brand-themes-${mode}-palettes-core-${colorKey}-on-tone`

            const toneValue = readCssVar(toneVar)
            const onToneValue = readCssVar(onToneVar)
            if (!toneValue || !onToneValue) return

            const toneHex = resolveCssVarToHex(toneValue, tokenIndex as any)
            const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex as any)
            if (!toneHex || !onToneHex) return

            // Check full-opacity (high emphasis) on-tone
            const ratio = contrastRatio(toneHex, onToneHex)
            if (ratio < AA_THRESHOLD) {
                const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode)
                issues.push({
                    id: `core-${colorKey}-${mode}`,
                    type: 'core-on-tone',
                    mode,
                    location: `Core / ${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}`,
                    emphasis: 'high',
                    toneHex,
                    onToneHex,
                    contrastRatio: ratio,
                    requiredRatio: AA_THRESHOLD,
                    message: `High emphasis on-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                    suggestion
                })
            }

            // Check low-emphasis on-tone (on-tone blended at low emphasis opacity)
            const lowEmphasisVar = `--recursica-brand-themes-${mode}-text-emphasis-low`
            const opacity = readCssVarNumber(lowEmphasisVar, 1)
            if (opacity < 1) {
                const blendedHex = blendHexWithOpacity(onToneHex, toneHex, opacity)
                if (blendedHex) {
                    const lowRatio = contrastRatio(toneHex, blendedHex)
                    if (lowRatio < AA_THRESHOLD) {
                        issues.push({
                            id: `core-${colorKey}-low-emphasis-${mode}`,
                            type: 'core-on-tone',
                            mode,
                            location: `Core / ${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}`,
                            emphasis: 'low',
                            toneHex,
                            onToneHex: blendedHex,
                            contrastRatio: lowRatio,
                            requiredRatio: AA_THRESHOLD,
                            message: `Low emphasis on-tone contrast ${lowRatio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                            suggestion: null
                        })
                    }
                }
            }
        })

        // Interactive core colors: default and hover variants
        const interactiveVariants = [
            { variant: 'default', label: 'Interactive default' },
            { variant: 'hover', label: 'Interactive hover' },
        ]

        interactiveVariants.forEach(({ variant, label }) => {
            const toneVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-${variant}-tone`
            const onToneVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-${variant}-on-tone`

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
                    id: `core-interactive-${variant}-${mode}`,
                    type: 'core-on-tone',
                    mode,
                    location: `Core / ${label}`,
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
                { key: 'text-color', label: 'Text color' },
                { key: 'text-alert', label: 'Alert text' },
                { key: 'text-success', label: 'Success text' },
                { key: 'text-warning', label: 'Warning text' },
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
                        location: `Layer ${layer} / ${label}`,
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

    /**
     * Check layer text colors with low-emphasis opacity applied.
     * Blends text color with surface at the emphasis opacity to compute effective contrast.
     */
    private checkLayerTextEmphasis(
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

            const textVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-elements-text-color`
            const textValue = readCssVar(textVar)
            if (!textValue) continue

            const textHex = resolveCssVarToHex(textValue, tokenIndex as any)
            if (!textHex) continue

            // Check low-emphasis text
            const lowEmphasisVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-elements-text-low-emphasis`
            const opacity = readCssVarNumber(lowEmphasisVar, 1)
            if (opacity >= 1) continue

            // Blend text color with surface at the given opacity
            const blendedHex = blendHexWithOpacity(textHex, surfaceHex, opacity)
            if (!blendedHex) continue

            const ratio = contrastRatio(surfaceHex, blendedHex)
            if (ratio < AA_THRESHOLD) {
                issues.push({
                    id: `layer-${layer}-text-low-emphasis-${mode}`,
                    type: 'layer-text',
                    mode,
                    location: `Layer ${layer} / Low emphasis text`,
                    toneHex: surfaceHex,
                    onToneHex: blendedHex,
                    contrastRatio: ratio,
                    requiredRatio: AA_THRESHOLD,
                    message: `Low emphasis text contrast ${ratio.toFixed(2)}:1 vs surface is below ${AA_THRESHOLD}:1`,
                    suggestion: null // Emphasis is an opacity, not a color — no auto-fix
                })
            }
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
                            location: `Layer ${layer} / Interactive color`,
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
                            location: `Layer ${layer} / Interactive on-tone`,
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

    /**
     * Generate a suggestion for a failing on-tone.
     * Strategy:
     *  1. Try every level in the on-tone's own color family against toneHex
     *  2. Try black and white token values
     *  3. If nothing passes, step the tone color and retry with all on-tone candidates
     */
    private generateOnToneSuggestion(
        toneHex: string,
        onToneCssVar: string,
        tokens: JsonLike,
        _tokenIndex: ReturnType<typeof buildTokenIndex>,
        _mode: 'light' | 'dark'
    ): SuggestedFix | null {
        try {
            // Get the current on-tone's color, and all levels in its family
            const onToneValue = readCssVar(onToneCssVar)
            if (!onToneValue) return null
            const onToneHex = resolveCssVarToHex(onToneValue, _tokenIndex as any)
            if (!onToneHex) return null

            // 1. Try all levels in the on-tone's own family
            const familyColors = getAllFamilyColors(onToneHex, tokens)
            const candidate = this.findBestPassingColor(familyColors, toneHex, onToneHex)
            if (candidate) {
                const cssVarRef = hexToCssVarRef(candidate.hex, tokens)
                if (cssVarRef) {
                    return {
                        description: `Change on-tone to ${candidate.family}/${candidate.level} (${contrastRatio(toneHex, candidate.hex).toFixed(2)}:1)`,
                        targetCssVar: onToneCssVar,
                        suggestedValue: cssVarRef,
                        suggestedHex: candidate.hex,
                        resultingRatio: contrastRatio(toneHex, candidate.hex),
                    }
                }
            }

            // 2. Try black and white token values
            const bwResult = this.tryBlackWhiteTokens(toneHex, onToneCssVar, tokens)
            if (bwResult) return bwResult

            // 3. Step the tone to adjacent levels and retry
            const toneFamilyColors = getAllFamilyColors(toneHex, tokens)
            if (toneFamilyColors.length === 0) return null

            // Try each tone level, checking all on-tone family colors + black/white
            const toneFound = findColorFamilyAndLevel(toneHex, tokens)
            if (!toneFound) return null
            const toneIdx = toneFamilyColors.findIndex(c => c.level === toneFound.level)

            // Search outward from current tone level
            for (let offset = 1; offset < toneFamilyColors.length; offset++) {
                for (const dir of [-1, 1]) {
                    const idx = toneIdx + (offset * dir)
                    if (idx < 0 || idx >= toneFamilyColors.length) continue
                    const altTone = toneFamilyColors[idx]

                    // Try on-tone family colors against this alternate tone
                    const altCandidate = this.findBestPassingColor(familyColors, altTone.hex, onToneHex)
                    if (altCandidate) {
                        const cssVarRef = hexToCssVarRef(altCandidate.hex, tokens)
                        if (cssVarRef) {
                            return {
                                description: `Change on-tone to ${altCandidate.family}/${altCandidate.level} (${contrastRatio(altTone.hex, altCandidate.hex).toFixed(2)}:1)`,
                                targetCssVar: onToneCssVar,
                                suggestedValue: cssVarRef,
                                suggestedHex: altCandidate.hex,
                                resultingRatio: contrastRatio(toneHex, altCandidate.hex),
                            }
                        }
                    }

                    // Try black/white against this alternate tone
                    const bw = this.tryBlackWhiteTokens(altTone.hex, onToneCssVar, tokens)
                    if (bw) return bw
                }
            }

            return null
        } catch {
            return null
        }
    }

    /**
     * Generate a suggestion for a failing foreground color (layer text or interactive).
     * Strategy:
     *  1. Try every level in the foreground's own color family against backgroundHex
     *  2. Try black and white token values
     *  3. If nothing passes, return null (changing the background is out of scope)
     */
    private generateSteppedColorSuggestion(
        foregroundHex: string,
        backgroundHex: string,
        targetCssVar: string,
        tokens: JsonLike,
        _mode: 'light' | 'dark'
    ): SuggestedFix | null {
        try {
            // 1. Try all levels in the foreground's family
            const familyColors = getAllFamilyColors(foregroundHex, tokens)
            const candidate = this.findBestPassingColor(familyColors, backgroundHex, foregroundHex)
            if (candidate) {
                const cssVarRef = hexToCssVarRef(candidate.hex, tokens)
                if (cssVarRef) {
                    const family = findColorFamilyAndLevel(candidate.hex, tokens)
                    const desc = family
                        ? `Step to ${family.family}/${family.level} (${contrastRatio(backgroundHex, candidate.hex).toFixed(2)}:1)`
                        : `Step to ${candidate.hex} (${contrastRatio(backgroundHex, candidate.hex).toFixed(2)}:1)`
                    return {
                        description: desc,
                        targetCssVar,
                        suggestedValue: cssVarRef,
                        suggestedHex: candidate.hex,
                        resultingRatio: contrastRatio(backgroundHex, candidate.hex),
                    }
                }
            }

            // 2. Try black and white
            const bwResult = this.tryBlackWhiteTokens(backgroundHex, targetCssVar, tokens)
            if (bwResult) return bwResult

            return null
        } catch {
            return null
        }
    }

    /**
     * From a list of color candidates, find the one that:
     *  - passes AA against surfaceHex
     *  - is closest to the original color (least visual disruption)
     */
    private findBestPassingColor(
        candidates: { hex: string; family: string; level: string }[],
        surfaceHex: string,
        originalHex: string
    ): { hex: string; family: string; level: string } | null {
        let best: { hex: string; family: string; level: string } | null = null
        let bestDistance = Infinity

        for (const c of candidates) {
            const ratio = contrastRatio(surfaceHex, c.hex)
            if (ratio >= AA_THRESHOLD) {
                // Prefer the candidate closest to the original
                const dist = Math.abs(ratio - AA_THRESHOLD)
                if (dist < bestDistance) {
                    bestDistance = dist
                    best = c
                }
            }
        }

        return best
    }

    /**
     * Try black and white token values as suggestions.
     * Only returns if the value exists as an exact token.
     */
    private tryBlackWhiteTokens(
        surfaceHex: string,
        targetCssVar: string,
        tokens: JsonLike
    ): SuggestedFix | null {
        const blackContrast = contrastRatio(surfaceHex, '#000000')
        const whiteContrast = contrastRatio(surfaceHex, '#ffffff')

        // Try whichever has better contrast first
        const attempts: { hex: string; label: string; ratio: number }[] = blackContrast >= whiteContrast
            ? [{ hex: '#000000', label: 'black', ratio: blackContrast }, { hex: '#ffffff', label: 'white', ratio: whiteContrast }]
            : [{ hex: '#ffffff', label: 'white', ratio: whiteContrast }, { hex: '#000000', label: 'black', ratio: blackContrast }]

        for (const attempt of attempts) {
            if (attempt.ratio >= AA_THRESHOLD) {
                const cssVarRef = hexToCssVarRef(attempt.hex, tokens)
                if (cssVarRef) {
                    return {
                        description: `Change to ${attempt.label} (${attempt.ratio.toFixed(2)}:1)`,
                        targetCssVar,
                        suggestedValue: cssVarRef,
                        suggestedHex: attempt.hex,
                        resultingRatio: attempt.ratio,
                    }
                }
            }
        }

        return null
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
