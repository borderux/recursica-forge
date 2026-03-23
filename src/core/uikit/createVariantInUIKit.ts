/**
 * Custom Variant Utilities
 *
 * Functions to create, delete, and inspect user-defined component variants
 * inside the recursica_ui-kit.json store slice.
 *
 * Custom variants are tagged with:
 *   $extensions: { "com.recursica.custom": true }
 * so they survive JSON export/import round-trips and can be identified at runtime.
 *
 * Axis category naming mirrors VARIANT_PROP_TO_CATEGORY:
 *   "style"  → stored under variants.styles.<name>
 *   "size"   → stored under variants.sizes.<name>
 *   "layout" → stored under variants.layouts.<name>
 *   "types"  → stored under variants.types.<name>
 *   "states" → stored under variants.states.<name>
 * (i.e. the plural form, matching the uikit JSON structure)
 */

import type { JsonLike } from '../resolvers/tokens'

/** Maps singular prop-axis names to their plural JSON category keys. */
const AXIS_TO_CATEGORY: Record<string, string> = {
  style: 'styles',
  size: 'sizes',
  layout: 'layouts',
  types: 'types',
  states: 'states',
  orientation: 'orientation',
}

/** Maps arbitrary axis category keys (as stored in uikit JSON) back to toolbar prop names. */
const CATEGORY_TO_AXIS: Record<string, string> = {
  styles: 'style',
  sizes: 'size',
  layouts: 'layout',
  types: 'types',
  states: 'states',
  orientation: 'orientation',
}

/** Returns the JSON category key for a toolbar axis prop name. */
export function axisToCategoryKey(axisName: string): string {
  return AXIS_TO_CATEGORY[axisName] ?? axisName
}

/** Returns the toolbar axis prop name for a JSON category key. */
export function categoryKeyToAxis(categoryKey: string): string {
  return CATEGORY_TO_AXIS[categoryKey] ?? categoryKey
}

/**
 * Normalises a user-typed variant name:
 *   - trims surrounding whitespace
 *   - converts spaces to hyphens
 *   - lowercases
 */
export function normalizeVariantName(name: string): string {
  return name.trim().replace(/\s+/g, '-').toLowerCase()
}

/**
 * Validates a proposed variant name (before normalisation).
 * Accepts letters and spaces; spaces are converted to hyphens on confirm.
 * Returns a human-readable error string if invalid, or null if valid.
 */
export function validateVariantName(name: string, existingNames: string[]): string | null {
  if (!name || name.trim().length === 0) {
    return 'Variant name cannot be empty.'
  }
  if (!/^[a-zA-Z][a-zA-Z\s]*$/.test(name)) {
    return 'Name must contain only letters and spaces.'
  }
  const normalised = normalizeVariantName(name)
  if (normalised.length > 48) {
    return 'Name must be 48 characters or fewer.'
  }
  if (existingNames.map(n => normalizeVariantName(n)).includes(normalised)) {
    return `A variant named "${normalised}" already exists on this axis.`
  }
  return null
}

/**
 * Validates an axis name entered by the user (for zero-variant components).
 */
export function validateAxisName(name: string, existingAxes: string[]): string | null {
  if (!name || name.trim().length === 0) {
    return 'Axis name cannot be empty.'
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return 'Name must be lowercase, start with a letter or digit, and contain only letters, digits, and hyphens.'
  }
  if (name.length > 48) {
    return 'Name must be 48 characters or fewer.'
  }
  if (existingAxes.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
    return `An axis named "${name}" already exists on this component.`
  }
  return null
}

/** Returns the components map from a uikit JSON object. */
function getComponents(uikit: any): any {
  return uikit?.['ui-kit']?.components ?? uikit?.components ?? {}
}

/** Returns the component entry for the given key, or undefined. */
function getComponent(uikit: any, componentKey: string): any {
  return getComponents(uikit)[componentKey]
}

/** Navigates to or creates the variants object under the given axis category. */
function getOrCreateVariantsCategory(component: any, axisCategory: string): any {
  if (!component.variants) component.variants = {}
  if (!component.variants[axisCategory]) component.variants[axisCategory] = {}
  return component.variants[axisCategory]
}

/**
 * Deep-clones a source variant branch and inserts it as a new variant.
 *
 * If sourceVariantName is empty string (zero-variant component), creates an
 * empty variant with placeholder properties instead of cloning.
 *
 * Returns the updated uikit JSON (mutates the passed object — same pattern as updateUIKitValue).
 */
