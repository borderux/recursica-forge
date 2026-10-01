import type { ManifestExtractor, ManifestPath, ManifestSources } from './types'

/**
 * Finds every token node under ui-kit.components that carries a `recursica.component`
 * extension — a property whose $value references another component's whole group
 * (e.g. `{ui-kit.components.button}`), with `$extensions['recursica.component'].selected-variants`
 * pinning specific variant paths on that component (e.g. `{ui-kit.components.button.variants.styles.solid}`).
 * This is "a component that references a variant of another component."
 */
function collectComponentVariantReferencePaths(sources: ManifestSources): ManifestPath[] {
  const components = (sources['ui-kit']?.components ?? {}) as Record<string, unknown>
  const paths: ManifestPath[] = []

  function walk(node: unknown, path: ManifestPath): void {
    if (node === null || typeof node !== 'object') return
    const obj = node as Record<string, unknown>

    // Per DTCG, a node with $value is a token — a leaf. Recursion stops there.
    if (Object.prototype.hasOwnProperty.call(obj, '$value')) {
      const ext = obj.$extensions as Record<string, unknown> | undefined
      if (ext && typeof ext === 'object' && 'recursica.component' in ext) {
        paths.push(path)
      }
      return
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue
      walk(value, [...path, key])
    }
  }

  for (const [compName, compData] of Object.entries(components)) {
    walk(compData, ['ui-kit', 'components', compName])
  }

  return paths
}

/**
 * Reduces each `selected-variants` reference (`{ui-kit.components.button.variants.styles.solid}`)
 * to its final segment (`solid`). Values that aren't a `{...}` reference are left untouched.
 */
function reduceSelectedVariants(value: unknown): unknown {
  const clone = JSON.parse(JSON.stringify(value)) as Record<string, any>
  const selected = clone?.$extensions?.['recursica.component']?.['selected-variants']
  if (selected && typeof selected === 'object') {
    for (const [key, ref] of Object.entries(selected)) {
      if (typeof ref !== 'string') continue
      const match = /^\{(?:.*\.)?([^.{}]+)\}$/.exec(ref)
      if (match) selected[key] = match[1]
    }
  }
  return clone
}

export const componentVariantReferencesExtractor: ManifestExtractor = {
  id: 'component-variant-references',
  extract: collectComponentVariantReferencePaths,
  transform: reduceSelectedVariants,
}
