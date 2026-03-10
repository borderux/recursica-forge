/**
 * toneInterpolation — OKLCH-based color interpolation for tone suggestions.
 *
 * Generates intermediate tones between two hex colors using the OKLCH color space,
 * which provides perceptually uniform steps and better visual separation for
 * contrast-critical use cases.
 */

import { contrastRatio, blendHexWithOpacity } from '../../modules/theme/contrastUtil'

// ─── OKLCH conversion helpers ───

function hexToLinearRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16) / 255
    const g = parseInt(h.slice(2, 4), 16) / 255
    const b = parseInt(h.slice(4, 6), 16) / 255
    // sRGB → linear
    const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    return [toLinear(r), toLinear(g), toLinear(b)]
}

function linearRgbToHex(lr: number, lg: number, lb: number): string {
    const toSrgb = (c: number) => c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    const clamp = (v: number) => Math.max(0, Math.min(1, v))
    const r = Math.round(clamp(toSrgb(lr)) * 255)
    const g = Math.round(clamp(toSrgb(lg)) * 255)
    const b = Math.round(clamp(toSrgb(lb)) * 255)
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
}

function linearRgbToOklab(lr: number, lg: number, lb: number): [number, number, number] {
    const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
    const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
    const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

    const l = Math.cbrt(l_)
    const m = Math.cbrt(m_)
    const s = Math.cbrt(s_)

    return [
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ]
}

function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b

    const l = l_ * l_ * l_
    const m = m_ * m_ * m_
    const s = s_ * s_ * s_

    return [
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ]
}

function hexToOklch(hex: string): { L: number; C: number; h: number } {
    const [lr, lg, lb] = hexToLinearRgb(hex)
    const [L, a, b] = linearRgbToOklab(lr, lg, lb)
    const C = Math.sqrt(a * a + b * b)
    const h = Math.atan2(b, a) * (180 / Math.PI)
    return { L, C, h: h < 0 ? h + 360 : h }
}

function oklchToHex(L: number, C: number, h: number): string {
    const hRad = h * (Math.PI / 180)
    const a = C * Math.cos(hRad)
    const b = C * Math.sin(hRad)
    const [lr, lg, lb] = oklabToLinearRgb(L, a, b)
    return linearRgbToHex(lr, lg, lb)
}

// ─── Interpolation ───

/**
 * Interpolate N colors between two hex colors using OKLCH color space.
 * Returns `count` evenly-spaced intermediate colors (not including endpoints).
 */
export function interpolateOklch(hex1: string, hex2: string, count: number): string[] {
    const c1 = hexToOklch(hex1)
    const c2 = hexToOklch(hex2)

    // Handle hue wrapping (take the short path around the hue circle)
    let h1 = c1.h
    let h2 = c2.h
    if (Math.abs(h2 - h1) > 180) {
        if (h2 > h1) h1 += 360
        else h2 += 360
    }

    const results: string[] = []
    for (let i = 1; i <= count; i++) {
        const t = i / (count + 1)
        const L = c1.L + (c2.L - c1.L) * t
        const C = c1.C + (c2.C - c1.C) * t
        let h = h1 + (h2 - h1) * t
        if (h >= 360) h -= 360
        if (h < 0) h += 360
        results.push(oklchToHex(L, C, h))
    }
    return results
}

// ─── Tone suggestion data ───

export interface SuggestedTone {
    hex: string
    isReference: boolean       // True for the adjacent levels (not selectable)
    isFailing: boolean         // True for the original failing tone
    isCompliant: boolean       // True if on-tone passes AA at this emphasis
    onToneColor: 'black' | 'white' | null  // Which on-tone wins, or null if neither passes
    contrastRatio: number      // The best contrast ratio achieved
    label: string              // Display label (e.g., "600", "Suggested 1", "500")
    level?: string             // Scale level if this is a reference or the failing tone
}

const AA_THRESHOLD = 4.5

/**
 * Test a candidate tone against black and white on-tones at the given emphasis opacity.
 * Returns the best on-tone color and its contrast ratio.
 */
