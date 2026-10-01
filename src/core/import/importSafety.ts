/**
 * Safety checks for imported token, brand and ui-kit JSON.
 *
 * Group and token names become CSS custom property names, and string values become CSS values,
 * both in the live page's <style> tags and in exported CSS files. A name like
 * `x:1}*{background:url(https://evil.example)}a{--y` would otherwise add its own CSS rule, so names
 * and values are checked before anything is stored.
 */

/** Keys that change an object's prototype when copied with `obj[key] = value`. */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * DTCG names must not start with `$` or contain `{`, `}` or `.`. We also keep them to letters,
 * digits, spaces, `_` and `-`, which is every name Forge itself creates.
 */
const SAFE_NAME = /^[\p{L}\p{N} _-]+$/u

/** CSS that loads remote content or ends a declaration early. */
const UNSAFE_VALUE = /url\s*\(|image-set\s*\(|image\s*\(|expression\s*\(|@import|javascript:|[;<>\\\n\r]/i

/** Max import size per file, well above the bundled files (~300 KB). */
export const MAX_IMPORT_FILE_BYTES = 20 * 1024 * 1024
/** Max JSON files read from one ZIP. */
export const MAX_ZIP_JSON_ENTRIES = 20
/** Deepest nesting accepted; the bundled files are under 15 levels deep. */
const MAX_DEPTH = 64
/** Most problems listed in one error message. */
const MAX_REPORTED = 10

function isUnsafeValue(value: string): boolean {
  if (UNSAFE_VALUE.test(value)) return true
  // Braces are only allowed as {path.to.token} references.
  const withoutRefs = value.replace(/\{[^{}]*\}/g, '')
  return withoutRefs.includes('{') || withoutRefs.includes('}')
}

/**
 * Removes prototype-changing keys in place and returns a list of unsafe names and values.
 * `$extensions` is skipped for name checks (its keys are reverse-domain names with dots) but
 * still cleaned of dangerous keys.
 */
function inspect(node: unknown, path: string[], problems: string[], depth: number, inExtensions: boolean): void {
  if (problems.length >= MAX_REPORTED) return
  if (depth > MAX_DEPTH) {
    problems.push(`${path.join('.') || '(root)'}: nested too deeply`)
    return
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => inspect(item, [...path, String(i)], problems, depth + 1, inExtensions))
    return
  }
  if (!node || typeof node !== 'object') return

  const record = node as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (DANGEROUS_KEYS.has(key)) {
      delete record[key]
      continue
    }
    const value = record[key]
    const childPath = [...path, key]

    if (!inExtensions && !key.startsWith('$') && !SAFE_NAME.test(key)) {
      problems.push(`${path.join('.') || '(root)'}: invalid name "${key.slice(0, 80)}"`)
      continue
    }
    if (!inExtensions && key === '$value') {
      const strings = typeof value === 'string' ? [value] : collectStrings(value)
      const bad = strings.find(isUnsafeValue)
      if (bad !== undefined) {
        problems.push(`${childPath.join('.')}: invalid value "${bad.slice(0, 80)}"`)
        continue
      }
    }
    inspect(value, childPath, problems, depth + 1, inExtensions || key === '$extensions')
  }
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out))
  return out
}

/** Returns the unsafe names and values in a file, after removing prototype-changing keys. */
export function findUnsafeContent(json: unknown): string[] {
  const problems: string[] = []
  inspect(json, [], problems, 0, false)
  return problems
}

/** Throws when an imported file has names or values that are unsafe to turn into CSS. */
export function assertSafeImport(json: unknown, label: string): void {
  const problems = findUnsafeContent(json)
  if (problems.length > 0) {
    throw new Error(
      `${label} has names or values that are not allowed:\n` +
        problems.map((p) => `  - ${p}`).join('\n') +
        '\nNames may only use letters, numbers, spaces, "_" and "-". Values may not contain url(), ";", "<", ">" or "\\".',
    )
  }
}
