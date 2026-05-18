/**
 * Toolbar factory for `recursica.component` extension tokens.
 *
 * When a component property carries:
 *   $value: "{ui-kit.components.button}"
 *   $extensions.recursica.component.selected-variants: { style: "{...solid}", size: "{...small}" }
 *
 * this factory inspects the target component's variant dimensions and produces
 * a `ToolbarPropConfig` group with one dropdown per `selected-variants` key.
 * The dropdown options come from the actual variant names on the target component
 * and the initial value comes from the leaf of each reference string.
 */

import type { ToolbarPropConfig } from './loadToolbarConfig'
import { buildComponentCssVarPath } from '../../../components/utils/cssVarNames'
import type { ComponentName } from '../../../components/registry/types'
import { getVarsStore } from '../../../core/store/varsStore'
import uikitJson from '../../../../recursica_ui-kit.json'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the leaf value from a DTCG reference string.
 * e.g. "{ui-kit.components.button.variants.styles.solid}" → "solid"
 */
function refLeaf(ref: string): string {
  const m = /\.([^.}]+)\}$/.exec(ref)
  return m ? m[1] : ref
}

/**
 * Extracts the target component name from a $value reference.
 * e.g. "{ui-kit.components.button}" → "button"
 */
function componentNameFromRef(ref: string): string | null {
  const m = /^\{ui-kit\.components\.([^.}]+)\}$/.exec(ref.trim())
  return m ? m[1] : null
}

/**
 * Returns a reasonable Phosphor icon name for a given variant dimension key.
 */
function iconForDimension(dimKey: string): string {
  const map: Record<string, string> = {
    style: 'diamonds-four',
    styles: 'diamonds-four',
    size: 'resize',
    sizes: 'resize',
    content: 'text-columns',
    layout: 'layout',
    orientation: 'arrows-clockwise',
    types: 'list-bullets',
  }
  return map[dimKey] ?? 'squares-four'
}

/**
 * Converts a dimension category key ("styles", "sizes") to the singular toolbar
 * form used as the selected-variants key ("style", "size").
 */
function dimKeyToVariantKey(dimKey: string): string {
  if (dimKey.endsWith('s')) return dimKey.slice(0, -1)
  return dimKey
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A fully-resolved toolbar group entry generated from a single `recursica.component` token.
 */
export interface ComponentExtensionGroup {
  /** Property name in the parent component (e.g. "active-pages") */
  propName: string
  /** Target component name (e.g. "button") */
  targetComponent: string
  /** Toolbar prop config for the parent group */
  groupConfig: ToolbarPropConfig
  /** Default values per dimension key, e.g. { style: "solid", size: "small" } */
  defaultValues: Record<string, string>
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Scans `components[componentKey].properties` for all `recursica.component`
 * extension tokens and returns a `ComponentExtensionGroup` for each one.
 *
 * Uses the live store uikit when available so runtime-cloned variants are visible.
 * Falls back to the static import.
 *
 * @param componentKey - kebab-case component key as it appears in recursica_ui-kit.json
 *                       (e.g. "pagination", "button")
 * @param uikitOverride - Optional uikit JSON override (e.g. from a test fixture)
 */
export function buildComponentExtensionGroups(
  componentKey: string,
  uikitOverride?: any,
): ComponentExtensionGroup[] {
  const liveUikit = (() => {
    try { return getVarsStore().getState().uikit } catch { return null }
  })()
  const uikitRoot: any = uikitOverride ?? liveUikit ?? uikitJson
  const components: Record<string, any> = uikitRoot?.['ui-kit']?.components ?? uikitRoot?.components ?? {}

  const component = components[componentKey]
  if (!component) return []

  const properties: Record<string, any> = component.properties ?? {}
  const groups: ComponentExtensionGroup[] = []

  for (const [propName, node] of Object.entries(properties)) {
    if (propName.startsWith('$')) continue
    if (typeof node !== 'object' || node === null) continue

    // Must be a DTCG token with recursica.component extension
    if (!('$value' in node)) continue
    const ext = node['$extensions']?.['recursica.component']
    if (!ext || typeof ext !== 'object') continue

    const valueRef = node['$value']
    if (typeof valueRef !== 'string') continue

    const targetCompName = componentNameFromRef(valueRef)
    if (!targetCompName) continue

    const targetComp = components[targetCompName]
    if (!targetComp) continue

    const selectedVariants: Record<string, string> = ext['selected-variants'] ?? {}
    const targetVariants: Record<string, any> = targetComp.variants ?? {}

    // Build one dropdown child per selected-variants key
    const children: Record<string, ToolbarPropConfig> = {}
    const defaultValues: Record<string, string> = {}

    for (const [dimKey, dimRef] of Object.entries(selectedVariants)) {
      if (typeof dimRef !== 'string') continue

      // Resolve default value from the ref leaf (e.g. "solid" from "...styles.solid}")
      const defaultVal = refLeaf(dimRef)
      defaultValues[dimKey] = defaultVal

      // Resolve dropdown options from the target component's variant dimension.
      // The dimension category may be plural (e.g. "styles") while the key is
      // singular (e.g. "style") — check both.
      const categoryKey = dimKey.endsWith('s') ? dimKey : `${dimKey}s`
      const dimensionCategory = targetVariants[categoryKey] ?? targetVariants[dimKey]
      const options: string[] = dimensionCategory
        ? Object.keys(dimensionCategory).filter(k => !k.startsWith('$'))
        : []

      const childKey = `${propName}-${dimKey}`
      const cssVar = buildComponentCssVarPath(
        // ComponentName cast — the factory is generic, the caller passes the actual key
        componentKey as ComponentName,
        'properties', propName, dimKey,
      )

      children[childKey] = {
        icon: iconForDimension(dimKey),
        label: dimKey.charAt(0).toUpperCase() + dimKey.slice(1),
        visible: true,
        control: 'dropdown',
        options,
        // Stash defaultValue so PropControlContent can initialise the dropdown.
        // ToolbarPropConfig doesn't carry defaultValue natively, but
        // PropControlContent reads it from the ComponentProp that the factory
        // also injects into parseComponentStructure.
      } satisfies ToolbarPropConfig
    }

    const groupConfig: ToolbarPropConfig = {
      icon: 'squares-four',
      label: propName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      visible: true,
      group: children,
      componentRef: targetCompName,
    }

    groups.push({ propName, targetComponent: targetCompName, groupConfig, defaultValues })
  }

  return groups
}

/**
 * Returns default values for all `recursica.component` tokens in a component.
 *
 * Keys use the flat child-prop convention: `{propName}-{dimKey}`, e.g.
 * `"active-pages-style"` → `"solid"`.
 *
 * Also keyed under the simple dimension form for `usePaginationConfig`-style
 * hooks: `"active-pages.style"` → `"solid"`.
 */
export function getComponentExtensionDefaults(
  componentKey: string,
  uikitOverride?: any,
): Record<string, string> {
  const groups = buildComponentExtensionGroups(componentKey, uikitOverride)
  const defaults: Record<string, string> = {}
  for (const group of groups) {
    for (const [dimKey, val] of Object.entries(group.defaultValues)) {
      defaults[`${group.propName}-${dimKey}`] = val
      defaults[`${group.propName}.${dimKey}`] = val
    }
  }
  return defaults
}
