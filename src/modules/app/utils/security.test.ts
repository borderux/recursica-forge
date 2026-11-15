import { describe, it, expect } from 'vitest'
import { redactSecrets } from './bugReport'
import { sameOriginPath } from './sameOriginPath'

describe('redactSecrets', () => {
  it('masks GitHub tokens, bearer headers and token query params', () => {
    const text = [
      'token ghp_abcdefghijklmnopqrstuvwxyz0123456789',
      'Authorization: Bearer gho_secretvalue123',
      'https://forge.recursica.com/auth/callback?access_token=abc123&x=1',
      '{"accessToken": "plain-secret"}',
    ].join('\n')
    const out = redactSecrets(text)
    expect(out).not.toContain('abcdefghijklmnopqrstuvwxyz')
    expect(out).not.toContain('secretvalue123')
    expect(out).not.toContain('abc123')
    expect(out).not.toContain('plain-secret')
    expect(out).toContain('x=1')
  })
})

describe('sameOriginPath', () => {
  it('collapses leading slashes and backslashes', () => {
    expect(sameOriginPath('//evil.com')).toBe('/evil.com')
    expect(sameOriginPath('/\\evil.com')).toBe('/evil.com')
    expect(sameOriginPath('/tokens')).toBe('/tokens')
  })
})
