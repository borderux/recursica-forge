/**
 * Collapses leading slashes and backslashes so a path can be passed to navigate() safely.
 * A link like forge.recursica.com//evil.com reaches the app with pathname "//evil.com", which
 * older react-router versions treat as a protocol-relative URL to another site.
 */
export function sameOriginPath(pathname: string): string {
  return '/' + pathname.replace(/^[/\\]+/, '')
}
