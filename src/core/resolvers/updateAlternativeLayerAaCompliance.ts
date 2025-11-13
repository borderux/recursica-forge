import { findAaCompliantColor } from './colorSteppingForAa'
import { buildTokenIndex } from './tokens'
import type { JsonLike } from './tokens'
import { contrastRatio } from '../../modules/theme/contrastUtil'

// Helper to resolve CSS var to hex (recursively)
function resolveCssVarToHex(cssVar: string, tokenIndex: Map<string, any>, depth = 0): string | null {
  if (depth > 10) return null
  try {
    const trimmed = cssVar.trim()
    if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
      const h = trimmed.toLowerCase()
      return h.startsWith('#') ? h : `#${h}`
    }
    const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+)\s*\)/)
    if (varMatch) {
      const varName = varMatch[1]
      let value = document.documentElement.style.getPropertyValue(varName).trim()
      if (!value) {
        value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      }
      if (value) {
        return resolveCssVarToHex(value, tokenIndex, depth + 1)
      }
    }
    const tokenMatch = trimmed.match(/--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)/)
    if (tokenMatch) {
      const [, family, level] = tokenMatch
      const normalizedLevel = level === '000' ? '050' : level
      const hex = tokenIndex.get(`color/${family}/${normalizedLevel}`)
      if (typeof hex === 'string') {
        const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        return h
      }
    }
    const paletteMatch = trimmed.match(/--recursica-brand-light-palettes-([a-z0-9-]+)-(\d+|primary)-(tone|on-tone)/)
    if (paletteMatch) {
      const [, paletteKey, level, type] = paletteMatch
      const paletteVarName = `--recursica-brand-light-palettes-${paletteKey}-${level}-${type}`
      let paletteValue = document.documentElement.style.getPropertyValue(paletteVarName).trim()
      if (!paletteValue) {
        paletteValue = getComputedStyle(document.documentElement).getPropertyValue(paletteVarName).trim()
      }
      if (paletteValue) {
        return resolveCssVarToHex(paletteValue, tokenIndex, depth + 1)
      }
    }
  } catch {}
  return null
}

// Helper to get opacity value from CSS var
function getOpacityValue(opacityVar: string, tokenIndex: Map<string, any>): number {
  if (!opacityVar) return 1
  const num = Number(opacityVar)
  if (Number.isFinite(num)) {
    return num <= 1 ? num : num / 100
  }
  const tokenMatch = opacityVar.match(/--recursica-tokens-opacity-([a-z0-9-]+)/)
  if (tokenMatch) {
    const [, tokenName] = tokenMatch
    const tokenValue = tokenIndex.get(`opacity/${tokenName}`)
    if (typeof tokenValue === 'number') {
      return tokenValue <= 1 ? tokenValue : tokenValue / 100
    }
  }
  return 1
}

// Helper to parse core token reference from theme
function parseCoreTokenRef(name: 'interactive' | 'alert' | 'warning' | 'success', theme: any): { family: string; level: string } | null {
  try {
    const root: any = theme?.brand ? theme.brand : theme
    const core: any =
      root?.light?.palettes?.['core']?.['$value'] || root?.light?.palettes?.['core'] ||
      root?.light?.palettes?.['core-colors']?.['$value'] || root?.light?.palettes?.['core-colors'] || {}
    const v: any = core?.[name]
    const s = typeof v === 'string' ? v : typeof (v?.['$value']) === 'string' ? String(v['$value']) : ''
    if (!s) return null
    const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1) : s
    const m = /^tokens\.color\.([a-z0-9_-]+)\.(\d{2,4}|050)$/i.exec(inner)
    if (m) return { family: m[1], level: m[2] }
  } catch {}
  return null
}

/**
 * Updates alternative layer element colors for AA compliance when core color changes.
 * Called when core alert, warning, or success colors are changed.
 */
