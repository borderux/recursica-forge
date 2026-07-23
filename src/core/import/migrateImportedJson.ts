/**
 * JSON Migration Utility for Imported Files
 *
 * Upgrades older JSON exports to the current (2.x) DTCG structure so that files
 * authored against an earlier (1.x) structure can still be imported cleanly.
 *
 * Two layers run in order:
 *   1. String rules (MIGRATION_RULES) — rewrite reference strings in place
 *      (e.g. renamed token paths). Applied to every file, recursively.
 *   2. Structural migrations (migrateBrandTo2x / migrateUikitTo2x) — reshape the
 *      object graph for a specific file type (e.g. brand `states`, uikit globals).
 *
 * All structural migrations are STRUCTURE-DRIVEN and IDEMPOTENT: they detect the
 * old shape and only transform when it is present. This is deliberate — the
 * `$extensions.recursica.metadata.version` marker is unreliable (exports stamp it
 * with the app's package version, not the structure version), so we never trust
 * the marker to decide whether to migrate. Re-importing an already-2.x file is a
 * no-op.
 *
 * ── 1.x → 2.x structural deltas ─────────────────────────────────────────────
 *  brand.themes.<mode>.states:
 *    - `hover` was a bare opacity number → becomes `{ color, opacity }`
 *      (the old number is preserved as `opacity`; `color` gets the 2.x default).
 *    - `focus` (glow) and `link` (hover text treatment) are NEW → added with 2.x
 *      defaults if absent. Hover & focus are GLOBAL in 2.x (see StatesPage).
 *  ui-kit:
 *    - globals.form.field.colors.`border-error` → `error-border-color`
 *      (both the key and every reference to it).
 *    - per-component `states.hover` / `states.focus` / `states.visited-hover` are
 *      removed (these interaction states are global in 2.x); emptied `states` /
 *      `variants` containers are then pruned.
 */

const TARGET_STRUCTURE_VERSION = '2.0.0'

export interface MigrationRule {
  description: string
  // Regex to match string values like references (e.g. "{tokens.opacity.mist}")
  stringReplacement?: {
    pattern: RegExp
    replacement: string | ((substring: string, ...args: any[]) => string)
  }
}

