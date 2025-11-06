function hashObject(obj: unknown): string {
  const s = JSON.stringify(obj)
  let h = 5381
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h) + s.charCodeAt(i)
  return String(h >>> 0)
}

export function computeBundleVersion(tokensImport: unknown, themeImport: unknown, uikitImport: unknown): string {
  return [hashObject(tokensImport), hashObject(themeImport), hashObject(uikitImport)].join('.')
}


