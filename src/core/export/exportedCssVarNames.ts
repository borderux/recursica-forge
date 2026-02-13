/**
 * Exported CSS variable naming convention (export-only).
 * Path segments joined with single underscore; underscore in a key escaped as __.
 * No DOM or store dependencies.
 */

const PREFIX = '--recursica_'
const INTERNAL_PREFIX = '--recursica-'

/**
 * Converts a path array to the exported CSS variable name.
 * Each segment's underscores are escaped to __; segments are joined with _.
 */
export function pathToExportedName(path: string[]): string {
  const escaped = path.map((seg) => seg.replace(/_/g, '__'))
  return PREFIX + escaped.join('_')
}

/**
 * Converts an exported CSS variable name back to a path array.
 * Returns [] for invalid or non-recursica names.
 */
export function exportedNameToPath(name: string): string[] {
  if (!name.startsWith(PREFIX)) return []
  const body = name.slice(PREFIX.length)
  const parts = body.split('_')
  const segments: string[] = []
  let i = 0
  while (i < parts.length) {
    let seg = parts[i++]
    while (i < parts.length && parts[i] === '') {
      seg += '_' + (parts[i + 1] ?? '')
      i += 2
    }
    segments.push(seg)
  }
  return segments
}

/**
 * Converts an internal CSS variable name (hyphenated, --recursica-*) to a path array
 * for export. Used only when writing CSS export. Returns [] for invalid names.
 */
export function internalNameToPath(internalName: string): string[] {
  if (!internalName.startsWith(INTERNAL_PREFIX)) return []
  const body = internalName.slice(INTERNAL_PREFIX.length)
  if (body.startsWith('tokens-')) return tokensInternalToPath(body)
  if (body.startsWith('brand-')) return ['brand', ...body.slice(6).split('-')]
  if (body.startsWith('ui-kit-')) return uikitInternalToPath(body.slice(7))
  return []
}

function tokensInternalToPath(body: string): string[] {
  const rest = body.slice(7)
  const parts = rest.split('-')
  if (parts[0] === 'colors' && parts.length >= 3) {
    let scaleEndIndex = -1
    for (let i = 1; i < parts.length - 1; i++) {
      if (/^\d{3,4}$/.test(parts[i + 1])) {
        scaleEndIndex = i
        break
      }
    }
    if (scaleEndIndex > 0) {
      const scale = parts.slice(1, scaleEndIndex + 1).join('-')
      const level = parts[scaleEndIndex + 1]
      return ['tokens', 'colors', scale, level]
    }
    return ['tokens', 'colors', parts[1], parts.slice(2).join('-')]
  }
  if (parts[0] === 'sizes' && parts.length >= 2) {
    return ['tokens', 'sizes', parts.slice(1).join('-')]
  }
  if ((parts[0] === 'opacities' || parts[0] === 'opacity') && parts.length >= 2) {
    return ['tokens', parts[0], parts.slice(1).join('-')]
  }
  if (parts[0] === 'font' && parts.length >= 3) {
    const hyphenatedFontKinds: Array<[string, string]> = [
      ['line', 'heights'],
      ['letter', 'spacings'],
    ]
    for (const [a, b] of hyphenatedFontKinds) {
      if (parts[1] === a && parts[2] === b && parts.length >= 4) {
        return ['tokens', 'font', `${a}-${b}`, parts.slice(3).join('-')]
      }
    }
    return ['tokens', 'font', parts[1], parts.slice(2).join('-')]
  }
  return ['tokens', ...parts]
}

const UIKIT_PATH_ENDINGS = [
  'variants-sizes',
  'variants-styles',
  'properties',
  'colors',
  'size',
]

function uikitInternalToPath(rest: string): string[] {
  let bestIdx = -1
  let bestEnding = ''
  for (const ending of UIKIT_PATH_ENDINGS) {
    const needle = `-${ending}-`
    const idx = rest.lastIndexOf(needle)
    if (idx !== -1 && idx + needle.length < rest.length) {
      if (idx > bestIdx) {
        bestIdx = idx
        bestEnding = ending
      }
    }
  }
  if (bestIdx === -1) {
    return ['ui-kit', ...rest.split('-')]
  }
  const before = rest.slice(0, bestIdx)
  const key = rest.slice(bestIdx + 1 + bestEnding.length + 1)
  const segments = before.split('-').filter(Boolean)
  return ['ui-kit', ...segments, bestEnding, key]
}
