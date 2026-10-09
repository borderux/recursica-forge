import type { JsonLike } from '../../resolvers/tokens'

/** The three source trees a manifest extractor can read from, keyed by their root export name. */
export interface ManifestSources {
  tokens: JsonLike
  brand: JsonLike
  'ui-kit': JsonLike
}

/** A path of keys into a ManifestSources tree, e.g. ['ui-kit', 'components', 'pagination', ...]. */
export type ManifestPath = string[]

/**
 * A manifest extractor picks out every node belonging to one concern (e.g. cross-component
 * variant references) from any of the three source trees. recursica_manifest.json is the union
 * of every registered extractor's picks, copied from the same path in its source — verbatim unless
 * the extractor declares a `transform`.
 */
export interface ManifestExtractor {
  id: string
  extract: (sources: ManifestSources) => ManifestPath[]
  /**
   * Optional reshaping applied to each picked value before it lands in the manifest. A deliberate
   * exception to the verbatim rule; must be pure so validation can re-apply it to the source value.
   */
  transform?: (value: unknown, path: ManifestPath) => unknown
}
