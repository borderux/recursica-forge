/**
 * Vite plugin that adds a Content-Security-Policy <meta> tag to the production index.html.
 *
 * GitHub Pages cannot send response headers, so the policy has to live in the page. It limits
 * where scripts, styles, fonts and requests can go, which blunts any injection bug. It is only
 * added to builds: the dev server injects inline scripts for hot reload.
 *
 * frame-ancestors is ignored in a <meta> tag, so clickjacking protection needs a real header.
 */

import type { Plugin } from 'vite'

export function contentSecurityPolicy(options: { apiOrigins: string[] }): Plugin {
  const fontCdns = ['https://unpkg.com', 'https://cdn.jsdelivr.net']
  const analytics = [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
  ]
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://www.googletagmanager.com'],
    // Emotion, Mantine and Carbon insert <style> elements at runtime.
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', ...fontCdns],
    // 1.www.s81c.com is IBM's CDN, which Carbon's styles use for IBM Plex.
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://1.www.s81c.com', ...fontCdns],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'connect-src': [
      "'self'",
      'https://api.github.com',
      'https://www.googleapis.com',
      ...options.apiOrigins,
      ...analytics,
    ],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${[...new Set(values)].join(' ')}`)
    .join('; ')

  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}
