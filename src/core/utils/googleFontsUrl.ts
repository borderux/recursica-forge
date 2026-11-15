/**
 * Font URLs come from imported JSON and user input, and are loaded as <link rel="stylesheet">.
 * A substring check ("includes fonts.googleapis.com") lets https://evil.example/x.css?fonts.googleapis.com
 * through, so parse the URL and compare the host exactly.
 */
export function isGoogleFontsCssUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'https:' && parsed.hostname === 'fonts.googleapis.com'
  } catch {
    return false
  }
}

/** Returns the URL when it is a Google Fonts stylesheet URL, otherwise undefined. */
export function safeGoogleFontsUrl(url: unknown): string | undefined {
  return isGoogleFontsCssUrl(url) ? url.trim() : undefined
}
