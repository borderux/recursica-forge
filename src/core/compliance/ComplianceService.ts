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
    private setTheme: ((theme: JsonLike) => void) | null = null

    /**
     * Connect the service to the VarsStore's token/theme getters.
     * Called once from VarsStore constructor.
     */
    connect(
        getTokens: () => JsonLike,
        getTheme: () => JsonLike,
        setTheme?: (theme: JsonLike) => void
    ) {
        this.getTokens = getTokens
        this.getTheme = getTheme
        if (setTheme) this.setTheme = setTheme
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
     * Updates both the CSS var (for immediate visual effect) and
     * the theme JSON (so the change persists across navigation).
     */
    applySuggestion(issueId: string): boolean {
        if (!this.getTokens) return false

        const issue = this.issues.find(i => i.id === issueId)
        if (!issue || !issue.suggestion) return false

        const tokens = this.getTokens()
        updateCssVar(issue.suggestion.targetCssVar, issue.suggestion.suggestedValue, tokens)

        // Persist: update the theme JSON so the fix survives navigation
        if (this.setTheme && this.getTheme) {
            this.persistFixToThemeJson(
                issue.suggestion.targetCssVar,
                issue.suggestion.suggestedValue
            )
        }

        // Re-scan after applying fix
        this.triggerScan()
        return true
    }

    /**
     * Persist an undo operation to the theme JSON.
     * Called from CompliancePage when the user undoes a fix.
     */
    persistUndo(cssVar: string, originalValue: string) {
        this.persistFixToThemeJson(cssVar, originalValue)
        this.triggerScan()
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

                // Persist: update the theme JSON so the fix survives navigation
                if (this.setTheme && this.getTheme) {
                    this.persistFixToThemeJson(
                        issue.suggestion.targetCssVar,
                        issue.suggestion.suggestedValue
                    )
                }

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
            // Look for palettes in both possible paths:
            // 1. brand.themes.light.palettes (correct/new path)
            // 2. brand.light.palettes (legacy path, for palettes added before fix)
            const themePalettes = themes?.[mode]?.palettes || {}
            const rootPalettes = (themes !== root && root?.[mode]?.palettes) ? root[mode].palettes : {}
            // Merge: theme path takes priority, but include any from root path not already present
            const palettes = { ...rootPalettes, ...themePalettes }
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
                                const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode, highOpacity)
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
                            const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode, 1)
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
                const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode, 1)
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
                const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode, 1)
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
     *
     * All contrast checks blend the candidate on-tone with the tone at the
     * given emphasisOpacity so that suggestions are valid for the actual
     * rendered presentation.
     */
    private generateOnToneSuggestion(
        toneHex: string,
        onToneCssVar: string,
        tokens: JsonLike,
        _tokenIndex: ReturnType<typeof buildTokenIndex>,
        _mode: 'light' | 'dark',
        emphasisOpacity: number = 1
    ): SuggestedFix | null {
        try {
            // Get the current on-tone's color, and all levels in its family
            const onToneValue = readCssVar(onToneCssVar)
            if (!onToneValue) return null
            const onToneHex = resolveCssVarToHex(onToneValue, _tokenIndex as any)
            if (!onToneHex) return null

            // 1. Try all levels in the on-tone's own family
            const familyColors = getAllFamilyColors(onToneHex, tokens)
            const candidate = this.findBestPassingColor(familyColors, toneHex, onToneHex, emphasisOpacity)
            if (candidate) {
                const cssVarRef = hexToCssVarRef(candidate.hex, tokens)
                if (cssVarRef) {
                    const effectiveHex = emphasisOpacity < 1
                        ? (blendHexWithOpacity(candidate.hex, toneHex, emphasisOpacity) || candidate.hex)
                        : candidate.hex
                    return {
                        description: `Change on-tone to ${candidate.family}/${candidate.level} (${contrastRatio(toneHex, effectiveHex).toFixed(2)}:1)`,
                        targetCssVar: onToneCssVar,
                        suggestedValue: cssVarRef,
                        suggestedHex: candidate.hex,
                        resultingRatio: contrastRatio(toneHex, effectiveHex),
                    }
                }
            }

            // 2. Try black and white token values
            const bwResult = this.tryBlackWhiteTokens(toneHex, onToneCssVar, tokens, emphasisOpacity)
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
                    const altCandidate = this.findBestPassingColor(familyColors, altTone.hex, onToneHex, emphasisOpacity)
                    if (altCandidate) {
                        const cssVarRef = hexToCssVarRef(altCandidate.hex, tokens)
                        if (cssVarRef) {
                            const effectiveHex = emphasisOpacity < 1
                                ? (blendHexWithOpacity(altCandidate.hex, altTone.hex, emphasisOpacity) || altCandidate.hex)
                                : altCandidate.hex
                            return {
                                description: `Change on-tone to ${altCandidate.family}/${altCandidate.level} (${contrastRatio(altTone.hex, effectiveHex).toFixed(2)}:1)`,
                                targetCssVar: onToneCssVar,
                                suggestedValue: cssVarRef,
                                suggestedHex: altCandidate.hex,
                                resultingRatio: contrastRatio(toneHex, effectiveHex),
                            }
                        }
                    }

                    // Try black/white against this alternate tone
                    const bw = this.tryBlackWhiteTokens(altTone.hex, onToneCssVar, tokens, emphasisOpacity)
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
     *  - passes AA against surfaceHex (after blending at emphasisOpacity)
     *  - is closest to the AA threshold (least visual disruption)
     */
    private findBestPassingColor(
        candidates: { hex: string; family: string; level: string }[],
        surfaceHex: string,
        originalHex: string,
        emphasisOpacity: number = 1
    ): { hex: string; family: string; level: string } | null {
        let best: { hex: string; family: string; level: string } | null = null
        let bestDistance = Infinity

        for (const c of candidates) {
            // Blend the candidate on-tone with the surface at emphasis opacity
            const effectiveHex = emphasisOpacity < 1
                ? (blendHexWithOpacity(c.hex, surfaceHex, emphasisOpacity) || c.hex)
                : c.hex
            const ratio = contrastRatio(surfaceHex, effectiveHex)
            if (ratio >= AA_THRESHOLD) {
                // Prefer the candidate closest to the threshold
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
     * Blends them with surfaceHex at emphasisOpacity before checking contrast.
     * Only returns if the value exists as an exact token.
     */
    private tryBlackWhiteTokens(
        surfaceHex: string,
        targetCssVar: string,
        tokens: JsonLike,
        emphasisOpacity: number = 1
    ): SuggestedFix | null {
        // Blend black/white at emphasis opacity before checking contrast
        const effectiveBlack = emphasisOpacity < 1
            ? (blendHexWithOpacity('#000000', surfaceHex, emphasisOpacity) || '#000000')
            : '#000000'
        const effectiveWhite = emphasisOpacity < 1
            ? (blendHexWithOpacity('#ffffff', surfaceHex, emphasisOpacity) || '#ffffff')
            : '#ffffff'

        const blackContrast = contrastRatio(surfaceHex, effectiveBlack)
        const whiteContrast = contrastRatio(surfaceHex, effectiveWhite)

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

    /**
     * Persist a compliance fix to the theme JSON so it survives navigation.
     * Maps a CSS var name like `--recursica-brand-themes-light-palettes-palette-1-600-on-tone`
     * to the theme JSON path and updates the value.
     */
    private persistFixToThemeJson(cssVar: string, value: string) {
        if (!this.getTheme || !this.setTheme) return

        try {
            const themeCopy = JSON.parse(JSON.stringify(this.getTheme()))
            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy

            // Resolve the value to a theme JSON $value reference
            const jsonValue = this.cssVarRefToJsonRef(value, cssVar)
            if (!jsonValue) {
                console.warn(`[persistFixToThemeJson] Could not convert CSS var ref to JSON ref: ${value} for ${cssVar}`)
                return
            }

            // Parse palette on-tone vars:
            // --recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-on-tone
            const paletteMatch = cssVar.match(
                /--recursica-brand-themes-(light|dark)-palettes-(.+)-(\d{3,4}|primary|default)-on-tone$/
            )
            if (paletteMatch) {
                const [, mode, paletteKey, level] = paletteMatch
                const themes = root?.themes || root
                if (!themes?.[mode]?.palettes?.[paletteKey]?.[level]) {
                    console.warn(`[persistFixToThemeJson] Palette path not found: ${mode}.palettes.${paletteKey}.${level}`)
                    return
                }

                if (!themes[mode].palettes[paletteKey][level].color) {
                    themes[mode].palettes[paletteKey][level].color = {}
                }
                themes[mode].palettes[paletteKey][level].color['on-tone'] = {
                    $type: 'color',
                    $value: jsonValue
                }
                this.setTheme!(themeCopy)
                return
            }

            // Parse core color on-tone vars:
            // Simple: --recursica-brand-themes-{mode}-palettes-core-{colorKey}-on-tone
            // Interactive: --recursica-brand-themes-{mode}-palettes-core-interactive-{variant}-on-tone
            const coreInteractiveMatch = cssVar.match(
                /--recursica-brand-themes-(light|dark)-palettes-core-interactive-(default|hover)-on-tone$/
            )
            if (coreInteractiveMatch) {
                const [, mode, variant] = coreInteractiveMatch
                const themes = root?.themes || root
                const coreKey = themes?.[mode]?.palettes?.['core-colors'] ? 'core-colors' : 'core'
                if (!themes?.[mode]?.palettes?.[coreKey]?.interactive?.[variant]) {
                    console.warn(`[persistFixToThemeJson] Core interactive path not found: ${mode}.palettes.${coreKey}.interactive.${variant}`)
                    return
                }
                themes[mode].palettes[coreKey].interactive[variant]['on-tone'] = {
                    $type: 'color',
                    $value: jsonValue
                }
                this.setTheme!(themeCopy)
                return
            }

            const coreMatch = cssVar.match(
                /--recursica-brand-themes-(light|dark)-palettes-core-([a-z]+)-on-tone$/
            )
            if (coreMatch) {
                const [, mode, colorKey] = coreMatch
                const themes = root?.themes || root
                const coreKey = themes?.[mode]?.palettes?.['core-colors'] ? 'core-colors' : 'core'
                const colorObj = themes?.[mode]?.palettes?.[coreKey]?.[colorKey]
                if (!colorObj) {
                    console.warn(`[persistFixToThemeJson] Core path not found: ${mode}.palettes.${coreKey}.${colorKey}`)
                    return
                }

                // Core colors have on-tone at the top level (e.g., success.on-tone),
                // NOT nested under a 'color' sub-object. The CSS generator reads from
                // the top-level property, so always write there.
                // Clean up any spurious 'color' sub-object from previous bad writes
                if (colorObj.color && colorObj.color['on-tone']) {
                    delete colorObj.color['on-tone']
                    if (Object.keys(colorObj.color).length === 0) {
                        delete colorObj.color
                    }
                }
                colorObj['on-tone'] = {
                    $type: 'color',
                    $value: jsonValue
                }
                this.setTheme!(themeCopy)
                return
            }

            // Parse layer text/interactive vars:
            // --recursica-brand-themes-{mode}-layers-layer-{n}-elements-{subpath}
            // e.g., --recursica-brand-themes-light-layers-layer-0-elements-text-warning
            //       → brand.themes.light.layers.layer-0.elements.text.warning
            const layerMatch = cssVar.match(
                /--recursica-brand-themes-(light|dark)-layers-(layer-\d+)-elements-(.+)$/
            )
            if (layerMatch) {
                const [, mode, layer, subpath] = layerMatch
                const themes = root?.themes || root
                if (!themes?.[mode]?.layers?.[layer]?.elements) {
                    console.warn(`[persistFixToThemeJson] Layer path not found: ${mode}.layers.${layer}.elements`)
                    return
                }

                // Map CSS var subpath to JSON keys
                // Known mappings (CSS hyphen-separated → JSON nested):
                //   text-color → ["text", "color"]
                //   text-warning → ["text", "warning"]
                //   text-success → ["text", "success"]
                //   text-alert → ["text", "alert"]
                //   interactive-tone → ["interactive", "tone"]
                //   interactive-on-tone → ["interactive", "on-tone"]
                const jsonKeys = this.cssSubpathToJsonKeys(subpath)
                if (!jsonKeys) {
                    console.warn(`[persistFixToThemeJson] Unknown layer subpath: ${subpath}`)
                    return
                }

                let target: any = themes[mode].layers[layer].elements
                for (let i = 0; i < jsonKeys.length - 1; i++) {
                    if (!target[jsonKeys[i]]) target[jsonKeys[i]] = {}
                    target = target[jsonKeys[i]]
                }
                const lastKey = jsonKeys[jsonKeys.length - 1]
                target[lastKey] = { $type: 'color', $value: jsonValue }

                // When fixing interactive-color (which maps to interactive.tone),
                // also remove the legacy interactive.color property since buildLayerVars
                // gives interactive.color priority over interactive.tone
                if (subpath === 'interactive-color') {
                    const elements = themes[mode].layers[layer].elements
                    if (elements?.interactive?.color) {
                        delete elements.interactive.color
                    }

                    // Also sync interactive-tone CSS var — the compliance scan reads
                    // interactive-tone (not interactive-color) for the on-tone check,
                    // so we must update it immediately to prevent false positives.
                    try {
                        if (this.getTokens) {
                            const tokens = this.getTokens()
                            const toneVar = `--recursica-brand-themes-${mode}-layers-${layer}-elements-interactive-tone`
                            updateCssVar(toneVar, value, tokens)

                            // Also compute and persist a compliant on-tone for the new tone.
                            const tokenIndex = buildTokenIndex(tokens)
                            const newToneHex = resolveCssVarToHex(value, tokenIndex)
                            if (newToneHex) {
                                const onToneVar = `--recursica-brand-themes-${mode}-layers-${layer}-elements-interactive-on-tone`
                                const onToneValue = readCssVar(onToneVar)
                                const onToneHex = onToneValue ? resolveCssVarToHex(onToneValue, tokenIndex) : null

                                const currentRatio = onToneHex ? contrastRatio(newToneHex, onToneHex) : 0
                                if (currentRatio < AA_THRESHOLD) {
                                    const onToneSuggestion = this.generateSteppedColorSuggestion(
                                        onToneHex || '#ffffff', newToneHex, onToneVar, tokens, mode as 'light' | 'dark'
                                    )
                                    if (onToneSuggestion) {
                                        if (!elements.interactive) elements.interactive = {}
                                        const onToneJsonValue = this.cssVarRefToJsonRef(onToneSuggestion.suggestedValue, onToneVar)
                                        if (onToneJsonValue) {
                                            elements.interactive['on-tone'] = { $type: 'color', $value: onToneJsonValue }
                                        }
                                        updateCssVar(onToneVar, onToneSuggestion.suggestedValue, tokens)
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('[persistFixToThemeJson] Failed to sync tone/on-tone:', err)
                    }
                }

                this.setTheme!(themeCopy)
                return
            }

            console.warn(`[persistFixToThemeJson] No regex matched CSS var: ${cssVar}`)
        } catch (err) {
            console.warn('Failed to persist compliance fix to theme JSON:', err)
        }
    }

    /**
     * Convert a CSS var reference to a theme JSON $value reference.
     * The theme JSON uses references like:
     *   {brand.themes.light.palettes.core-colors.black.tone}
     *   {brand.themes.light.palettes.core-colors.white.tone}
     *   {tokens.colors.scale-04.800}
     * We need to figure out what the suggestion maps to.
     */
    private cssVarRefToJsonRef(cssVarRef: string, targetCssVar: string): string | null {
        // Extract the mode from the target CSS var
        const modeMatch = targetCssVar.match(/--recursica-brand-themes-(light|dark)-/)
        const mode = modeMatch ? modeMatch[1] : 'light'

        if (this.getTokens) {
            const tokens = this.getTokens()
            const tokenIndex = buildTokenIndex(tokens)

            // Resolve the CSS var ref to a hex color
            const varMatch = cssVarRef.match(/var\(([^)]+)\)/)
            if (varMatch) {
                const resolvedHex = resolveCssVarToHex(cssVarRef, tokenIndex)

                if (resolvedHex) {
                    const normalizedHex = resolvedHex.toLowerCase()

                    // Check against all core colors (black, white, alert, warning, success)
                    const coreColors = ['black', 'white', 'alert', 'warning', 'success']
                    for (const coreColor of coreColors) {
                        const coreCssVar = `--recursica-brand-themes-${mode}-palettes-core-${coreColor}`
                        const coreVal = readCssVar(coreCssVar)
                        const coreHex = coreVal ? resolveCssVarToHex(coreVal, tokenIndex) : null
                        if (coreHex && coreHex.toLowerCase() === normalizedHex) {
                            return `{brand.themes.${mode}.palettes.core-colors.${coreColor}.tone}`
                        }
                    }

                    // Check if it matches a specific token color
                    const found = findColorFamilyAndLevel(resolvedHex, tokens)
                    if (found) {
                        return `{tokens.colors.${found.family}.${found.level}}`
                    }
                }
            }
        }

        return null
    }

    /**
     * Map a CSS var subpath to JSON nested keys.
     * e.g. 'text-warning' → ['text', 'warning']
     *      'interactive-on-tone' → ['interactive', 'on-tone']
     */
    private cssSubpathToJsonKeys(subpath: string): string[] | null {
        // Explicit mapping for known layer element subpaths
        const knownMappings: Record<string, string[]> = {
            'text-color': ['text', 'color'],
            'text-warning': ['text', 'warning'],
            'text-success': ['text', 'success'],
            'text-alert': ['text', 'alert'],
            'interactive-tone': ['interactive', 'tone'],
            'interactive-color': ['interactive', 'tone'], // CSS interactive-color is alias for interactive.tone
            'interactive-on-tone': ['interactive', 'on-tone'],
            'interactive-tone-hover': ['interactive', 'tone-hover'],
            'interactive-on-tone-hover': ['interactive', 'on-tone-hover'],
        }

        if (knownMappings[subpath]) {
            return knownMappings[subpath]
        }

        // Fallback: try splitting by first hyphen only (category-key)
        const firstHyphen = subpath.indexOf('-')
        if (firstHyphen > 0) {
            return [subpath.substring(0, firstHyphen), subpath.substring(firstHyphen + 1)]
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
