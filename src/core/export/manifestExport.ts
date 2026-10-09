/**
 * recursica_manifest.json export
 *
 * A generated, export-only subset of tokens/brand/ui-kit — never re-imported, so unlike those
 * three it carries no schema/migration burden of its own. It travels alongside them and shares
 * their version.
 *
 * Each registered extractor in manifestExtractors/ picks out the paths belonging to one concern
 * (e.g. cross-component variant references) from any of the three source trees. The manifest is
 * the union of every extractor's picks, each copied verbatim from the matching path in its
 * source — same shape and values, just pruned. Adding a new concern later means adding a new
 * extractor to MANIFEST_EXTRACTORS, not touching this merge/validate logic. If an extractor
 * finds nothing, its concern is simply absent from the output — no bookkeeping needed to know
 * whether it ran.
 */

import type { JsonLike } from '../resolvers/tokens'
import packageJson from '../../../package.json'
import { breakpointsExtractor } from './manifestExtractors/breakpoints'
import { componentVariantReferencesExtractor } from './manifestExtractors/componentVariantReferences'
import type { ManifestExtractor, ManifestPath, ManifestSources } from './manifestExtractors/types'

const MANIFEST_EXTRACTORS: ManifestExtractor[] = [
  componentVariantReferencesExtractor,
  breakpointsExtractor,
]

function getAtPath(root: unknown, path: ManifestPath): unknown {
  let current: unknown = root
  for (const segment of path) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function setAtPath(target: Record<string, unknown>, path: ManifestPath, value: unknown): void {
  let current = target
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]
    if (typeof current[segment] !== 'object' || current[segment] === null) {
      current[segment] = {}
    }
    current = current[segment] as Record<string, unknown>
  }
  // Deep clone so the manifest never shares object references with the source export it was built from.
  current[path[path.length - 1]] = JSON.parse(JSON.stringify(value))
}

/** Runs every registered extractor against `sources` and merges their picks into one pruned tree. */
function buildManifestTree(sources: ManifestSources): Record<string, unknown> {
  const tree: Record<string, unknown> = {}

  for (const extractor of MANIFEST_EXTRACTORS) {
    for (const path of extractor.extract(sources)) {
      const value = getAtPath(sources, path)
      if (value !== undefined) setAtPath(tree, path, extractor.transform ? extractor.transform(value, path) : value)
    }
  }

  return tree
}

/**
 * Confirms every path an extractor picked still carries the same value in the manifest as in
 * the source tree it was built from — catches a future extractor bug before it ships a manifest
 * that's drifted from the files it's supposed to be a pruned view of.
 */
function validateManifestJson(manifestJson: JsonLike, sources: ManifestSources): void {
  const errors: string[] = []

  for (const extractor of MANIFEST_EXTRACTORS) {
    for (const path of extractor.extract(sources)) {
      const source = getAtPath(sources, path)
      const expected = extractor.transform && source !== undefined ? extractor.transform(source, path) : source
      const actual = getAtPath(manifestJson, path)
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        errors.push(`${path.join('.')}: manifest value does not match its (transformed) source value`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `recursica_manifest.json validation failed (${errors.length} error(s)):\n${errors.map(e => `  - ${e}`).join('\n')}`
    )
  }
}

/**
 * Builds recursica_manifest.json from the already-exported tokens/brand/ui-kit JSON, so the
 * manifest can never drift from the files it ships alongside.
 */
export function exportManifestJson(tokensJson: JsonLike, brandJson: JsonLike, uikitJson: JsonLike): object {
  const sources: ManifestSources = {
    tokens: (tokensJson as Record<string, unknown>)?.tokens ?? tokensJson,
    brand: (brandJson as Record<string, unknown>)?.brand ?? brandJson,
    'ui-kit': (uikitJson as Record<string, unknown>)?.['ui-kit'] ?? uikitJson,
  }

  const tree = buildManifestTree(sources)

  const manifest: Record<string, unknown> = {
    ...tree,
    $extensions: {
      'recursica.metadata': {
        exportedAt: new Date().toISOString(),
        version: packageJson.version,
      },
    },
  }

  validateManifestJson(manifest as JsonLike, sources)

  return manifest
}
