import type { ManifestExtractor, ManifestPath, ManifestSources } from './types'

function keysOf(node: unknown): string[] {
  return node !== null && typeof node === 'object' ? Object.keys(node as Record<string, unknown>) : []
}

/**
 * Picks every breakpoint-related subtree: all of `brand.layout-grids.<name>` (the app defines a
 * breakpoint by adding a layout grid with a min/max-width, so these are the breakpoints even when
 * no `breakpoints` tree exists), plus any `tokens.breakpoints.<name>` and `brand.breakpoints.<name>`
 * override subtrees. Raw source is copied; no resolved condition string is computed.
 */
function collectBreakpointPaths(sources: ManifestSources): ManifestPath[] {
  const paths: ManifestPath[] = []

  for (const root of ['tokens', 'brand'] as const) {
    const breakpoints = (sources[root] as Record<string, unknown> | undefined)?.breakpoints
    for (const name of keysOf(breakpoints)) {
      if (!name.startsWith('$')) paths.push([root, 'breakpoints', name])
    }
  }

  const layoutGrids = (sources.brand as Record<string, unknown> | undefined)?.['layout-grids']
  for (const name of keysOf(layoutGrids)) {
    if (!name.startsWith('$')) paths.push(['brand', 'layout-grids', name])
  }

  return paths
}

export const breakpointsExtractor: ManifestExtractor = {
  id: 'breakpoints',
  extract: collectBreakpointPaths,
}
