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
import { findColorFamilyAndLevel, getAllFamilyColors, hexToCssVarRef, traceToTokenRef, getAllFamilyColorsByKey } from './layerColorStepping'
import { updateCssVar } from '../css/updateCssVar'
import { parseBrandCssVar, unwrapVar, paletteCore } from '../css/cssVarBuilder'
import { getVarsStore } from '../store/varsStore'

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
    type: 'palette-on-tone' | 'layer-text' | 'layer-interactive' | 'core-on-tone' | 'component-text'
    mode: 'light' | 'dark'
    location: string
    emphasis?: 'high' | 'low'
    toneHex: string
    onToneHex: string
    /** The raw (unblended) on-tone hex, before emphasis opacity is applied */
    rawOnToneHex?: string
    contrastRatio: number
    requiredRatio: number
    message: string
    suggestion: SuggestedFix | null
    /** CSS var name of the tone (background) for this issue, used to trace the reference chain */
    toneCssVar?: string
    /** Component name for component-text issues */
    componentName?: string
}

/** Result of a contrast check for a single mode */
export interface ModeResult {
    bgHex: string
    fgHex: string
    contrastRatio: number
    passes: boolean
}

/** Deduplicated component compliance issue showing both modes */
export interface ComponentComplianceIssue {
    id: string
    componentName: string
    location: string
    /** The foreground CSS var (mode placeholder replaced) */
    fgCssVarPattern: string
    /** The background CSS var (mode placeholder replaced) */
    bgCssVarPattern: string
    light: ModeResult
    dark: ModeResult
    suggestion: SuggestedFix | null
}

// ─── Service ───

const AA_THRESHOLD = 4.5

class ComplianceServiceImpl {
    private issues: ComplianceIssue[] = []
    private _componentIssues: ComponentComplianceIssue[] = []
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
     * Returns the theme issues found. Component issues are stored separately.
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

            // 6. Component text/icon vs background — dual-mode scan
            this._componentIssues = this.checkComponentTextColorsDualMode(tokenIndex, tokens)

            this.issues = newIssues
            // Emit event for React consumers
            const totalCount = newIssues.length + this._componentIssues.length
            window.dispatchEvent(new CustomEvent('complianceIssuesChanged', {
                detail: { issueCount: totalCount }
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
        }, 500)
    }

    getIssues(): ComplianceIssue[] {
        return this.issues
    }

    /** Theme issues only (palette, core, layer) */
    getThemeIssues(): ComplianceIssue[] {
        return this.issues
    }

    /** Deduplicated dual-mode component issues */
    getComponentIssues(): ComponentComplianceIssue[] {
        return this._componentIssues
    }

    getIssueCount(): number {
        return this.issues.length + this._componentIssues.length
    }

    /**
     * Apply a single suggested fix.
     * Writes the fix directly to CSS vars + theme JSON via writeCssVarsDirect.
     * No recompute is triggered — writes are terminal.
     */
    applySuggestion(issueId: string): boolean {
        const issue = this.issues.find(i => i.id === issueId)
        if (!issue || !issue.suggestion) return false

        const { targetCssVar, suggestedValue } = issue.suggestion
        getVarsStore().writeCssVarsDirect({ [targetCssVar]: suggestedValue })
        return true
    }

    /**
     * Persist an undo operation to the theme JSON.
     * Called from CompliancePage when the user undoes a fix.
     */
    persistUndo(cssVar: string, originalValue: string) {
        getVarsStore().writeCssVarsDirect({ [cssVar]: originalValue })
    }

    /**
     * Apply all suggested fixes.
     * Batches all fixes into a single writeCssVarsDirect call for efficiency.
     */
    applyAllSuggestions(): number {
        let applied = 0
        const cssVarUpdates: Record<string, string> = {}

        for (const issue of this.issues) {
            if (issue.suggestion) {
                cssVarUpdates[issue.suggestion.targetCssVar] = issue.suggestion.suggestedValue
                applied++
            }
        }

        if (applied > 0) {
            getVarsStore().writeCssVarsDirect(cssVarUpdates)
        }

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
            // Palettes inherit from light mode if not explicitly defined in dark mode
            const lightThemePalettes = themes?.['light']?.palettes || {}
            const lightRootPalettes = (themes !== root && root?.['light']?.palettes) ? root['light'].palettes : {}
            const basePalettes = { ...lightRootPalettes, ...lightThemePalettes }
            
            const themePalettes = themes?.[mode]?.palettes || {}
            const rootPalettes = (themes !== root && root?.[mode]?.palettes) ? root[mode].palettes : {}
            
            // Merge: light mode palettes act as the base (inherited), but mode-specific ones take priority
            const palettes = { ...basePalettes, ...rootPalettes, ...themePalettes }
            const levels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']

            // Read emphasis opacity values (use readCssVarNumber to resolve var() references)
            const highEmphasisVar = `--recursica_brand_themes_${mode}_text-emphasis_high`
            const lowEmphasisVar = `--recursica_brand_themes_${mode}_text-emphasis_low`
            const highOpacity = readCssVarNumber(highEmphasisVar, 1)
            const lowOpacity = readCssVarNumber(lowEmphasisVar, 0.6)

            Object.keys(palettes).forEach((paletteKey) => {
                if (paletteKey === 'core' || paletteKey === 'core-colors') return
                // Skip palettes that have been deleted by the user (deletion marker in brand delta)
                if (document.documentElement.style.getPropertyValue(`--recursica_brand_palette_deleted_${paletteKey}`).trim() === 'true') return

                levels.forEach((level) => {
                    const toneVar = `--recursica_brand_themes_${mode}_palettes_${paletteKey}_${level}_color_tone`
                    const onToneVar = `--recursica_brand_themes_${mode}_palettes_${paletteKey}_${level}_color_on-tone`

                    const toneValue = readCssVar(toneVar)
                    const onToneValue = readCssVar(onToneVar)
                    if (!toneValue || !onToneValue) return

                    const toneHex = resolveCssVarToHex(toneValue, tokenIndex as any)
                    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex as any)
                    if (!toneHex || !onToneHex) return

                    // Check high-contrast on-tone (on-tone blended at high emphasis opacity)
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
                                    rawOnToneHex: onToneHex,
                                    contrastRatio: highRatio,
                                    requiredRatio: AA_THRESHOLD,
                                    message: `High emphasis on-tone contrast ${highRatio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                                    suggestion,
                                    toneCssVar: toneVar
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
                                rawOnToneHex: onToneHex,
                                contrastRatio: ratio,
                                requiredRatio: AA_THRESHOLD,
                                message: `High emphasis on-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                                suggestion,
                                toneCssVar: toneVar
                            })
                        }
                    }

