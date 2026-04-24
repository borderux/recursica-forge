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
import { trackChange } from '../store/cssDelta'
import { traceToTokenRef } from './layerColorStepping'
import type { ComplianceIssue } from './ComplianceService'

export function applySuggestTone(
  issue: ComplianceIssue,
  newHex: string,
  family: string,
  level: string,
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
  document.documentElement.style.setProperty(tokenCssVar, newHex)
  trackChange(tokenCssVar, newHex)
  store.setTokensSilent(tokensCopy)

  // Re-apply after recompute settles
  setTimeout(() => {
    document.documentElement.style.setProperty(tokenCssVar, newHex)
    trackChange(tokenCssVar, newHex)
    window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
  }, 500)
}
