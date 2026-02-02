/**
 * GitHub OAuth callback page.
 * Handles redirect from the Recursica server after GitHub OAuth with ?access_token=... or ?error=...
 * See RECURSICA_API_GITHUB_OAUTH.md.
 */
import { useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { storeAuth } from '../../core/export/githubService'
import { getOAuthErrorMessage } from '../../core/export/githubOAuth'

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const accessToken = searchParams.get('access_token')
  const errorCode = searchParams.get('error')

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