export const MIGRATION_RULES: MigrationRule[] = [
  {
    description: 'Migrate tokens.opacity to tokens.opacities',
    stringReplacement: {
      pattern: /\{tokens\.opacity\./g,
      replacement: '{tokens.opacities.',
    },
  },
  {
    description: 'Migrate tokens.size to tokens.sizes',
    stringReplacement: {
      pattern: /\{tokens\.size\./g,
      replacement: '{tokens.sizes.',
    },
  },
  {
    description: 'Migrate tokens.color to tokens.colors',
    stringReplacement: {
      pattern: /\{tokens\.color\./g,
      replacement: '{tokens.colors.',
    },
  },
  {
    description: 'Migrate underscore separated colors to dot separated (scale-01_100 -> scale-01.100)',
    stringReplacement: {
      pattern: /\{tokens\.colors\.(scale-\d{2})_(\d{2,4})\}/g,
      replacement: '{tokens.colors.$1.$2}',
    },
  },
  {
    description: 'Migrate underscore separated brand colors to dot separated',
    stringReplacement: {
      pattern: /\{brand\.palettes\.(core-colors|neutral|accent|success|warning|alert|info)_(.+?)\}/g,
      replacement: '{brand.palettes.$1.$2}',
    },
  },
  // Catch flat css variables and convert them back to DTCG refs
  {
    description: 'Convert raw CSS variable injections back to DTCG refs',
    stringReplacement: {
      pattern: /^var\(--recursica_tokens_opacity_(.+?)\)$/g,
      replacement: '{tokens.opacities.$1}',
    },
  },
  {
    description: 'Convert raw CSS variable injections back to DTCG refs (sizes)',
    stringReplacement: {
      pattern: /^var\(--recursica_tokens_sizes_(.+?)\)$/g,
      replacement: '{tokens.sizes.$1}',
    },
  },
  {
    // 1.x → 2.x: the form-field error border global was renamed to follow the
    // state-first `{state}-{property}` pattern (matches disabled-border-color).
    description: 'Rename form-field border-error reference to error-border-color',
    stringReplacement: {
      pattern: /\{ui-kit\.globals\.form\.field\.colors\.border-error\}/g,
      replacement: '{ui-kit.globals.form.field.colors.error-border-color}',
    },
  },
]

/**
 * Deep clones a JSON value and applies every string-replacement rule to each
 * string leaf. Returns a fresh object graph (safe for the structural passes to
 * mutate in place).
 */
function applyStringRules(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    let result = data
    for (const rule of MIGRATION_RULES) {
      if (rule.stringReplacement) {
        if (typeof rule.stringReplacement.replacement === 'string') {
          result = result.replace(rule.stringReplacement.pattern, rule.stringReplacement.replacement)
        } else {
          result = result.replace(rule.stringReplacement.pattern, rule.stringReplacement.replacement as any)
        }
      }
    }
    return result
  }

  if (Array.isArray(data)) {
    return data.map(item => applyStringRules(item))
  }

  if (typeof data === 'object') {
    const migrated: any = {}
    for (const [key, value] of Object.entries(data)) {
      migrated[key] = applyStringRules(value)
    }
    return migrated
  }

  return data
}

// ── Structural-migration helpers ──────────────────────────────────────────────

const px = (value: number) => ({ value, unit: 'px' })

/** 2.x default focus-glow block for a given theme mode. */
const defaultFocus = (mode: string) => ({
  color: { $type: 'color', $value: `{brand.themes.${mode}.palettes.core-colors.interactive.tone}` },
  'border-size': { $type: 'number', $value: px(1) },
  margin: { $type: 'number', $value: px(2) },
  blur: { $type: 'number', $value: px(4) },
})

/** 2.x default link hover-treatment block. */
const defaultLink = () => ({
  decoration: { $type: 'string', $value: 'underline' },
  style: { $type: 'string', $value: 'normal' },
  weight: { $type: 'string', $value: '400' },
})

/** 2.x default hover overlay color for a given theme mode. */
const defaultHoverColor = (mode: string) => ({
  $type: 'color',
  $value: `{brand.themes.${mode}.palettes.neutral.400.color.tone}`,
})

/** Stamp the structure version onto a file root (informational; idempotent). */
function stampVersion(root: any): void {
  if (!root || typeof root !== 'object') return
  root.$extensions = root.$extensions || {}
  root.$extensions['recursica.metadata'] = {
    ...(root.$extensions['recursica.metadata'] || {}),
    version: TARGET_STRUCTURE_VERSION,
  }
}

/**
 * Brand: reshape `themes.<mode>.states` from the 1.x shape to 2.x. Idempotent —
 * only reshapes `hover` when it is still a bare number, and only adds `focus` /
 * `link` when absent.
 */
export function migrateBrandTo2x(root: any): any {
  const brand = root?.brand ?? root
  const themes = brand?.themes
  if (themes && typeof themes === 'object') {
    for (const mode of Object.keys(themes)) {
      const states = themes[mode]?.states
      if (!states || typeof states !== 'object') continue
      // 1.x `hover` was a bare opacity number → { color, opacity } (preserve the number as opacity)
      if (
        states.hover && typeof states.hover === 'object' &&
        '$value' in states.hover && !('color' in states.hover) && !('opacity' in states.hover)
      ) {
        states.hover = { color: defaultHoverColor(mode), opacity: states.hover }
      }
      if (!states.focus) states.focus = defaultFocus(mode)
      if (!states.link) states.link = defaultLink()
    }
  }
  stampVersion(root)
  return root
}

/**
 * UIKit: rename the error-border global, strip per-component interaction states
 * that became global in 2.x (hover/focus/visited-hover), and prune the emptied
 * `states` / `variants` containers. Idempotent.
 */
export function migrateUikitTo2x(root: any): any {
  const uikit = root?.['ui-kit'] ?? root
  // Rename globals.form.field.colors.border-error → error-border-color (the key;
  // references are handled by the string rule).
  const colors = uikit?.globals?.form?.field?.colors
  if (colors && typeof colors === 'object' && colors['border-error'] && !colors['error-border-color']) {
    colors['error-border-color'] = colors['border-error']
    delete colors['border-error']
  }

  const components = uikit?.components
  const clone = (v: any) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)))

  // Segmented control item: selected/unselected property groups (+ selected-text/unselected-text)
  // → variants/selection-states/{selected,unselected}/properties/{…, text}.
  const sci = components?.['segmented-control-item']
  if (sci?.properties && typeof sci.properties === 'object' && sci.properties.selected) {
    const p = sci.properties
    const mkState = (block: any, text: any) => {
      const props: any = {}
      if (block?.colors) props.colors = block.colors
      for (const k of ['elevation', 'border-size', 'border-radius']) if (block && k in block) props[k] = block[k]
      if (text) props.text = text
      return { properties: props }
    }
    sci.variants = sci.variants || {}
    sci.variants['selection-states'] = {
      selected: mkState(p.selected, p['selected-text']),
      unselected: mkState(p.unselected, p['unselected-text']),
    }
    delete p.selected; delete p.unselected; delete p['selected-text']; delete p['unselected-text']
  }

  // Tabs: split per-tab appearance into a new `tabs-item` component with active/inactive as a
  // selection-state variant, per style. Item colors/border-size come from the old
  // tabs/variants/styles/<style>/properties/{active,inactive}; text from tabs/properties/{active,inactive}-text.
  // Per-tab sizing also moves onto tabs-item (per style): min/max-width were global on the
  // container; padding/icon-size/element-gap were per-orientation — take the horizontal set.
  const tabs = components?.tabs
  const tabStyles = tabs?.variants?.styles
  if (tabStyles && typeof tabStyles === 'object' &&
      Object.values(tabStyles).some((s: any) => s?.properties?.active)) {
    const activeText = tabs.properties?.['active-text']
    const inactiveText = tabs.properties?.['inactive-text']
    const globalMin = tabs.properties?.['min-width']
    const globalMax = tabs.properties?.['max-width']
    const horizProps = tabs.variants?.orientation?.horizontal?.properties || {}
    const vertProps = tabs.variants?.orientation?.vertical?.properties || {}
    const SIZE_KEYS = ['horizontal-padding', 'vertical-padding', 'icon-size', 'element-gap']
    // tab-content-alignment moves onto tabs-item, per style × orientation.
    const horizAlign = horizProps['tab-content-alignment']
    const vertAlign = vertProps['tab-content-alignment']
    const itemStyles: any = {}
    for (const [sname, s] of Object.entries<any>(tabStyles)) {
      if (sname.startsWith('$')) continue
      const props = s?.properties || {}
      if (!props.active) continue
      const mkState = (block: any, text: any) => {
        const pp: any = {}
        if (block?.colors) pp.colors = block.colors
        if (block && 'border-size' in block) pp['border-size'] = block['border-size']
        if (text) pp.text = clone(text)
        return { properties: pp }
      }
      const istyle: any = { properties: {} }
      if (props['border-radius']) istyle.properties['border-radius'] = props['border-radius']
      if (globalMin) istyle.properties['min-width'] = clone(globalMin)
      if (globalMax) istyle.properties['max-width'] = clone(globalMax)
      for (const k of SIZE_KEYS) if (horizProps[k]) istyle.properties[k] = clone(horizProps[k])
      istyle.variants = {
        'selection-states': {
          inactive: mkState(props.inactive, inactiveText),
          active: mkState(props.active, activeText),
        },
      }
      if (horizAlign || vertAlign) {
        istyle.variants.orientation = {
          horizontal: { properties: horizAlign ? { 'tab-content-alignment': clone(horizAlign) } : {} },
          vertical: { properties: vertAlign ? { 'tab-content-alignment': clone(vertAlign) } : {} },
        }
      }
      itemStyles[sname] = istyle
      delete props.active; delete props.inactive; delete props['border-radius']
    }
    components['tabs-item'] = { variants: { styles: itemStyles } }
    if (tabs.properties) {
      delete tabs.properties['active-text']; delete tabs.properties['inactive-text']
      delete tabs.properties['min-width']; delete tabs.properties['max-width']
    }
    // space-between-tabs moves onto each style's per-orientation group (per style × orientation).
    for (const o of ['horizontal', 'vertical']) {
      const sbt = tabs.variants?.orientation?.[o]?.properties?.['space-between-tabs']
      if (!sbt) continue
      for (const [sname, st] of Object.entries<any>(tabStyles)) {
        if (sname.startsWith('$')) continue
        const so = st?.variants?.orientation?.[o]
        if (so) { so.properties = so.properties || {}; so.properties['space-between-tabs'] = clone(sbt) }
      }
    }
    // Sizing, alignment, and spacing have all moved off the container's top-level orientation axis.
    if (tabs.variants) delete tabs.variants.orientation
  }

  // Table: row hover is driven by the global theme hover state in 2.x, so the per-component
  // highlight-on-hover color/opacity overrides are removed from every layer.
  const tableProps = components?.table?.properties
  if (tableProps && typeof tableProps === 'object') {
    for (const layer of Object.values<any>(tableProps.colors || {})) {
      if (layer && typeof layer === 'object') delete layer['highlight-on-hover-color']
    }
    for (const layer of Object.values<any>(tableProps.opacities || {})) {
      if (layer && typeof layer === 'object') delete layer['highlight-on-hover-opacity']
    }
  }

  // Pagination: the active-page button ref moved out of variants.states.active.properties.pages
  // onto a top-level properties.active-pages (matching inactive-pages / navigation-controls), and
  // the now-empty variants block is dropped.
  const pagination = components?.pagination
  const activePages = pagination?.variants?.states?.active?.properties?.pages
  if (pagination && activePages && !pagination.properties?.['active-pages']) {
    pagination.properties = pagination.properties || {}
    pagination.properties['active-pages'] = clone(activePages)
    delete pagination.variants
  }

  // Panel: the shared header/footer background split into separate header and footer colours.
  const panelColors = components?.panel?.properties?.colors
  if (panelColors && typeof panelColors === 'object') {
    for (const layer of Object.values<any>(panelColors)) {
      if (!layer || typeof layer !== 'object' || !layer['header-footer-background-color']) continue
      const shared = layer['header-footer-background-color']
      if (!layer['header-background-color']) layer['header-background-color'] = clone(shared)
      if (!layer['footer-background-color']) layer['footer-background-color'] = clone(shared)
      delete layer['header-footer-background-color']
    }
  }

  // Modal: the single background split into separate header, content, and footer colours.
  const modalColors = components?.modal?.properties?.colors
  if (modalColors && typeof modalColors === 'object') {
    for (const layer of Object.values<any>(modalColors)) {
      if (!layer || typeof layer !== 'object' || !layer['background-color']) continue
      const shared = layer['background-color']
      if (!layer['header-background-color']) layer['header-background-color'] = clone(shared)
      if (!layer['content-background-color']) layer['content-background-color'] = clone(shared)
      if (!layer['footer-background-color']) layer['footer-background-color'] = clone(shared)
      delete layer['background-color']
    }
  }

  // Modal: the single horizontal/vertical padding split into header/footer + content padding.
  const modalProps = components?.modal?.properties
  if (modalProps && typeof modalProps === 'object') {
    for (const axis of ['horizontal', 'vertical']) {
      const shared = modalProps[`${axis}-padding`]
      if (!shared) continue
      if (!modalProps[`header-footer-${axis}-padding`]) modalProps[`header-footer-${axis}-padding`] = clone(shared)
      if (!modalProps[`content-${axis}-padding`]) modalProps[`content-${axis}-padding`] = clone(shared)
      delete modalProps[`${axis}-padding`]
    }
  }

  const REMOVED_STATES = new Set(['hover', 'focus', 'visited-hover'])
  const prune = (node: any): void => {
    if (!node || typeof node !== 'object' || Array.isArray(node) || '$value' in node) return
    // Recurse first so empties propagate bottom-up.
    for (const key of Object.keys(node)) prune(node[key])
    const states = node.states
    if (states && typeof states === 'object' && !('$value' in states)) {
      for (const s of Object.keys(states)) if (REMOVED_STATES.has(s)) delete states[s]
      if (Object.keys(states).length === 0) delete node.states
    }
    const variants = node.variants
    if (variants && typeof variants === 'object' && !('$value' in variants) && Object.keys(variants).length === 0) {
      delete node.variants
    }
  }
  if (uikit?.components && typeof uikit.components === 'object') prune(uikit.components)

  stampVersion(root)
  return root
}

/**
 * Deep clones and migrates an imported JSON file to the current (2.x) structure.
 * Applies string rules to every file; applies file-type-specific structural
 * migrations when `fileType` is provided. Structural passes are idempotent.
 */
export function migrateImportedJson(data: any, fileType?: 'tokens' | 'brand' | 'uikit'): any {
  const migrated = applyStringRules(data)
  if (fileType === 'brand') return migrateBrandTo2x(migrated)
  if (fileType === 'uikit') return migrateUikitTo2x(migrated)
  if (fileType === 'tokens') { stampVersion(migrated); return migrated }
  return migrated
}
