import { describe, it, expect, beforeEach } from 'vitest'
import { storeAuth, getStoredAuth, clearAuth } from './githubService'
import { consumeOAuthPending, takeCallbackToken } from './githubOAuth'

describe('GitHub token storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('keeps the token in sessionStorage, not localStorage', () => {
    storeAuth({ accessToken: 't', tokenType: 'Bearer', storedAt: Date.now() })
    expect(getStoredAuth()?.accessToken).toBe('t')
    expect(localStorage.getItem('recursica_github_auth')).toBeNull()
  })

  it('drops expired tokens', () => {
    storeAuth({ accessToken: 't', tokenType: 'Bearer', storedAt: Date.now() - 9 * 60 * 60 * 1000 })
    expect(getStoredAuth()).toBeNull()
  })

  it('removes tokens left in localStorage by older builds', () => {
    localStorage.setItem('recursica_github_auth', JSON.stringify({ accessToken: 'old', storedAt: Date.now() }))
    getStoredAuth()
    expect(localStorage.getItem('recursica_github_auth')).toBeNull()
    clearAuth()
  })
})

describe('OAuth callback checks', () => {
  beforeEach(() => sessionStorage.clear())

  it('rejects a callback this tab did not start', () => {
    expect(consumeOAuthPending()).toBe(false)
  })

  it('accepts a recent sign-in once', () => {
    sessionStorage.setItem('recursica_oauth_pending', String(Date.now()))
    expect(consumeOAuthPending()).toBe(true)
    expect(consumeOAuthPending()).toBe(false)
  })

  it('reads the stashed token once', () => {
    sessionStorage.setItem('recursica_oauth_callback', JSON.stringify({ accessToken: 'abc' }))
    expect(takeCallbackToken()).toBe('abc')
    expect(takeCallbackToken()).toBeNull()
  })
})
