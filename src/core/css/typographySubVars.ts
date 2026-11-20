/**
 * Per-property CSS vars for a ui-kit typography-style property.
 *
 * A ui-kit property like `card.properties.header-style` holds a whole brand typography group
 * (`{brand.typography.h2}`). The published adapter, and Forge's own export, read it as one var
 * per CSS property: `<name>_fontFamily`, `<name>_fontSize`, … Forge itself stores the property
 * as a single var, so this produces the per-property companions, each pointing at the live
 * brand typography var so a brand typography edit flows through.
 *
 * Used where the property is computed (resolvers/uikit) and where the toolbar writes it
 * (updateCssVar), so both keep the companions in step.
 */

const BRAND_TYPOGRAPHY_PREFIX = '--recursica_brand_typography_'

/** Export sub-name → the suffix Forge's typography resolver uses for that property. */
const SUB_PROPERTIES: ReadonlyArray<readonly [string, string]> = [
  ['fontFamily', 'font-family'],
  ['fontSize', 'font-size'],
  ['fontStyle', 'font-style'],
  ['fontWeight', 'font-weight'],
  ['letterSpacing', 'font-letter-spacing'],
  ['lineHeight', 'line-height'],
  ['textCase', 'text-transform'],
  ['textDecoration', 'text-decoration'],
]

/**
 * The brand typography style a value selects, or null when it is not a whole-group reference.
 * Accepts the JSON form (`{brand.typography.h2}`) and the resolved form the resolver emits
 * (`var(--recursica_brand_typography_h2-font-size)`).
 */
export function typographyStyleOf(value: string): string | null {
  const trimmed = value.trim()
  const ref = /^\{\s*brand\.typography\.([A-Za-z0-9_-]+)\s*\}$/.exec(trimmed)
  if (ref) return ref[1]
  const resolved = /^var\(\s*--recursica_brand_typography_([A-Za-z0-9_-]+)-font-size\s*\)$/.exec(trimmed)
  return resolved ? resolved[1] : null
}

/** The per-property companion vars for `cssVarName` set to `value`, or null if it is not a typography group. */
export function typographySubVars(cssVarName: string, value: string): Record<string, string> | null {
  const style = typographyStyleOf(value)
  if (!style) return null
  const out: Record<string, string> = {}
  for (const [sub, suffix] of SUB_PROPERTIES) {
    out[`${cssVarName}_${sub}`] = `var(${BRAND_TYPOGRAPHY_PREFIX}${style}-${suffix})`
  }
  return out
}
