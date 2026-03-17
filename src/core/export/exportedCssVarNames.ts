/**
 * Exported CSS variable naming convention (export-only).
 * Path segments joined with single underscore; underscore in a key escaped as __.
 * No DOM or store dependencies.
 */

const PREFIX = '--recursica_'
const INTERNAL_PREFIX = '--recursica_'

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
 * Converts an internal CSS variable name to a path array.
 * Since internal format now matches export format (--recursica_ with underscore separators),
 * this simply delegates to exportedNameToPath.
 */
export function internalNameToPath(internalName: string): string[] {
  return exportedNameToPath(internalName)
}

