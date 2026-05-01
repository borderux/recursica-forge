/**
 * applySuggestTone
 *
 * Shared utility for applying a "suggest-tone" compliance fix — updating a
 * scale token's hex value so the tone falls in a more accessible range.
 * Used by PaletteEmphasisCell's inline warning modal so it can share the
 * same logic as CompliancePage.handleSuggestApply without duplicating it.
 */

import { getVarsStore } from '../store/varsStore'
import { tokenColors } from '../css/cssVarBuilder'
import { updateBrandValue } from '../css/updateBrandValue'
import { traceToTokenRef } from './layerColorStepping'
import type { ComplianceIssue } from './ComplianceService'

export function applySuggestTone(
  issue: ComplianceIssue,
  newHex: string,
  family: string,
  level: string,
  newOnToneColor?: 'white' | 'black'
): void {
  const store = getVarsStore()
  const tokens = store.getState().tokens
  if (!tokens) return

  // Prefer the traced token reference over blind hex matching
  const traced = issue.toneCssVar ? traceToTokenRef(issue.toneCssVar) : null
  const resolvedFamily = traced?.family || family
  const resolvedLevel = traced?.level || level

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

  const normalizedLevel =
    resolvedLevel === '000' ? '000'
    : resolvedLevel === '1000' ? '1000'
    : String(resolvedLevel).padStart(3, '0')

  const tokenCssVar = tokenColors(resolvedFamily, normalizedLevel)
  
  // 1. Manually update tokens JSON so it's persisted for export
  store.setTokensSilent(tokensCopy)

  const cssUpdates: Record<string, string> = {
    [tokenCssVar]: newHex
  }

  // 2. If the UI indicated that the on-tone needs to flip, update the brand value
  const targetCssVar = issue.suggestion?.targetCssVar || (issue.toneCssVar ? issue.toneCssVar.replace(/_tone$/, '_on-tone') : null)
  
  if (newOnToneColor && targetCssVar) {
    const onToneValueJson = newOnToneColor === 'white' ? '{colors.scale-00.000}' : '{colors.scale-00.1000}'
    const onToneCssVarValue = newOnToneColor === 'white' ? 'var(--recursica_tokens_colors_scale-00_000)' : 'var(--recursica_tokens_colors_scale-00_1000)'
    
    // Update the brand JSON with JSON ref
    updateBrandValue(targetCssVar, onToneValueJson)
    // Update the DOM with CSS var ref to pass validation
    cssUpdates[targetCssVar] = onToneCssVarValue
  }

  // 3. Use writeCssVarsDirect to update DOM, track delta, and trigger compliance scan
  store.writeCssVarsDirect(cssUpdates)

  // 4. Trigger UI update
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
  }, 100)
}