                    // Check low-contrast on-tone. Only flag if high-contrast issue for the
                    // same var was NOT already added — the high-contrast suggestion covers both.
                    const paletteHighIssueAdded = issues.some(i => i.id === `palette-${paletteKey}-${level}-high-${mode}`)
                    if (!isNaN(lowOpacity) && lowOpacity < 1 && !paletteHighIssueAdded) {
                        const blendedLow = blendHexWithOpacity(onToneHex, toneHex, lowOpacity)
                        if (blendedLow) {
                            const lowRatio = contrastRatio(toneHex, blendedLow)
                            if (lowRatio < AA_THRESHOLD) {
                                // Suggestion must satisfy BOTH high (1.0) and low (lowOpacity) emphasis
                                const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode, lowOpacity, 1)
                                issues.push({
                                    id: `palette-${paletteKey}-${level}-low-${mode}`,
                                    type: 'palette-on-tone',
                                    mode,
                                    location: `Palette ${paletteKey.replace('palette-', '')} / ${level}`,
                                    emphasis: 'low',
                                    toneHex,
                                    onToneHex: blendedLow,
                                    rawOnToneHex: onToneHex,
                                    contrastRatio: lowRatio,
                                    requiredRatio: AA_THRESHOLD,
                                    message: `Low emphasis on-tone contrast ${lowRatio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                                    suggestion,
                                    toneCssVar: toneVar
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
        const simpleCoreColors = ['alert', 'warning', 'success', 'high-contrast', 'low-contrast']

        const coreColorLabel = (key: string): string => {
            if (key === 'high-contrast') return mode === 'light' ? 'High contrast (Black)' : 'High contrast (White)'
            if (key === 'low-contrast') return mode === 'light' ? 'Low contrast (White)' : 'Low contrast (Black)'
            return key.charAt(0).toUpperCase() + key.slice(1)
        }

        simpleCoreColors.forEach((colorKey) => {
            const toneVar = `--recursica_brand_themes_${mode}_palettes_core-colors_${colorKey}_tone`
            const onToneVar = `--recursica_brand_themes_${mode}_palettes_core-colors_${colorKey}_on-tone`

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
                    location: `Core / ${coreColorLabel(colorKey)}`,
                    emphasis: 'high',
                    toneHex,
                    onToneHex,
                    rawOnToneHex: onToneHex,
                    contrastRatio: ratio,
                    requiredRatio: AA_THRESHOLD,
                    message: `High emphasis on-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                    suggestion,
                    toneCssVar: toneVar
                })
            }

            // Check low-contrast on-tone (on-tone blended at low emphasis opacity).
            // Only flag if a high-contrast issue for the same var was NOT already added —
            // the high-contrast suggestion already satisfies the stricter constraint.
            const lowEmphasisVar = `--recursica_brand_themes_${mode}_text-emphasis_low`
            const opacity = readCssVarNumber(lowEmphasisVar, 1)
            const highIssueAlreadyAdded = issues.some(i => i.id === `core-${colorKey}-${mode}`)
            if (opacity < 1 && !highIssueAlreadyAdded) {
                const blendedHex = blendHexWithOpacity(onToneHex, toneHex, opacity)
                if (blendedHex) {
                    const lowRatio = contrastRatio(toneHex, blendedHex)
                    if (lowRatio < AA_THRESHOLD) {
                        // Generate suggestion that satisfies BOTH high (1.0) and low (opacity) emphasis
                        const suggestion = this.generateOnToneSuggestion(toneHex, onToneVar, tokens, tokenIndex, mode, opacity, 1)
                        issues.push({
                            id: `core-${colorKey}-low-contrast-${mode}`,
                            type: 'core-on-tone',
                            mode,
                            location: `Core / ${coreColorLabel(colorKey)}`,
                            emphasis: 'low',
                            toneHex,
                            onToneHex: blendedHex,
                            rawOnToneHex: onToneHex,
                            contrastRatio: lowRatio,
                            requiredRatio: AA_THRESHOLD,
                            message: `Low emphasis on-tone contrast ${lowRatio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                            suggestion,
                            toneCssVar: toneVar
                        })
                    }
                }
            }

            // Check interactive color
            const interactiveVar = `--recursica_brand_themes_${mode}_palettes_core-colors_${colorKey}_interactive`
            const interactiveValue = readCssVar(interactiveVar)
            if (interactiveValue) {
                const interactiveHex = resolveCssVarToHex(interactiveValue, tokenIndex as any)
                if (interactiveHex) {
                    const intRatio = contrastRatio(toneHex, interactiveHex)
                    if (intRatio < AA_THRESHOLD) {
                        const suggestion = this.generateSteppedColorSuggestion(interactiveHex, toneHex, interactiveVar, tokens, mode)
                        issues.push({
                            id: `core-${colorKey}-interactive-${mode}`,
                            type: 'core-on-tone',
                            mode,
                            location: `Core / ${coreColorLabel(colorKey)}`,
                            
                            toneHex,
                            onToneHex: interactiveHex,
                            rawOnToneHex: interactiveHex,
                            contrastRatio: intRatio,
                            requiredRatio: AA_THRESHOLD,
                            message: `Interactive color contrast ratio ${intRatio.toFixed(2)}:1 < ${AA_THRESHOLD}:1`,
                            suggestion,
                            toneCssVar: toneVar
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
            const toneVar = `--recursica_brand_themes_${mode}_palettes_core-colors_interactive_${variant}_tone`
            const onToneVar = `--recursica_brand_themes_${mode}_palettes_core-colors_interactive_${variant}_on-tone`

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
                    suggestion,
                    toneCssVar: toneVar
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
            const surfaceVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_properties_surface`
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
                const textVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_${key}`
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
                        rawOnToneHex: textHex,
                        contrastRatio: ratio,
                        requiredRatio: AA_THRESHOLD,
                        message: `${label} contrast ${ratio.toFixed(2)}:1 vs surface is below ${AA_THRESHOLD}:1`,
                        suggestion,
                        toneCssVar: surfaceVar
                    })
                }
            })
        }
    }

    /**
     * Check layer text colors with low-contrast opacity applied.
     * Blends text color with surface at the emphasis opacity to compute effective contrast.
     */
    private checkLayerTextEmphasis(
        issues: ComplianceIssue[],
        tokenIndex: ReturnType<typeof buildTokenIndex>,
        tokens: JsonLike,
        mode: 'light' | 'dark'
    ) {
        for (let layer = 0; layer <= 3; layer++) {
            const surfaceVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_properties_surface`
            const surfaceValue = readCssVar(surfaceVar)
            if (!surfaceValue) continue

            const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex as any)
            if (!surfaceHex) continue

            const textVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_text-color`
            const textValue = readCssVar(textVar)
            if (!textValue) continue

            const textHex = resolveCssVarToHex(textValue, tokenIndex as any)
            if (!textHex) continue

            // Check low-contrast text
            const lowEmphasisVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_text-low-emphasis`
            const opacity = readCssVarNumber(lowEmphasisVar, 1)
            if (opacity >= 1) continue

            // Blend text color with surface at the given opacity
            const blendedHex = blendHexWithOpacity(textHex, surfaceHex, opacity)
            if (!blendedHex) continue

            const ratio = contrastRatio(surfaceHex, blendedHex)
            if (ratio < AA_THRESHOLD) {
                issues.push({
                    id: `layer-${layer}-text-low-contrast-${mode}`,
                    type: 'layer-text',
                    mode,
                    location: `Layer ${layer} / Low emphasis text`,
                    emphasis: 'low' as const,
                    toneHex: surfaceHex,
                    onToneHex: blendedHex,
                    rawOnToneHex: textHex,
                    contrastRatio: ratio,
                    requiredRatio: AA_THRESHOLD,
                    message: `Low emphasis text contrast ${ratio.toFixed(2)}:1 vs surface is below ${AA_THRESHOLD}:1`,
                    suggestion: null, // Emphasis is an opacity, not a color — no auto-fix
                    toneCssVar: surfaceVar
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
            const surfaceVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_properties_surface`
            const surfaceValue = readCssVar(surfaceVar)
            if (!surfaceValue) continue

            const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex as any)
            if (!surfaceHex) continue

            // Check interactive-color vs surface
            const interactiveVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_interactive-color`
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
                            rawOnToneHex: interactiveHex,
                            contrastRatio: ratio,
                            requiredRatio: AA_THRESHOLD,
                            message: `Interactive color contrast ${ratio.toFixed(2)}:1 vs surface is below ${AA_THRESHOLD}:1`,
                            suggestion,
                            toneCssVar: surfaceVar
                        })
                    }
                }
            }

            // Check interactive tone vs on-tone
            const iToneVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_interactive-tone`
            const iOnToneVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_interactive-on-tone`
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
                            rawOnToneHex: iOnToneHex,
                            contrastRatio: ratio,
                            requiredRatio: AA_THRESHOLD,
                            message: `Interactive on-tone contrast ${ratio.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                            suggestion,
                            toneCssVar: iToneVar
                        })
                    }
                }
            }

            // Check interactive hover tone vs on-tone-hover
            const iToneHoverVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_interactive-tone-hover`
            const iOnToneHoverVar = `--recursica_brand_themes_${mode}_layers_layer-${layer}_elements_interactive-on-tone-hover`
            const iToneHoverValue = readCssVar(iToneHoverVar)
            const iOnToneHoverValue = readCssVar(iOnToneHoverVar)
            if (iToneHoverValue && iOnToneHoverValue) {
                const iToneHoverHex = resolveCssVarToHex(iToneHoverValue, tokenIndex as any)
                const iOnToneHoverHex = resolveCssVarToHex(iOnToneHoverValue, tokenIndex as any)
                if (iToneHoverHex && iOnToneHoverHex) {
                    const ratioHover = contrastRatio(iToneHoverHex, iOnToneHoverHex)
                    if (ratioHover < AA_THRESHOLD) {
                        const suggestionHover = this.generateSteppedColorSuggestion(
                            iOnToneHoverHex, iToneHoverHex, iOnToneHoverVar, tokens, mode
                        )
                        issues.push({
                            id: `layer-${layer}-interactive-ontone-hover-${mode}`,
                            type: 'layer-interactive',
                            mode,
                            location: `Layer ${layer} / Interactive hover on-tone`,
                            toneHex: iToneHoverHex,
                            onToneHex: iOnToneHoverHex,
                            rawOnToneHex: iOnToneHoverHex,
                            contrastRatio: ratioHover,
                            requiredRatio: AA_THRESHOLD,
                            message: `Interactive hover on-tone contrast ${ratioHover.toFixed(2)}:1 is below ${AA_THRESHOLD}:1`,
                            suggestion: suggestionHover,
                            toneCssVar: iToneHoverVar
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
        emphasisOpacity: number = 1,
        otherEmphasisOpacity?: number
    ): SuggestedFix | null {
        try {
            // Get the current on-tone's color, and all levels in its family
            const onToneValue = readCssVar(onToneCssVar)
            if (!onToneValue) return null
            const onToneHex = resolveCssVarToHex(onToneValue, _tokenIndex as any)
            if (!onToneHex) return null

            // 1. Try all levels in the on-tone's own family (tracing the var to find the correct family)
            const traced = traceToTokenRef(onToneCssVar)
            const familyColors = traced 
                ? getAllFamilyColorsByKey(traced.family, tokens)
                : getAllFamilyColors(onToneHex, tokens)
                
            const candidate = this.findBestPassingColor(familyColors, toneHex, onToneHex, emphasisOpacity, undefined, otherEmphasisOpacity)
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
            const bwResult = this.tryBlackWhiteTokens(toneHex, onToneCssVar, tokens, emphasisOpacity, undefined, otherEmphasisOpacity)
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

    private getSemanticPairSuggestion(
        bgValue: string,
        targetCssVar: string,
        mode: 'light' | 'dark',
        tokens: JsonLike,
    ): SuggestedFix | null {
        let suggestedVarRef: string | null = null;
        let desc = '';

        if (!bgValue || !bgValue.includes('var(')) return null;
        
        // Convert to generic mode-less token path if it contains themes_{mode}
        let genericBgValue = bgValue;
        if (bgValue.includes(`_themes_${mode}_`)) {
            genericBgValue = bgValue.replace(`_themes_${mode}_`, '_');
        }

        if (bgValue.includes('_palettes_core_') || bgValue.includes('_palettes_core-colors_')) {
            if (bgValue.endsWith('_tone)')) {
                suggestedVarRef = bgValue.replace('_tone)', '_on-tone)');
                const parts = bgValue.split('_');
                const colorName = parts[parts.length - 2];
                desc = `Use semantic pair: ${colorName} on-tone`;
            }
        } else if (bgValue.includes('_layers_layer-')) {
            if (bgValue.endsWith('_properties_surface)')) {
                suggestedVarRef = bgValue.replace('_properties_surface)', '_elements_text-color)');
                const layerName = bgValue.split('_layers_')[1].split('_')[0];
                desc = `Use semantic pair: ${layerName} text color`;
            } else if (bgValue.endsWith('_elements_interactive_tone)')) {
                suggestedVarRef = bgValue.replace('_elements_interactive_tone)', '_elements_interactive_on-tone)');
                const layerName = bgValue.split('_layers_')[1].split('_')[0];
                desc = `Use semantic pair: ${layerName} interactive on-tone`;
            }
        } else if (bgValue.includes('_palettes_palette-')) {
            if (bgValue.endsWith('_color_tone)')) {
                suggestedVarRef = bgValue.replace('_color_tone)', '_color_on-tone)');
                desc = `Use semantic pair: palette on-tone`;
            }
        }

        if (suggestedVarRef) {
            const tokenIndex = this.getTokens ? buildTokenIndex(this.getTokens()) : null;
            const suggestedHex = tokenIndex ? resolveCssVarToHex(suggestedVarRef, tokenIndex) : '#000000';
            return {
                description: desc,
                targetCssVar,
                suggestedValue: suggestedVarRef,
                suggestedHex: suggestedHex || '#000000',
                resultingRatio: 4.5 // Placeholder, semantic pairing implies AA compliance
            };
        }
        return null;
    }

    private generateSteppedColorSuggestion(
        foregroundHex: string,
        backgroundHex: string,
        targetCssVar: string,
        tokens: JsonLike,
        _mode: 'light' | 'dark',
        otherBackgroundHex?: string,
        strictPalette: boolean = false
    ): SuggestedFix | null {
        try {
            // 1. Try all levels in the foreground's family (tracing the var to find the correct family)
            const traced = traceToTokenRef(targetCssVar)
            const familyColors = traced
                ? getAllFamilyColorsByKey(traced.family, tokens)
                : getAllFamilyColors(foregroundHex, tokens)
            
            const candidate = this.findBestPassingColor(familyColors, backgroundHex, foregroundHex, 1, otherBackgroundHex)
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

            if (!strictPalette) {
                // 2. Try black and white
                const bwResult = this.tryBlackWhiteTokens(backgroundHex, targetCssVar, tokens, 1, otherBackgroundHex)
                if (bwResult) return bwResult
            }

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
        emphasisOpacity: number = 1,
        otherSurfaceHex?: string,
        otherEmphasisOpacity?: number
    ): { hex: string; family: string; level: string } | null {
        let best: { hex: string; family: string; level: string } | null = null
        let bestDistance = Infinity

        for (const c of candidates) {
            // Blend the candidate on-tone with the surface at emphasis opacity
            const effectiveHex = emphasisOpacity < 1
                ? (blendHexWithOpacity(c.hex, surfaceHex, emphasisOpacity) || c.hex)
                : c.hex
            const ratio = contrastRatio(surfaceHex, effectiveHex)

            // Also verify the candidate passes at the other emphasis opacity (e.g. high=1.0
            // when checking a low-contrast suggestion) so one fix satisfies both issues.
            let passesOtherEmphasis = true
            if (otherEmphasisOpacity !== undefined && otherEmphasisOpacity !== emphasisOpacity) {
                const otherEffective = otherEmphasisOpacity < 1
                    ? (blendHexWithOpacity(c.hex, surfaceHex, otherEmphasisOpacity) || c.hex)
                    : c.hex
                if (contrastRatio(surfaceHex, otherEffective) < 4.5) passesOtherEmphasis = false
            }
            
            let passesOther = true;
            if (otherSurfaceHex) {
                const otherEffectiveHex = emphasisOpacity < 1
                    ? (blendHexWithOpacity(c.hex, otherSurfaceHex, emphasisOpacity) || c.hex)
                    : c.hex
                const otherRatio = contrastRatio(otherSurfaceHex, otherEffectiveHex)
                if (otherRatio < 4.5) passesOther = false;
            }

            if (ratio >= 4.5 && passesOther && passesOtherEmphasis) {
                // Prefer the candidate closest to the threshold
                const dist = Math.abs(ratio - 4.5)
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
        emphasisOpacity: number = 1,
        otherSurfaceHex?: string,
        otherEmphasisOpacity?: number
    ): SuggestedFix | null {
        const modeMatch = targetCssVar.match(/_themes_(light|dark)_/);
        const mode = modeMatch ? modeMatch[1] : 'light';
        
        let actualBlackHex = '#000000';
        let actualWhiteHex = '#ffffff';

        const tokenIndex = this.getTokens ? buildTokenIndex(this.getTokens()) : null;
        if (tokenIndex) {
            const blackVar = `--recursica_brand_themes_${mode}_palettes_core-colors_high-contrast`;
            const whiteVar = `--recursica_brand_themes_${mode}_palettes_core-colors_low-contrast`;
            
            const blackValue = readCssVar(blackVar);
            const whiteValue = readCssVar(whiteVar);
            
            if (blackValue) {
                const bHex = resolveCssVarToHex(blackValue, tokenIndex as any);
                if (bHex) actualBlackHex = bHex;
            }
            if (whiteValue) {
                const wHex = resolveCssVarToHex(whiteValue, tokenIndex as any);
                if (wHex) actualWhiteHex = wHex;
            }
        }

        // Blend black/white at emphasis opacity before checking contrast
        const effectiveBlack = emphasisOpacity < 1
            ? (blendHexWithOpacity(actualBlackHex, surfaceHex, emphasisOpacity) || actualBlackHex)
            : actualBlackHex;
        const effectiveWhite = emphasisOpacity < 1
            ? (blendHexWithOpacity(actualWhiteHex, surfaceHex, emphasisOpacity) || actualWhiteHex)
            : actualWhiteHex;

        const blackContrast = contrastRatio(surfaceHex, effectiveBlack);
        const whiteContrast = contrastRatio(surfaceHex, effectiveWhite);

        let blackPassesOther = true;
        let whitePassesOther = true;

        if (otherSurfaceHex) {
            const otherEffectiveBlack = emphasisOpacity < 1
                ? (blendHexWithOpacity(actualBlackHex, otherSurfaceHex, emphasisOpacity) || actualBlackHex)
                : actualBlackHex;
            const otherEffectiveWhite = emphasisOpacity < 1
                ? (blendHexWithOpacity(actualWhiteHex, otherSurfaceHex, emphasisOpacity) || actualWhiteHex)
                : actualWhiteHex;
            
            if (contrastRatio(otherSurfaceHex, otherEffectiveBlack) < 4.5) blackPassesOther = false;
            if (contrastRatio(otherSurfaceHex, otherEffectiveWhite) < 4.5) whitePassesOther = false;
        }

        const attempts = blackContrast >= whiteContrast
            ? [{ hex: actualBlackHex, label: 'high emphasis', ratio: blackContrast, passesOther: blackPassesOther, key: 'high-contrast' }, { hex: actualWhiteHex, label: 'low emphasis', ratio: whiteContrast, passesOther: whitePassesOther, key: 'low-contrast' }]
            : [{ hex: actualWhiteHex, label: 'low emphasis', ratio: whiteContrast, passesOther: whitePassesOther, key: 'low-contrast' }, { hex: actualBlackHex, label: 'high emphasis', ratio: blackContrast, passesOther: blackPassesOther, key: 'high-contrast' }];

        for (const attempt of attempts) {
            // Also verify this candidate passes at otherEmphasisOpacity if provided
            let passesOtherEmphasis = true
            if (otherEmphasisOpacity !== undefined && otherEmphasisOpacity !== emphasisOpacity) {
                const otherEffective = otherEmphasisOpacity < 1
                    ? (blendHexWithOpacity(attempt.hex, surfaceHex, otherEmphasisOpacity) || attempt.hex)
                    : attempt.hex
                if (contrastRatio(surfaceHex, otherEffective) < 4.5) passesOtherEmphasis = false
            }

            if (attempt.ratio >= 4.5 && attempt.passesOther && passesOtherEmphasis) {
                let cssVarRef = hexToCssVarRef(attempt.hex, tokens);
                if (!cssVarRef) {
                    // Emit a proper var() CSS reference, not a {brand...} DTCG reference,
                    // so validateCssVarValue accepts it and the fix is actually applied.
                    cssVarRef = `var(${paletteCore(mode, attempt.key, 'tone')})`;
                }
                return {
                    description: `Change to ${attempt.label} (${attempt.ratio.toFixed(2)}:1)`,
                    targetCssVar,
                    suggestedValue: cssVarRef,
                    suggestedHex: attempt.hex,
                    resultingRatio: attempt.ratio,
                };
            }
        }

        return null;
    }

    /**
     * Apply a compliance fix to a theme JSON copy (in-place mutation).
     * Maps a CSS var name like `--recursica_brand_themes_light_palettes_palette_1_600_color_on-tone`
     * to the theme JSON path and updates the value.
     * Does NOT call setTheme — caller handles persistence via writeCssVarsDirect.
     */
    private applyFixToThemeCopy(themeCopy: any, cssVar: string, value: string) {
        try {
            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy

            // Resolve the value to a theme JSON $value reference
            const jsonValue = this.cssVarRefToJsonRef(value, cssVar)
            if (!jsonValue) {
                return
            }

            // IMPORTANT: Check core color regexes BEFORE the greedy palette regex.
            // The palette regex uses (.+) which would incorrectly capture
            // core-interactive vars (e.g. "core-interactive" as paletteKey, "default" as level).

            // Parse core color on-tone vars (interactive):
            // --recursica_brand_themes_{mode}-palettes-core-interactive-{variant}-on-tone
            const coreInteractiveMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_palettes_(core|core-colors)_interactive_(default|hover)_on-tone$/
            )
            if (coreInteractiveMatch) {
                const [, mode, , variant] = coreInteractiveMatch
                const themes = root?.themes || root
                const coreKey = themes?.[mode]?.palettes?.['core-colors'] ? 'core-colors' : 'core'
                if (!themes?.[mode]?.palettes?.[coreKey]?.interactive?.[variant]) return
                themes[mode].palettes[coreKey].interactive[variant]['on-tone'] = {
                    $type: 'color',
                    $value: jsonValue
                }
                return
            }

            // Parse core color on-tone vars (simple):
            // --recursica_brand_themes_{mode}-palettes-core-{colorKey}-on-tone
            const coreMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_palettes_(core|core-colors)_([a-z]+)_on-tone$/
            )
            if (coreMatch) {
                const [, mode, , colorKey] = coreMatch
                const themes = root?.themes || root
                const coreKey = themes?.[mode]?.palettes?.['core-colors'] ? 'core-colors' : 'core'
                const colorObj = themes?.[mode]?.palettes?.[coreKey]?.[colorKey]
                if (!colorObj) return

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
                return
            }

            // Parse palette on-tone vars (AFTER core regexes to avoid false matches):
            // --recursica_brand_themes_{mode}_palettes_{paletteKey}_{level}_color_on-tone
            const paletteMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_palettes_(.+)_(\d{3,4}|primary|default)_color_on-tone$/
            )
            if (paletteMatch) {
                const [, mode, paletteKey, level] = paletteMatch
                const themes = root?.themes || root
                if (!themes?.[mode]?.palettes?.[paletteKey]?.[level]) return

                if (!themes[mode].palettes[paletteKey][level].color) {
                    themes[mode].palettes[paletteKey][level].color = {}
                }
                themes[mode].palettes[paletteKey][level].color['on-tone'] = {
                    $type: 'color',
                    $value: jsonValue
                }
                return
            }

            // Parse layer text/interactive vars:
            // --recursica_brand_themes_{mode}_layers_layer-{n}_elements_{subpath}
            // e.g., --recursica_brand_themes_light_layers_layer-0_elements_text_warning
            //       → brand.themes.light.layers.layer-0.elements.text.warning
            const layerMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_layers_(layer-\d+)_elements_(.+)$/
            )
            if (layerMatch) {
                const [, mode, layer, subpath] = layerMatch
                const themes = root?.themes || root
                if (!themes?.[mode]?.layers?.[layer]?.elements) return

                // Map CSS var subpath to JSON keys
                // Known mappings (CSS hyphen-separated → JSON nested):
                //   text-color → ["text", "color"]
                //   text-warning → ["text", "warning"]
                //   text-success → ["text", "success"]
                //   text-alert → ["text", "alert"]
                //   interactive-tone → ["interactive", "tone"]
                //   interactive-on-tone → ["interactive", "on-tone"]
                const jsonKeys = this.cssSubpathToJsonKeys(subpath)
                if (!jsonKeys) return

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
                            const toneVar = `--recursica_brand_themes_${mode}_layers_${layer}_elements_interactive-tone`
                            updateCssVar(toneVar, value, tokens)

                            // Also compute and persist a compliant on-tone for the new tone.
                            const tokenIndex = buildTokenIndex(tokens)
                            const newToneHex = resolveCssVarToHex(value, tokenIndex)
                            if (newToneHex) {
                                const onToneVar = `--recursica_brand_themes_${mode}_layers_${layer}_elements_interactive-on-tone`
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
                return
            }
        } catch (err) {
            // Silently skip — caller will handle the overall operation
        }
    }

    /**
     * Persist a compliance fix to the theme JSON so it survives navigation.
     * Maps a CSS var name like `--recursica_brand_themes_light_palettes_palette_1_600_color_on-tone`
     * to the theme JSON path and updates the value.
     */
    private persistFixToThemeJson(cssVar: string, value: string) {
        if (!this.getTheme || !this.setTheme) return

        try {
            const themeCopy = getVarsStore().getLatestThemeCopy()
            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy

            // Resolve the value to a theme JSON $value reference
            const jsonValue = this.cssVarRefToJsonRef(value, cssVar)
            if (!jsonValue) {
                console.warn(`[persistFixToThemeJson] Could not convert CSS var ref to JSON ref: ${value} for ${cssVar}`)
                return
            }

            // IMPORTANT: Check core color regexes BEFORE the greedy palette regex.
            // The palette regex uses (.+) which would incorrectly capture
            // core-interactive vars (e.g. "core-interactive" as paletteKey, "default" as level).

            // Parse core color on-tone vars (interactive):
            // --recursica_brand_themes_{mode}-palettes-core-interactive-{variant}-on-tone
            const coreInteractiveMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_palettes_(core|core-colors)_interactive_(default|hover)_on-tone$/
            )
            if (coreInteractiveMatch) {
                const [, mode, , variant] = coreInteractiveMatch
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

            // Parse core color on-tone vars (simple):
            // --recursica_brand_themes_{mode}-palettes-core-{colorKey}-on-tone
            const coreMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_palettes_(core|core-colors)_([a-z]+)_on-tone$/
            )
            if (coreMatch) {
                const [, mode, , colorKey] = coreMatch
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

            // Parse palette on-tone vars (AFTER core regexes to avoid false matches):
            // --recursica_brand_themes_{mode}_palettes_{paletteKey}_{level}_color_on-tone
            const paletteMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_palettes_(.+)_(\d{3,4}|primary|default)_color_on-tone$/
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

            // Parse layer text/interactive vars:
            // --recursica_brand_themes_{mode}_layers_layer-{n}_elements_{subpath}
            // e.g., --recursica_brand_themes_light_layers_layer-0_elements_text_warning
            //       → brand.themes.light.layers.layer-0.elements.text.warning
            const layerMatch = cssVar.match(
                /--recursica_brand_themes_(light|dark)_layers_(layer-\d+)_elements_(.+)$/
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
                            const toneVar = `--recursica_brand_themes_${mode}_layers_${layer}_elements_interactive-tone`
                            updateCssVar(toneVar, value, tokens)

                            // Also compute and persist a compliant on-tone for the new tone.
                            const tokenIndex = buildTokenIndex(tokens)
                            const newToneHex = resolveCssVarToHex(value, tokenIndex)
                            if (newToneHex) {
                                const onToneVar = `--recursica_brand_themes_${mode}_layers_${layer}_elements_interactive-on-tone`
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
     *   {brand.themes.light.palettes.core-colors.high-contrast.tone}
     *   {brand.themes.light.palettes.core-colors.low-contrast.tone}
     *   {tokens.colors.scale-04.800}
     * We need to figure out what the suggestion maps to.
     */
    private cssVarRefToJsonRef(cssVarRef: string, targetCssVar: string): string | null {
        // Extract the mode from the target CSS var
        const brandParsed = parseBrandCssVar(targetCssVar)
        const mode = (brandParsed && 'mode' in brandParsed ? brandParsed.mode : null) || 'light'

        if (this.getTokens) {
            const tokens = this.getTokens()
            const tokenIndex = buildTokenIndex(tokens)

            // Resolve the CSS var ref to a hex color
            const varName = unwrapVar(cssVarRef)
            if (varName) {
                const resolvedHex = resolveCssVarToHex(cssVarRef, tokenIndex)

                if (resolvedHex) {
                    const normalizedHex = resolvedHex.toLowerCase()

                    // Check against all core colors (black, white, alert, warning, success)
                    const coreColors = ['high-contrast', 'low-contrast', 'alert', 'warning', 'success']
                    for (const coreColor of coreColors) {
                        const coreCssVar = `--recursica_brand_themes_${mode}_palettes_core-colors_${coreColor}_tone`
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
    // ─── Component Compliance Scanner ───

    /**
     * Check component text/icon colors against their backgrounds.
     * Scans form fields, buttons, chips, badges, accordion items, menu items,
     * segmented control, and transfer list.
     * Skips disabled states.
     */
    private checkContrastAndAddIssue(
        fgVar: string,
        bgVar: string,
        fgValue: string,
        bgValue: string,
        fgHex: string,
        bgHex: string,
        otherBgHex: string | undefined,
        propLabel: string,
        location: string,
        compName: string,
        mode: 'light' | 'dark',
        prop: string,
        layer: string,
        variantName: string,
        tokens: any,
        tokenIndex: any,
        issues: ComplianceIssue[]
    ) {
        const ratio = contrastRatio(bgHex, fgHex)
        if (ratio < AA_THRESHOLD) {
            let suggestion = null;
            const resolveTargetVar = (uikitVar: string): string => uikitVar;
            if (fgValue.includes('interactive') || fgValue.includes('palettes_')) {
                const fgOnToneSuggestion = this.getSemanticPairSuggestion(fgValue, resolveTargetVar(fgVar), mode, tokens);
                if (fgOnToneSuggestion) {
                    const fgOnToneHex = resolveCssVarToHex(fgOnToneSuggestion.suggestedValue, tokenIndex as any);
                    if (fgOnToneHex && contrastRatio(bgHex, fgOnToneHex) >= AA_THRESHOLD) {
                        suggestion = fgOnToneSuggestion;
                    }
                }
                if (!suggestion) {
                    const bgOnToneSuggestion = this.getSemanticPairSuggestion(bgValue, resolveTargetVar(fgVar), mode, tokens);
                    if (bgOnToneSuggestion) {
                        const bgOnToneHex = resolveCssVarToHex(bgOnToneSuggestion.suggestedValue, tokenIndex as any);
                        if (bgOnToneHex && contrastRatio(bgHex, bgOnToneHex) >= AA_THRESHOLD) {
                            suggestion = bgOnToneSuggestion;
                        }
                    }
                }
                if (!suggestion) {
                    suggestion = this.tryBlackWhiteTokens(bgHex, resolveTargetVar(fgVar), tokens, 1, otherBgHex);
                }
            } else {
                suggestion = this.getSemanticPairSuggestion(bgValue, resolveTargetVar(fgVar), mode, tokens);
                if (suggestion) {
                    const suggHex = resolveCssVarToHex(suggestion.suggestedValue, tokenIndex as any);
                    if (!suggHex || contrastRatio(bgHex, suggHex) < AA_THRESHOLD) {
                        suggestion = null;
                    }
                }
                if (!suggestion) {
                    suggestion = this.tryBlackWhiteTokens(bgHex, resolveTargetVar(fgVar), tokens, 1, otherBgHex);
                }
            }
            let genericFgValue = fgValue;
            if (fgValue.includes(`_themes_${mode}_`)) {
                genericFgValue = fgValue.replace(`_themes_${mode}_`, '_');
            }
            if (suggestion && (suggestion.suggestedValue === fgValue || suggestion.suggestedValue === genericFgValue)) {
                suggestion = null;
            }

            issues.push({
                id: `comp-${compName}-${variantName}-${layer}-${prop}-${mode}`,
                type: 'component-text',
                mode,
                componentName: compName,
                location,
                toneHex: bgHex,
                onToneHex: fgHex,
                rawOnToneHex: fgHex,
                contrastRatio: ratio,
                requiredRatio: AA_THRESHOLD,
                message: `${propLabel} contrast ${ratio.toFixed(2)}:1 vs background is below ${AA_THRESHOLD}:1`,
                suggestion,
                toneCssVar: bgVar,
            })
        }
    }

    private checkComponentTextColors(
        issues: ComplianceIssue[],
        tokenIndex: ReturnType<typeof buildTokenIndex>,
        tokens: JsonLike,
        mode: 'light' | 'dark'
    ) {
        try {
            const uikit = getVarsStore().getState().uikit as any
            const components = uikit?.['ui-kit']?.components ?? uikit?.components ?? {}
            const layers: string[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']

            const toLabel = (s: string) => {
                const words = s.split('-')
                return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ')
            }

            const compConfigs: Array<{
                names: string[];
                variantGroup: 'states' | 'styles';
                fgProps: string[];
            }> = [
                {
                    names: ['text-field', 'textarea', 'dropdown', 'autocomplete', 'number-input', 'date-picker', 'time-picker', 'file-input', 'file-upload', 'transfer-list'],
                    variantGroup: 'states',
                    fgProps: ['text', 'leading-icon', 'trailing-icon', 'upload-icon', 'header-color']
                },
                {
                    names: ['button'],
                    variantGroup: 'styles',
                    fgProps: ['text', 'text-hover', 'icon-color']
                },
                {
                    names: ['chip', 'badge'],
                    variantGroup: 'styles',
                    fgProps: ['text', 'leading-icon-color', 'selected-icon-color', 'close-icon-color', 'icon']
                }
            ];

            // 1. Check standard components (Forms, Button, Chip, Badge)
            for (const config of compConfigs) {
                for (const compName of config.names) {
                    const comp = components[compName]
                    const variantMap = comp?.variants?.[config.variantGroup]
                    if (!variantMap) continue

                    for (const [variantName, variantObj] of Object.entries(variantMap)) {
                        if (config.variantGroup === 'states' && variantName === 'disabled') continue
                        const colors = (variantObj as any)?.properties?.colors
                        if (!colors) continue

                        for (const layer of layers) {
                            const layerColors = colors[layer]
                            if (!layerColors?.background) continue

                            const bgVar = `--recursica_ui-kit_themes_${mode}_components_${compName}_variants_${config.variantGroup}_${variantName}_properties_colors_${layer}_background`
                            const bgValue = readCssVar(bgVar)
                            if (!bgValue) continue
                            const bgHex = resolveCssVarToHex(bgValue, tokenIndex as any)
                            if (!bgHex) continue

                            const otherMode = mode === 'light' ? 'dark' : 'light';
                            const otherBgVar = bgVar.replace(`_themes_${mode}_`, `_themes_${otherMode}_`);
                            const otherBgValue = readCssVar(otherBgVar);
                            const otherBgHex = otherBgValue ? resolveCssVarToHex(otherBgValue, tokenIndex as any) : undefined;

                            for (const prop of config.fgProps) {
                                if (!layerColors[prop]) continue
                                const fgVar = `--recursica_ui-kit_themes_${mode}_components_${compName}_variants_${config.variantGroup}_${variantName}_properties_colors_${layer}_${prop}`
                                const fgValue = readCssVar(fgVar)
                                if (!fgValue) continue
                                const fgHex = resolveCssVarToHex(fgValue, tokenIndex as any)
                                if (!fgHex) continue

                                const displayName = compName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                const propLabel = prop.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                const location = `${displayName} / ${toLabel(variantName)} / ${toLabel(layer)} / ${propLabel}`

                                this.checkContrastAndAddIssue(
                                    fgVar, bgVar, fgValue, bgValue, fgHex, bgHex, otherBgHex || undefined,
                                    propLabel, location, compName, mode, prop, layer, variantName,
                                    tokens, tokenIndex, issues
                                )
                            }
                        }
                    }
                }
            }

            // 2. Check AccordionItem (Custom structure)
            const accordionItem = components['accordion-item']
            if (accordionItem?.properties?.colors) {
                const accFgProps = ['text', 'content-text', 'icon']
                const accBgGroups = [
                    { key: 'background-collapsed', label: 'collapsed' },
                    { key: 'background-expanded', label: 'expanded' },
                ]

                for (const layer of layers) {
                    const layerColors = accordionItem.properties.colors[layer]
                    if (!layerColors) continue

                    for (const bgGroup of accBgGroups) {
                        const bgVar = `--recursica_ui-kit_themes_${mode}_components_accordion-item_properties_colors_${layer}_${bgGroup.key}`
                        const bgValue = readCssVar(bgVar)
                        if (!bgValue) continue
                        const bgHex = resolveCssVarToHex(bgValue, tokenIndex as any)
                        if (!bgHex) continue

                        const otherMode = mode === 'light' ? 'dark' : 'light';
                        const otherBgVar = bgVar.replace(`_themes_${mode}_`, `_themes_${otherMode}_`);
                        const otherBgValue = readCssVar(otherBgVar);
                        const otherBgHex = otherBgValue ? resolveCssVarToHex(otherBgValue, tokenIndex as any) : undefined;

                        for (const prop of accFgProps) {
                            if (!layerColors[prop]) continue
                            const fgVar = `--recursica_ui-kit_themes_${mode}_components_accordion-item_properties_colors_${layer}_${prop}`
                            const fgValue = readCssVar(fgVar)
                            if (!fgValue) continue
                            const fgHex = resolveCssVarToHex(fgValue, tokenIndex as any)
                            if (!fgHex) continue

                            const propLabel = prop.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                            const location = `Accordion Item / ${toLabel(layer)} / ${toLabel(bgGroup.label)} / ${propLabel}`

                            this.checkContrastAndAddIssue(
                                fgVar, bgVar, fgValue, bgValue, fgHex, bgHex, otherBgHex || undefined,
                                propLabel, location, 'accordion-item', mode, prop, layer, bgGroup.key,
                                tokens, tokenIndex, issues
                            )
                        }
                    }
                }
            }

            // 3. Check MenuItem (Custom nested structure)
            const menuItem = components['menu-item']
            if (menuItem?.properties?.colors) {
                const itemTypes = ['selected-item', 'unselected-item']
                for (const layer of layers) {
                    const layerColors = menuItem.properties.colors[layer]
                    if (!layerColors) continue

                    for (const type of itemTypes) {
                        const typeObj = layerColors[type]
                        if (!typeObj?.background) continue

                        const bgVar = `--recursica_ui-kit_themes_${mode}_components_menu-item_properties_colors_${layer}_${type}_background`
                        const bgValue = readCssVar(bgVar)
                        if (!bgValue) continue
                        const bgHex = resolveCssVarToHex(bgValue, tokenIndex as any)
                        if (!bgHex) continue

                        const otherMode = mode === 'light' ? 'dark' : 'light';
                        const otherBgVar = bgVar.replace(`_themes_${mode}_`, `_themes_${otherMode}_`);
                        const otherBgValue = readCssVar(otherBgVar);
                        const otherBgHex = otherBgValue ? resolveCssVarToHex(otherBgValue, tokenIndex as any) : undefined;

                        const fgVar = `--recursica_ui-kit_themes_${mode}_components_menu-item_properties_colors_${layer}_${type}_text`
                        const fgValue = readCssVar(fgVar)
                        if (!fgValue) continue
                        const fgHex = resolveCssVarToHex(fgValue, tokenIndex as any)
                        if (!fgHex) continue

                        const location = `Menu Item / ${toLabel(layer)} / ${toLabel(type)} / Text`

                        this.checkContrastAndAddIssue(
                            fgVar, bgVar, fgValue, bgValue, fgHex, bgHex, otherBgHex || undefined,
                            'Text', location, 'menu-item', mode, 'text', layer, type,
                            tokens, tokenIndex, issues
                        )
                    }
                }
            }

        } catch (e) {
            console.error('Error checking component text colors:', e)
        }
    }

    // ─── Dual-Mode Component Scanner ───

    /**
     * Scan all component text/icon colors against backgrounds in BOTH modes
     * simultaneously. Produces deduplicated ComponentComplianceIssue objects
     * where each issue shows light and dark mode results side-by-side.
     * An issue is created if EITHER mode fails AA.
     */
    private checkComponentTextColorsDualMode(
        tokenIndex: ReturnType<typeof buildTokenIndex>,
        tokens: JsonLike,
    ): ComponentComplianceIssue[] {
        const results: ComponentComplianceIssue[] = []

        try {
            const uikit = getVarsStore().getState().uikit as any
            const components = uikit?.['ui-kit']?.components ?? uikit?.components ?? {}
            const layers: string[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']

            const toLabel = (s: string) => {
                const words = s.split('-')
                return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ')
            }

            /**
             * Check a single fg/bg pair across both modes and add to results if either fails.
             */
            const checkDualMode = (
                compName: string,
                variantName: string,
                layer: string,
                prop: string,
                propLabel: string,
                location: string,
                fgVarTemplate: string,
                bgVarTemplate: string,
            ) => {
                const modeResults: Record<'light' | 'dark', ModeResult | null> = { light: null, dark: null }

                for (const mode of ['light', 'dark'] as const) {
                    const fgVar = fgVarTemplate.replace('_themes_MODE_', `_themes_${mode}_`)
                    const bgVar = bgVarTemplate.replace('_themes_MODE_', `_themes_${mode}_`)
                    const fgValue = readCssVar(fgVar)
                    const bgValue = readCssVar(bgVar)
                    if (!fgValue || !bgValue) continue
                    const fgHex = resolveCssVarToHex(fgValue, tokenIndex as any)
                    const bgHex = resolveCssVarToHex(bgValue, tokenIndex as any)
                    if (!fgHex || !bgHex) continue
                    const ratio = contrastRatio(bgHex, fgHex)
                    modeResults[mode] = { bgHex, fgHex, contrastRatio: ratio, passes: ratio >= AA_THRESHOLD }
                }

                const light = modeResults.light
                const dark = modeResults.dark
                if (!light || !dark) return
                // Only add if at least one mode fails
                if (light.passes && dark.passes) return

                // Generate suggestion that passes BOTH modes
                let suggestion: SuggestedFix | null = null
                const lightFgVar = fgVarTemplate.replace('_themes_MODE_', '_themes_light_')
                const lightFgValue = readCssVar(lightFgVar)
                if (lightFgValue) {
                    // Try semantic pair first
                    suggestion = this.getSemanticPairSuggestion(
                        readCssVar(bgVarTemplate.replace('_themes_MODE_', '_themes_light_')) || '',
                        lightFgVar, 'light', tokens
                    )
                    if (suggestion) {
                        const suggHex = resolveCssVarToHex(suggestion.suggestedValue, tokenIndex as any)
                        if (!suggHex
                            || contrastRatio(light.bgHex, suggHex) < AA_THRESHOLD
                            || contrastRatio(dark.bgHex, suggHex) < AA_THRESHOLD) {
                            suggestion = null
                        }
                    }
                    if (!suggestion) {
                        // Try stepped color that passes both
                        suggestion = this.generateSteppedColorSuggestion(
                            light.fgHex, light.bgHex, lightFgVar, tokens, 'light', dark.bgHex
                        )
                    }
                    if (!suggestion) {
                        suggestion = this.tryBlackWhiteTokens(light.bgHex, lightFgVar, tokens, 1, dark.bgHex)
                    }
                }

                results.push({
                    id: `comp-${compName}-${variantName}-${layer}-${prop}`,
                    componentName: compName,
                    location,
                    fgCssVarPattern: fgVarTemplate,
                    bgCssVarPattern: bgVarTemplate,
                    light,
                    dark,
                    suggestion,
                })
            }

            const compConfigs: Array<{
                names: string[];
                variantGroup: 'states' | 'styles';
                fgProps: string[];
            }> = [
                {
                    names: ['text-field', 'textarea', 'dropdown', 'autocomplete', 'number-input', 'date-picker', 'time-picker', 'file-input', 'file-upload', 'transfer-list'],
                    variantGroup: 'states',
                    fgProps: ['text', 'leading-icon', 'trailing-icon', 'upload-icon', 'header-color']
                },
                {
                    names: ['button'],
                    variantGroup: 'styles',
                    fgProps: ['text', 'text-hover', 'icon-color']
                },
                {
                    names: ['chip', 'badge'],
                    variantGroup: 'styles',
                    fgProps: ['text', 'leading-icon-color', 'selected-icon-color', 'close-icon-color', 'icon']
                }
            ]

            // 1. Standard components (Forms, Button, Chip, Badge)
            for (const config of compConfigs) {
                for (const compName of config.names) {
                    const comp = components[compName]
                    const variantMap = comp?.variants?.[config.variantGroup]
                    if (!variantMap) continue

                    for (const [variantName, variantObj] of Object.entries(variantMap)) {
                        if (config.variantGroup === 'states' && variantName === 'disabled') continue
                        const colors = (variantObj as any)?.properties?.colors
                        if (!colors) continue

                        for (const layer of layers) {
                            const layerColors = colors[layer]
                            if (!layerColors?.background) continue

                            for (const prop of config.fgProps) {
                                if (!layerColors[prop]) continue
                                const displayName = compName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                const propLabel = prop.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                const location = `${displayName} / ${toLabel(variantName)} / ${toLabel(layer)} / ${propLabel}`

                                const fgTemplate = `--recursica_ui-kit_themes_MODE_components_${compName}_variants_${config.variantGroup}_${variantName}_properties_colors_${layer}_${prop}`
                                const bgTemplate = `--recursica_ui-kit_themes_MODE_components_${compName}_variants_${config.variantGroup}_${variantName}_properties_colors_${layer}_background`

                                checkDualMode(compName, variantName, layer, prop, propLabel, location, fgTemplate, bgTemplate)
                            }
                        }
                    }
                }
            }

            // 2. AccordionItem
            const accordionItem = components['accordion-item']
            if (accordionItem?.properties?.colors) {
                const accFgProps = ['text', 'content-text', 'icon']
                const accBgGroups = [
                    { key: 'background-collapsed', label: 'collapsed' },
                    { key: 'background-expanded', label: 'expanded' },
                ]

                for (const layer of layers) {
                    const layerColors = accordionItem.properties.colors[layer]
                    if (!layerColors) continue

                    for (const bgGroup of accBgGroups) {
                        for (const prop of accFgProps) {
                            if (!layerColors[prop]) continue
                            const propLabel = prop.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                            const location = `Accordion Item / ${toLabel(layer)} / ${toLabel(bgGroup.label)} / ${propLabel}`

                            const fgTemplate = `--recursica_ui-kit_themes_MODE_components_accordion-item_properties_colors_${layer}_${prop}`
                            const bgTemplate = `--recursica_ui-kit_themes_MODE_components_accordion-item_properties_colors_${layer}_${bgGroup.key}`

                            checkDualMode('accordion-item', bgGroup.key, layer, prop, propLabel, location, fgTemplate, bgTemplate)
                        }
                    }
                }
            }

            // 3. MenuItem
            const menuItem = components['menu-item']
            if (menuItem?.properties?.colors) {
                const itemTypes = ['selected-item', 'unselected-item']
                for (const layer of layers) {
                    const layerColors = menuItem.properties.colors[layer]
                    if (!layerColors) continue

                    for (const type of itemTypes) {
                        const typeObj = layerColors[type]
                        if (!typeObj?.background) continue

                        const location = `Menu Item / ${toLabel(layer)} / ${toLabel(type)} / Text`

                        const fgTemplate = `--recursica_ui-kit_themes_MODE_components_menu-item_properties_colors_${layer}_${type}_text`
                        const bgTemplate = `--recursica_ui-kit_themes_MODE_components_menu-item_properties_colors_${layer}_${type}_background`

                        checkDualMode('menu-item', type, layer, 'text', 'Text', location, fgTemplate, bgTemplate)
                    }
                }
            }

        } catch (e) {
            console.error('Error checking component text colors (dual-mode):', e)
        }

        return results
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