export function cloneVariantInUIKit(
  uikit: JsonLike,
  componentKey: string,
  /** Plural category key, e.g. "styles", "sizes" */
  axisCategory: string,
  sourceVariantName: string,
  newVariantName: string,
): JsonLike {
  // Deep-clone before mutating so the module-import singleton is never dirty.
  // varsStore initialises state.uikit as the same object reference as the static
  // import, so mutating it in-place would also corrupt the 'original' used by
  // jsonExport.ts for the diff view.
  const cloned: JsonLike = JSON.parse(JSON.stringify(uikit))

  const component = getComponent(cloned, componentKey)
  if (!component) {
    throw new Error(`[cloneVariantInUIKit] Component "${componentKey}" not found in uikit.`)
  }

  const categorized = getOrCreateVariantsCategory(component, axisCategory)

  let newVariantData: any

  if (sourceVariantName && categorized[sourceVariantName]) {
    // Deep-clone the source variant
    newVariantData = JSON.parse(JSON.stringify(categorized[sourceVariantName]))
  } else {
    // Zero-variant component or missing source: create a minimal shell
    newVariantData = { properties: {} }
  }

  // Tag as custom
  if (!newVariantData.$extensions) newVariantData.$extensions = {}
  newVariantData.$extensions['com.recursica.custom'] = true

  // Lowercase the key — the resolver's toCssVarName lowercases all path segments,
  // so the JSON key must match to avoid CSS var name mismatches.
  const variantKey = newVariantName.toLowerCase()
  categorized[variantKey] = newVariantData

  return cloned
}

/**
 * Removes a custom variant from the uikit JSON.
 * Throws if the variant is not tagged as custom (safety guard).
 */
export function deleteCustomVariant(
  uikit: JsonLike,
  componentKey: string,
  axisCategory: string,
  variantName: string,
): JsonLike {
  // Deep-clone before mutating to protect the module-import singleton.
  const cloned: JsonLike = JSON.parse(JSON.stringify(uikit))

  const component = getComponent(cloned, componentKey)
  if (!component) {
    throw new Error(`[deleteCustomVariant] Component "${componentKey}" not found in uikit.`)
  }

  const categorized = component?.variants?.[axisCategory]
  if (!categorized || !categorized[variantName]) {
    throw new Error(
      `[deleteCustomVariant] Variant "${variantName}" not found in ${componentKey}.variants.${axisCategory}.`
    )
  }

  if (!categorized[variantName]?.$extensions?.['com.recursica.custom']) {
    throw new Error(
      `[deleteCustomVariant] Variant "${variantName}" on ${componentKey}.${axisCategory} is not a custom variant.`
    )
  }

  delete categorized[variantName]
  return cloned
}

/**
 * Lists all custom variants for a component across all axes.
 * Returns an array of { axis (toolbar prop name), axisCategory (JSON key), name }.
 */
export function listCustomVariants(
  uikit: JsonLike,
  componentKey: string,
): Array<{ axis: string; axisCategory: string; name: string }> {
  const component = getComponent(uikit, componentKey)
  if (!component?.variants) return []

  const result: Array<{ axis: string; axisCategory: string; name: string }> = []

  for (const [axisCategory, variantsObj] of Object.entries(component.variants as Record<string, any>)) {
    if (!variantsObj || typeof variantsObj !== 'object') continue
    for (const [variantName, variantData] of Object.entries(variantsObj as Record<string, any>)) {
      if (variantName.startsWith('$')) continue
      if (variantData?.$extensions?.['com.recursica.custom'] === true) {
        result.push({
          axis: categoryKeyToAxis(axisCategory),
          axisCategory,
          name: variantName,
        })
      }
    }
  }

  return result
}

/**
 * Returns whether a specific variant is user-created.
 */
export function isCustomVariant(
  uikit: JsonLike,
  componentKey: string,
  axisCategory: string,
  variantName: string,
): boolean {
  const component = getComponent(uikit, componentKey)
  return component?.variants?.[axisCategory]?.[variantName]?.$extensions?.['com.recursica.custom'] === true
}

/**
 * Returns the existing variant names for a given axis on a component.
 * Returns [] if the axis or component doesn't exist.
 */
export function getExistingVariantNames(
  uikit: JsonLike,
  componentKey: string,
  axisCategory: string,
): string[] {
  const component = getComponent(uikit, componentKey)
  const categorized = component?.variants?.[axisCategory]
  if (!categorized || typeof categorized !== 'object') return []
  return Object.keys(categorized).filter(k => !k.startsWith('$'))
}

/**
 * Returns the existing axis category keys on a component (e.g. ["styles", "sizes"]).
 */
export function getExistingAxes(
  uikit: JsonLike,
  componentKey: string,
): string[] {
  const component = getComponent(uikit, componentKey)
  if (!component?.variants) return []
  return Object.keys(component.variants).filter(k => !k.startsWith('$'))
}
