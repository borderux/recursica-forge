/**
 * GitHub OAuth callback page.
 * Handles redirect from the Recursica server after GitHub OAuth with ?access_token=... or ?error=...
 * public/auth-callback.js has already moved the token out of the URL into sessionStorage.
 * See RECURSICA_API_GITHUB_OAUTH.md.
 */
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { storeAuth } from '../../core/export/githubService'
import {
  getOAuthErrorMessage,
  consumeOAuthPending,
  takeCallbackToken,
  GITHUB_OAUTH_ERROR,
} from '../../core/export/githubOAuth'

type CallbackResult = { accessToken: string | null; rejected: boolean }
let callbackResult: CallbackResult | null = null

/**
 * Reads the token once per page load (cached, because StrictMode runs initializers twice and the
 * read clears sessionStorage) and only accepts it when this tab started the sign-in.
 */
function readCallback(): CallbackResult {
  if (callbackResult) return callbackResult
  const accessToken = takeCallbackToken()
  if (!accessToken) callbackResult = { accessToken: null, rejected: false }
  else if (!consumeOAuthPending()) callbackResult = { accessToken: null, rejected: true }
  else callbackResult = { accessToken, rejected: false }
  return callbackResult
}

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [{ accessToken, rejected }] = useState(readCallback)
  const errorCode = rejected ? GITHUB_OAUTH_ERROR.NOT_STARTED_HERE : searchParams.get('error')

  useEffect(() => {
    if (accessToken) {
      storeAuth({
        accessToken,
        tokenType: 'Bearer',
        storedAt: Date.now(),
      })
      navigate('/tokens', { replace: true })
      return
    }

    if (errorCode) {
      // Stay on page and show error; user can use link to go back
      return
    }

    // No token and no error: user landed here without going through OAuth
    navigate('/', { replace: true })
  }, [accessToken, errorCode, navigate])

  if (accessToken) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        Sign-in successful. Redirecting…
      </div>
    )
  }

  if (errorCode) {
    const message = getOAuthErrorMessage(errorCode)
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>GitHub sign-in failed</h2>
        <p style={{ marginBottom: 24 }}>{message}</p>
        <Link to="/tokens">Back to Forge</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      Redirecting…
    </div>
  )
}
