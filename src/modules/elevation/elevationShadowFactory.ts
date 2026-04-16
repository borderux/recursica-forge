import { trackChanges } from '../../core/store/cssDelta'

export interface ElevationShadowValues {
  /** Blur radius in px (non-negative) */
  blur: number
  /** Spread radius in px */
  spread: number
  /** X offset in px — signed (positive = right, negative = left) */
  offsetX: number
  /** Y offset in px — signed (positive = down, negative = up) */
  offsetY: number
  /** Shadow opacity 0–1 */
  opacityNormalized: number
  /** Palette key (e.g. "two") used for shadow color */
  paletteKey: string
  /** Palette level (e.g. "500") used for shadow color */
  paletteLevel: string
}

/**
 * Compute and write elevation shadow CSS vars for the given levels directly
 * to the DOM, bypassing the recompute cycle.
 *
 * Also tracks every var change in the delta so values survive any subsequent
 * recomputeAndApplyAll + reapplyDelta cycle.
 *
 * This is the single source of truth for translating panel form values into
 * CSS. It should be called on every control change — both during drag and on
 * commit — so the preview is always consistent.
 */
export function applyElevationShadow(
  levels: number[],
  mode: string,
  values: ElevationShadowValues,
): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const vars: Record<string, string> = {}

  for (const level of levels) {
    if (level === 0) continue // elevation-0 has no shadow

    const prefix = `--recursica_brand_themes_${mode}_elevations_elevation-${level}`
    const paletteVarName = `--recursica_brand_themes_${mode}_palettes_${values.paletteKey}_${values.paletteLevel}_color_tone`
    const pct = (values.opacityNormalized * 100).toFixed(2)
    const shadowColor = `color-mix(in srgb, var(${paletteVarName}) ${pct}%, transparent)`

    vars[`${prefix}_blur`] = `${values.blur}px`
    vars[`${prefix}_spread`] = `${values.spread}px`
    vars[`${prefix}_x-axis`] = `${values.offsetX}px`
    vars[`${prefix}_y-axis`] = `${values.offsetY}px`
    vars[`${prefix}_shadow-color`] = shadowColor
  }

  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val)
  }

  // Track in delta so reapplyDelta() restores these values after any recompute.
  trackChanges(vars)
}
