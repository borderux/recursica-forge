/**
 * Per-breakpoint type overrides.
 *
 * A breakpoint stores only what differs, at `brand.breakpoints.<bp>.typography.<style>.<prop>`.
 * The property keys are the same camelCase keys the base composite uses inside its `$value`
 * (fontSize, lineHeight, …), so the exporter's path-to-var rule produces exactly the base var
 * name — `brand.typography.h1.fontSize` → `--recursica_brand_typography_h1_fontSize` — and the
 * media block re-declares the same var the base CSS already declared. Nothing else is needed for
 * the override to take effect.
 *
 * A property with no entry inherits. Setting it back to the inherited value removes the entry, so
 * the stored delta never grows stale entries that say nothing.
 */

/** The typography sub-properties, each with the token group it draws from. */
export const TYPE_PROPS = [
  { key: 'fontFamily', label: 'Font family', group: 'brand.fonts' },
  { key: 'fontSize', label: 'Font size', group: 'tokens.font.sizes' },
  { key: 'fontWeight', label: 'Font weight', group: 'tokens.font.weights' },
  { key: 'letterSpacing', label: 'Letter spacing', group: 'tokens.font.letter-spacings' },
  { key: 'lineHeight', label: 'Line height', group: 'tokens.font.line-heights' },
  { key: 'fontStyle', label: 'Style', group: 'tokens.font.styles' },
  { key: 'textDecoration', label: 'Decoration', group: 'tokens.font.decorations' },
  { key: 'textCase', label: 'Case', group: 'tokens.font.cases' },
] as const

export type TypeProp = (typeof TYPE_PROPS)[number]['key']

/**
 * The type panel names properties the way CSS does (`font-size`); the brand names them the way
 * DTCG does (`fontSize`). One table so the panel can write a breakpoint override without knowing
 * about either shape.
 */
export const CSS_PROP_TO_TYPE_PROP: Record<string, { key: TypeProp; group: string }> = {
  'font-family': { key: 'fontFamily', group: 'brand.fonts' },
  'font-size': { key: 'fontSize', group: 'tokens.font.sizes' },
  'font-weight': { key: 'fontWeight', group: 'tokens.font.weights' },
  'font-letter-spacing': { key: 'letterSpacing', group: 'tokens.font.letter-spacings' },
  'line-height': { key: 'lineHeight', group: 'tokens.font.line-heights' },
  'font-style': { key: 'fontStyle', group: 'tokens.font.styles' },
  'text-decoration': { key: 'textDecoration', group: 'tokens.font.decorations' },
  'text-transform': { key: 'textCase', group: 'tokens.font.cases' },
}

/** `{tokens.font.sizes.4xl}` → `var(--recursica_tokens_font_sizes_4xl)`. */
export const refToVar = (ref: string) =>
  `var(--recursica_${ref.replace(/^\{|\}$/g, '').split('.').join('_')})`

/**
 * Splits `--recursica_brand_typography_h1-font-size` into the style and the property, matching the
 * property as a suffix so a style name with hyphens still resolves.
 */
export function parseTypographyVar(name: string): { style: string; cssProp: string } | null {
  const prefix = '--recursica_brand_typography_'
  if (!name.startsWith(prefix)) return null
  const rest = name.slice(prefix.length)
  const cssProp = Object.keys(CSS_PROP_TO_TYPE_PROP)
    .filter((prop) => rest.endsWith('-' + prop))
    .sort((a, b) => b.length - a.length)[0]
  if (!cssProp) return null
  const style = rest.slice(0, rest.length - cssProp.length - 1)
  return style ? { style, cssProp } : null
}

const brandRoot = (themeJson: any) => themeJson?.brand ?? themeJson
const tokensRoot = (tokensJson: any) => tokensJson?.tokens ?? tokensJson

/** Walks a dotted group path in whichever file it belongs to. */
function groupNode(group: string, tokensJson: any, themeJson: any): any {
  const segments = group.split('.')
  let node = segments[0] === 'brand' ? brandRoot(themeJson) : tokensRoot(tokensJson)
  for (const seg of segments.slice(1)) node = node?.[seg]
  return node ?? {}
}

/** The choices for one property: the keys of its token group. */
export function optionsFor(group: string, tokensJson: any, themeJson: any): string[] {
  return Object.keys(groupNode(group, tokensJson, themeJson)).filter((k) => !k.startsWith('$'))
}

/** The `$type` the referenced token carries, so the override declares the same one. */
export function typeOfToken(group: string, key: string, tokensJson: any, themeJson: any): string | undefined {
  const node = groupNode(group, tokensJson, themeJson)[key]
  return node && typeof node === 'object' ? node.$type : undefined
}

/** The base value for a style's property, as a `{...}` reference. */
export function inheritedRef(themeJson: any, style: string, prop: TypeProp): string {
  const value = brandRoot(themeJson)?.typography?.[style]?.$value?.[prop]
  return typeof value === 'string' ? value : ''
}

/** The breakpoint's override for a style's property, or '' when it inherits. */
export function overrideRef(themeJson: any, bp: string, style: string, prop: TypeProp): string {
  const node = brandRoot(themeJson)?.breakpoints?.[bp]?.typography?.[style]?.[prop]
  const value = node && typeof node === 'object' && '$value' in node ? node.$value : node
  return typeof value === 'string' ? value : ''
}

/** The key inside `{tokens.font.sizes.4xl}` — '4xl'. */
export function keyOfRef(ref: string): string {
  const inner = ref.replace(/^\{|\}$/g, '')
  return inner.split('.').pop() ?? ''
}

/** Styles this breakpoint overrides at all. */
export function overriddenStyles(themeJson: any, bp: string): Set<string> {
  return new Set(Object.keys(brandRoot(themeJson)?.breakpoints?.[bp]?.typography ?? {}))
}

/**
 * Writes one property of one style at one breakpoint. `ref` of '' clears the override.
 * Mutates the brand object it is given; empty groups are removed on the way out.
 */
export function writeTypeOverride(
  brand: any,
  bp: string,
  style: string,
  prop: TypeProp,
  ref: string,
  $type: string | undefined,
): void {
  if (ref) {
    if (!brand.breakpoints) brand.breakpoints = {}
    if (!brand.breakpoints[bp]) brand.breakpoints[bp] = {}
    if (!brand.breakpoints[bp].typography) brand.breakpoints[bp].typography = {}
    if (!brand.breakpoints[bp].typography[style]) brand.breakpoints[bp].typography[style] = {}
    brand.breakpoints[bp].typography[style][prop] = $type ? { $type, $value: ref } : { $value: ref }
    return
  }

  const styles = brand.breakpoints?.[bp]?.typography
  if (!styles?.[style]) return
  delete styles[style][prop]
  if (Object.keys(styles[style]).length === 0) delete styles[style]
  if (Object.keys(styles).length === 0) delete brand.breakpoints[bp].typography
  if (Object.keys(brand.breakpoints[bp]).length === 0) delete brand.breakpoints[bp]
  if (Object.keys(brand.breakpoints).length === 0) delete brand.breakpoints
}
