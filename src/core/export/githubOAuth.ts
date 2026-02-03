/**
 * GitHub OAuth flow (generic) — see RECURSICA_API_GITHUB_OAUTH.md.
 * Starts the flow by calling authorize and redirecting the user to GitHub.
 */

const API_BASE = import.meta.env.VITE_RECURSICA_API_URL ?? 'https://api.recursica.com'
const APP_ID = 'forge'

function getBaseUrl(): string {
  if (!API_BASE) {
    throw new Error(
      'VITE_RECURSICA_API_URL environment variable is not set. Please configure this in your environment or .env file.'
    )
  }
  return API_BASE
}

/**
 * Full URL of the page that receives the user after OAuth (with token or error).
 * Must match server-allowed redirect_uri patterns.
 */
export function getRedirectUri(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return `${window.location.origin}/auth/callback`
}

/**
 * Starts the GitHub OAuth flow: POST authorize, then redirect user to authUrl.
 * The server derives the callback URL from the host you call. Does not redirect if the authorize call fails; throws with a message for the UI.
 */
export async function startGitHubOAuth(): Promise<void> {
  const redirectUri = getRedirectUri()

  const response = await fetch(`${getBaseUrl()}/api/github/oauth/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: APP_ID,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { message?: string; error?: string }
    throw new Error(err.message ?? err.error ?? `HTTP ${response.status}`)
  }

  const { authUrl } = (await response.json()) as { authUrl: string }
  window.location.href = authUrl
}

/**
 * Error codes the server may send on the callback redirect (query param `error`).
 */
export const GITHUB_OAUTH_ERROR = {
  ACCESS_DENIED: 'access_denied',
  EXCHANGE_FAILED: 'exchange_failed',
} as const

export function getOAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case GITHUB_OAUTH_ERROR.ACCESS_DENIED:
      return 'GitHub sign-in was cancelled or denied. You can try again.'
    case GITHUB_OAUTH_ERROR.EXCHANGE_FAILED:
      return "We couldn't complete sign-in. Please try again."
    default:
      return 'Something went wrong. Please try again.'
  }
}
