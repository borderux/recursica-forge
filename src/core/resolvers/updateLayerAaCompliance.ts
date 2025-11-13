import { buildTokenIndex } from './tokens'
import { contrastRatio } from '../../modules/theme/contrastUtil'
import { findAaCompliantColor } from './colorSteppingForAa'

// Helper to blend foreground over background with opacity
function blendHexOverBg(fgHex?: string, bgHex?: string, opacity?: number): string | undefined {
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  try {
    let h = (hex || '').trim()
    if (!h) return null
    if (!h.startsWith('#')) h = `#${h}`
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    if (!m) return null
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  } catch {
    return null
  }
}

function contrastWithOpacity(bgHex?: string, fgHex?: string, opacity?: number): number {
  const comp = blendHexOverBg(fgHex, bgHex, opacity)
  return contrastRatio(bgHex, comp)
}

// Helper to resolve CSS var to hex (recursively)
function resolveCssVarToHex(cssVar: string, tokenIndex: Map<string, any>, depth = 0): string | null {
  if (depth > 10) return null
  try {
    const trimmed = cssVar.trim()
    // If it's already a hex, return it
    if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
      const h = trimmed.toLowerCase()
      return h.startsWith('#') ? h : `#${h}`
    }
    
    // If it's a var(), extract the var name and resolve
    const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+)\s*\)/)
    if (varMatch) {
      const varName = varMatch[1]
      // Try inline style first
      let value = document.documentElement.style.getPropertyValue(varName).trim()
      if (!value) {
        value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      }
      if (value) {
        return resolveCssVarToHex(value, tokenIndex, depth + 1)
      }
    }
    
    // Try to get from token index if it's a token reference
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
    
    // Try palette var reference
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
  // Try to read as number directly
  const num = Number(opacityVar)
  if (Number.isFinite(num)) {
    return num <= 1 ? num : num / 100
  }
  // Try to get from token
  const tokenMatch = opacityVar.match(/--recursica-tokens-opacity-([a-z0-9-]+)/)
  if (tokenMatch) {
    const [, tokenName] = tokenMatch
    const tokenValue = tokenIndex.get(`opacity/${tokenName}`)
    if (typeof tokenValue === 'number') {
      return tokenValue <= 1 ? tokenValue : tokenValue / 100
    }
  }
  // Try to resolve as CSS var
  const resolved = resolveCssVarToHex(opacityVar, tokenIndex)
  if (resolved) {
    // If resolved to a hex, it's not an opacity value
    return 1
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
    // tokens.color.<family>.<level>
    const m = /^tokens\.color\.([a-z0-9_-]+)\.(\d{2,4}|050)$/i.exec(inner)
    if (m) return { family: m[1], level: m[2] }
  } catch {}
  return null
}

// Helper to update a single element's color for AA compliance
function updateElementColor(
  layerNumber: number,
  elementName: string,
  surfaceHex: string,
  currentColorCssVar: string,
  opacityCssVar: string,
  tokenIndex: Map<string, any>,
  theme: any,
  tokens: any
): void {
  // Get opacity
  const opacityValue = document.documentElement.style.getPropertyValue(opacityCssVar).trim() ||
    getComputedStyle(document.documentElement).getPropertyValue(opacityCssVar).trim()
  const opacity = getOpacityValue(opacityValue, tokenIndex)
  
  // Get core color token reference for this element type
  let coreToken: { family: string; level: string } | null = null
  
  if (elementName === 'text-color') {
    // Text color uses black/white (no core token)
    const aaCompliantColor = findAaCompliantColor(surfaceHex, null, opacity, tokens)
    if (aaCompliantColor) {
      document.documentElement.style.setProperty(currentColorCssVar, aaCompliantColor)
    }
    return
  } else if (elementName === 'interactive-color') {
    // Interactive color should use core interactive CSS var directly
    // Check if it meets AA compliance first
    const coreInteractiveHex = resolveCssVarToHex('var(--recursica-brand-light-palettes-core-interactive)', tokenIndex)
    if (coreInteractiveHex) {
      const finalColorHex = blendHexOverBg(coreInteractiveHex, surfaceHex, opacity) || coreInteractiveHex
      const contrast = contrastRatio(surfaceHex, finalColorHex)
      if (contrast >= 4.5) {
        // Core interactive meets AA, use it directly
        document.documentElement.style.setProperty(currentColorCssVar, 'var(--recursica-brand-light-palettes-core-interactive)')
        return
      }
    }
    // If core interactive doesn't meet AA, step through the scale
    coreToken = parseCoreTokenRef('interactive', theme)
  } else if (elementName === 'alert') {
    coreToken = parseCoreTokenRef('alert', theme)
  } else if (elementName === 'warning') {
    coreToken = parseCoreTokenRef('warning', theme)
  } else if (elementName === 'success') {
    coreToken = parseCoreTokenRef('success', theme)
  }
  
  // Use the utility function to find AA-compliant color
  const aaCompliantColor = findAaCompliantColor(surfaceHex, coreToken, opacity, tokens)
  if (aaCompliantColor) {
    document.documentElement.style.setProperty(currentColorCssVar, aaCompliantColor)
  }
}

/**
 * Updates all layer element colors for AA compliance when surface color changes.
 * Called directly from the palette picker when surface color is set.
 */
export function updateLayerAaCompliance(
  layerNumber: number,
  tokens: any,
  theme: any
): void {
  try {
    const tokenIndex = buildTokenIndex(tokens)
    
    // Get surface color hex
    const surfaceCssVar = `--recursica-brand-light-layer-layer-${layerNumber}-property-surface`
    const surfaceValue = document.documentElement.style.getPropertyValue(surfaceCssVar).trim() ||
      getComputedStyle(document.documentElement).getPropertyValue(surfaceCssVar).trim()
    
    if (!surfaceValue) return
    
    const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex)
    if (!surfaceHex) return
    
    const brandBase = `--recursica-brand-light-layer-layer-${layerNumber}-property-`
    
    // Update each element type
    const elements = [
      {
        name: 'text-color',
        colorVar: `${brandBase}element-text-color`,
        opacityVar: `${brandBase}element-text-high-emphasis`
      },
      {
        name: 'interactive-color',
        colorVar: `${brandBase}element-interactive-color`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`
      },
      {
        name: 'alert',
        colorVar: `${brandBase}element-text-alert`,
        opacityVar: `${brandBase}element-text-high-emphasis`
      },
      {
        name: 'warning',
        colorVar: `${brandBase}element-text-warning`,
        opacityVar: `${brandBase}element-text-high-emphasis`
      },
      {
        name: 'success',
        colorVar: `${brandBase}element-text-success`,
        opacityVar: `${brandBase}element-text-high-emphasis`
      }
    ]
    
    elements.forEach((element) => {
      updateElementColor(
        layerNumber,
        element.name,
        surfaceHex,
        element.colorVar,
        element.opacityVar,
        tokenIndex,
        theme,
        tokens
      )
    })
  } catch (err) {
    console.error('Error updating layer AA compliance:', err)
  }
}