export function testOnToneCompliance(
    toneHex: string,
    emphasis: 'high' | 'low',
    emphasisOpacity: number
): { onTone: 'black' | 'white' | null; ratio: number; isCompliant: boolean } {
    const black = '#000000'
    const white = '#ffffff'

    // Blend on-tone with the tone at the emphasis opacity
    const effectiveBlack = emphasis === 'high' && emphasisOpacity >= 1
        ? black
        : blendHexWithOpacity(black, toneHex, emphasisOpacity) || black
    const effectiveWhite = emphasis === 'high' && emphasisOpacity >= 1
        ? white
        : blendHexWithOpacity(white, toneHex, emphasisOpacity) || white

    const ratioBlack = contrastRatio(toneHex, effectiveBlack)
    const ratioWhite = contrastRatio(toneHex, effectiveWhite)

    const bestRatio = Math.max(ratioBlack, ratioWhite)
    const bestOnTone = ratioBlack >= ratioWhite ? 'black' as const : 'white' as const
    const isCompliant = bestRatio >= AA_THRESHOLD

    return {
        onTone: isCompliant ? bestOnTone : (bestRatio > 0 ? bestOnTone : null),
        ratio: bestRatio,
        isCompliant,
    }
}

/**
 * Generate suggested tones for a failing compliance issue.
 * 
 * @param failingHex   - The hex of the failing tone level
 * @param aboveHex     - The hex of the adjacent darker level (or null if at edge)
 * @param belowHex     - The hex of the adjacent lighter level (or null if at edge)
 * @param aboveLevel   - The level string of the adjacent darker level (e.g., "600")
 * @param belowLevel   - The level string of the adjacent lighter level (e.g., "400")
 * @param failingLevel - The level string of the failing tone (e.g., "500")
 * @param emphasis     - Which emphasis level failed
 * @param emphasisOpacity - The opacity value for the emphasis level
 */
export function generateSuggestedTones(
    failingHex: string,
    aboveHex: string | null,
    belowHex: string | null,
    aboveLevel: string | null,
    belowLevel: string | null,
    failingLevel: string,
    emphasis: 'high' | 'low',
    emphasisOpacity: number,
): SuggestedTone[] {
    const tones: SuggestedTone[] = []

    // Above reference (darker in light mode, lighter in dark mode)
    if (aboveHex && aboveLevel) {
        const test = testOnToneCompliance(aboveHex, emphasis, emphasisOpacity)
        tones.push({
            hex: aboveHex,
            isReference: true,
            isFailing: false,
            isCompliant: test.isCompliant,
            onToneColor: test.onTone,
            contrastRatio: test.ratio,
            label: aboveLevel,
            level: aboveLevel,
        })

        // 3 interpolated tones between above and failing
        const interpAbove = interpolateOklch(aboveHex, failingHex, 3)
        interpAbove.forEach((hex, i) => {
            const test = testOnToneCompliance(hex, emphasis, emphasisOpacity)
            tones.push({
                hex,
                isReference: false,
                isFailing: false,
                isCompliant: test.isCompliant,
                onToneColor: test.onTone,
                contrastRatio: test.ratio,
                label: `Option ${i + 1}`,
            })
        })
    }

    // The failing tone itself
    const failTest = testOnToneCompliance(failingHex, emphasis, emphasisOpacity)
    tones.push({
        hex: failingHex,
        isReference: false,
        isFailing: true,
        isCompliant: failTest.isCompliant,
        onToneColor: failTest.onTone,
        contrastRatio: failTest.ratio,
        label: failingLevel,
        level: failingLevel,
    })

    // Below reference (lighter in light mode, darker in dark mode)
    if (belowHex && belowLevel) {
        // 3 interpolated tones between failing and below
        const interpBelow = interpolateOklch(failingHex, belowHex, 3)
        interpBelow.forEach((hex, i) => {
            const test = testOnToneCompliance(hex, emphasis, emphasisOpacity)
            const offset = aboveHex ? 4 : 1  // Numbering continues from above options
            tones.push({
                hex,
                isReference: false,
                isFailing: false,
                isCompliant: test.isCompliant,
                onToneColor: test.onTone,
                contrastRatio: test.ratio,
                label: `Option ${offset + i}`,
            })
        })

        const test = testOnToneCompliance(belowHex, emphasis, emphasisOpacity)
        tones.push({
            hex: belowHex,
            isReference: true,
            isFailing: false,
            isCompliant: test.isCompliant,
            onToneColor: test.onTone,
            contrastRatio: test.ratio,
            label: belowLevel,
            level: belowLevel,
        })
    }

    return tones
}
