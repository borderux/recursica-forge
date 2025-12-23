/**
 * AA Compliance Checker for JSON Export
 * 
 * Validates all tone/on-tone color combinations for AA compliance
 * before allowing JSON export.
 */

import { readCssVar } from '../css/readCssVar'
import { resolveCssVarToHex } from '../compliance/layerColorStepping'
import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { contrastRatio } from '../../modules/theme/contrastUtil'
import tokensJson from '../../vars/Tokens.json'
import brandJson from '../../vars/Brand.json'

export interface ComplianceIssue {
  type: 'palette-on-tone' | 'layer-text' | 'layer-interactive'
  mode: 'light' | 'dark'
  location: string
  toneHex: string
  onToneHex: string
  contrastRatio: number
  message: string
}

const AA_THRESHOLD = 4.5

/**
 * Checks all tone/on-tone combinations for AA compliance
 */
export function checkAACompliance(): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []
  const tokenIndex = buildTokenIndex(tokensJson as JsonLike)
  
  // Check palette on-tone combinations for both modes
  for (const mode of ['light', 'dark'] as const) {
    try {
      const root: any = brandJson
      const themes = root?.brand?.themes || root?.themes || root
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
            issues.push({
              type: 'palette-on-tone',
              mode,
              location: `Palette ${paletteKey}-${level}`,
              toneHex,
              onToneHex,
              contrastRatio: ratio,
              message: `Palette ${paletteKey}-${level} (${mode}): Contrast ratio ${ratio.toFixed(2)} < ${AA_THRESHOLD}`
            })
          }
        })
      })
    } catch (err) {
      console.warn('Error checking palette compliance:', err)
    }
  }
  
  // Check layer text colors for both modes
  for (const mode of ['light', 'dark'] as const) {
    for (let layer = 0; layer <= 3; layer++) {
      const surfaceVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-surface`
      const textColorVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-element-text-color`
      
      const surfaceValue = readCssVar(surfaceVar)
      const textColorValue = readCssVar(textColorVar)
      
      if (!surfaceValue || !textColorValue) continue
      
      const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex as any)
      const textColorHex = resolveCssVarToHex(textColorValue, tokenIndex as any)
      
      if (!surfaceHex || !textColorHex) continue
      
      const ratio = contrastRatio(surfaceHex, textColorHex)
      
      if (ratio < AA_THRESHOLD) {
        issues.push({
          type: 'layer-text',
          mode,
          location: `Layer ${layer}`,
          toneHex: surfaceHex,
          onToneHex: textColorHex,
          contrastRatio: ratio,
          message: `Layer ${layer} (${mode}): Text color contrast ratio ${ratio.toFixed(2)} < ${AA_THRESHOLD}`
        })
      }
    }
  }
  
  // Check layer interactive colors for both modes
  for (const mode of ['light', 'dark'] as const) {
    for (let layer = 0; layer <= 3; layer++) {
      const surfaceVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-surface`
      const interactiveToneVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-element-interactive-tone`
      const interactiveOnToneVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-element-interactive-on-tone`
      
      const surfaceValue = readCssVar(surfaceVar)
      const interactiveToneValue = readCssVar(interactiveToneVar)
      const interactiveOnToneValue = readCssVar(interactiveOnToneVar)
      
      // Check interactive tone against surface
      if (surfaceValue && interactiveToneValue) {
        const surfaceHex = resolveCssVarToHex(surfaceValue, tokenIndex as any)
        const interactiveToneHex = resolveCssVarToHex(interactiveToneValue, tokenIndex as any)
        
        if (surfaceHex && interactiveToneHex) {
          const ratio = contrastRatio(surfaceHex, interactiveToneHex)
          
          if (ratio < AA_THRESHOLD) {
            issues.push({
              type: 'layer-interactive',
              mode,
              location: `Layer ${layer} (interactive tone)`,
              toneHex: surfaceHex,
              onToneHex: interactiveToneHex,
              contrastRatio: ratio,
              message: `Layer ${layer} (${mode}): Interactive tone contrast ratio ${ratio.toFixed(2)} < ${AA_THRESHOLD}`
            })
          }
        }
      }
      
      // Check interactive on-tone against interactive tone
      if (interactiveToneValue && interactiveOnToneValue) {
        const interactiveToneHex = resolveCssVarToHex(interactiveToneValue, tokenIndex as any)
        const interactiveOnToneHex = resolveCssVarToHex(interactiveOnToneValue, tokenIndex as any)
        
        if (interactiveToneHex && interactiveOnToneHex) {
          const ratio = contrastRatio(interactiveToneHex, interactiveOnToneHex)
          
          if (ratio < AA_THRESHOLD) {
            issues.push({
              type: 'layer-interactive',
              mode,
              location: `Layer ${layer} (interactive on-tone)`,
              toneHex: interactiveToneHex,
              onToneHex: interactiveOnToneHex,
              contrastRatio: ratio,
              message: `Layer ${layer} (${mode}): Interactive on-tone contrast ratio ${ratio.toFixed(2)} < ${AA_THRESHOLD}`
            })
          }
        }
      }
    }
  }
  
  return issues
}