export function updateAlternativeLayerAaCompliance(
  alternativeKey: 'alert' | 'warning' | 'success',
  tokens: JsonLike,
  theme: JsonLike
): void {
  try {
    const tokenIndex = buildTokenIndex(tokens)
    
    // Get surface color hex for this alternative layer
    const surfaceCssVar = `--recursica-brand-light-layer-layer-alternative-${alternativeKey}-property-surface`
    const surfaceValue = document.documentElement.style.getPropertyValue(surfaceCssVar).trim() ||
      getComputedStyle(document.documentElement).getPropertyValue(surfaceCssVar).trim()
    
    if (!surfaceValue) return
    
    const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex)
    if (!surfaceHex) return
    
    const brandBase = `--recursica-brand-light-layer-layer-alternative-${alternativeKey}-property-`
    
    // Get opacity for text high emphasis
    const opacityCssVar = `${brandBase}element-text-high-emphasis`
    const opacityValue = document.documentElement.style.getPropertyValue(opacityCssVar).trim() ||
      getComputedStyle(document.documentElement).getPropertyValue(opacityCssVar).trim()
    const opacity = getOpacityValue(opacityValue, tokenIndex)
    
    // Update text color (uses black/white)
    const textColorCssVar = `${brandBase}element-text-color`
    const textCoreToken = null // Text uses black/white, not a color scale
    const textAaColor = findAaCompliantColor(surfaceHex, textCoreToken, opacity, tokens)
    if (textAaColor) {
      document.documentElement.style.setProperty(textColorCssVar, textAaColor)
    }
    
    // Update interactive color (uses core interactive CSS var directly)
    const interactiveColorCssVar = `${brandBase}element-interactive-color`
    const interactiveOpacityCssVar = `${brandBase}element-interactive-high-emphasis`
    const interactiveOpacityValue = document.documentElement.style.getPropertyValue(interactiveOpacityCssVar).trim() ||
      getComputedStyle(document.documentElement).getPropertyValue(interactiveOpacityCssVar).trim()
    const interactiveOpacity = getOpacityValue(interactiveOpacityValue, tokenIndex)
    
    // Check if core interactive meets AA compliance
    const coreInteractiveHex = resolveCssVarToHex('var(--recursica-brand-light-palettes-core-interactive)', tokenIndex)
    if (coreInteractiveHex) {
      // Helper to blend foreground over background with opacity
      const blendHexOverBg = (fgHex?: string, bgHex?: string, opacity?: number): string | undefined => {
        if (!fgHex || !bgHex) return undefined
        try {
          const toRgb = (h: string): [number, number, number] => {
            const s = h.startsWith('#') ? h.slice(1) : h
            const r = parseInt(s.slice(0, 2), 16)
            const g = parseInt(s.slice(2, 4), 16)
            const b = parseInt(s.slice(4, 6), 16)
            return [r, g, b]
          }
          const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
          const a = clamp01(typeof opacity === 'number' ? opacity : 1)
          const [fr, fg, fb] = toRgb(fgHex.replace('#',''))
          const [br, bgc, bb] = toRgb(bgHex.replace('#',''))
          const rr = Math.round(a * fr + (1 - a) * br)
          const rg = Math.round(a * fg + (1 - a) * bgc)
          const rb = Math.round(a * fb + (1 - a) * bb)
          const toHex = (n: number) => n.toString(16).padStart(2, '0')
          return `#${toHex(rr)}${toHex(rg)}${toHex(rb)}`
        } catch { return fgHex }
      }
      const finalColorHex = blendHexOverBg(coreInteractiveHex, surfaceHex, interactiveOpacity) || coreInteractiveHex
      const contrast = contrastRatio(surfaceHex, finalColorHex)
      if (contrast >= 4.5) {
        // Core interactive meets AA, use it directly
        document.documentElement.style.setProperty(interactiveColorCssVar, 'var(--recursica-brand-light-palettes-core-interactive)')
        return
      }
    }
    // If core interactive doesn't meet AA, step through the scale
    const interactiveCoreToken = parseCoreTokenRef('interactive', theme)
    const interactiveAaColor = findAaCompliantColor(surfaceHex, interactiveCoreToken, interactiveOpacity, tokens)
    if (interactiveAaColor) {
      document.documentElement.style.setProperty(interactiveColorCssVar, interactiveAaColor)
    }
  } catch (err) {
    console.error('Error updating alternative layer AA compliance:', err)
  }
}

