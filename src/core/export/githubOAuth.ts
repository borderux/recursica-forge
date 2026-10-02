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

/** URL of the Recursica API endpoint that opens a PR on the shared sandbox repo. */
export function getSandboxCreatePrUrl(): string {
  return `${getBaseUrl()}/api/sandbox/create-pr`
}

/**
 * Marks that this tab started a sign-in. The callback page only accepts a token when this mark
 * exists, so a link to /auth/callback?access_token=... from someone else cannot sign this browser
 * in as them. sessionStorage is per tab, which matches the same-tab OAuth redirect.
 */
const PENDING_KEY = 'recursica_oauth_pending'
const PENDING_MAX_AGE_MS = 15 * 60 * 1000

function markOAuthPending(): void {
  try {
    sessionStorage.setItem(PENDING_KEY, String(Date.now()))
  } catch {
    // Without sessionStorage the callback will reject the token; the user sees an error.
  }
}

/** Returns true (and clears the mark) when this tab started a sign-in in the last 15 minutes. */
export function consumeOAuthPending(): boolean {
  try {
    const startedAt = Number(sessionStorage.getItem(PENDING_KEY))
    sessionStorage.removeItem(PENDING_KEY)
    return Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < PENDING_MAX_AGE_MS
  } catch {
    return false
  }
}

/**
 * Key that public/auth-callback.js uses to hand the token to the app. That script runs before
 * analytics and removes the token from the address bar, so it never reaches page_view or history.
 */
const CALLBACK_TOKEN_KEY = 'recursica_oauth_callback'

/** Reads and removes the token the callback script stashed. */
export function takeCallbackToken(): string | null {
  try {
    const raw = sessionStorage.getItem(CALLBACK_TOKEN_KEY)
    sessionStorage.removeItem(CALLBACK_TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken?: unknown }
    return typeof parsed.accessToken === 'string' && parsed.accessToken ? parsed.accessToken : null
  } catch {
    return null
  }
}

const GITHUB_AUTHORIZE_PREFIX = 'https://github.com/login/oauth/authorize'

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

  const { authUrl } = (await response.json()) as { authUrl: unknown }
  if (typeof authUrl !== 'string' || !authUrl.startsWith(GITHUB_AUTHORIZE_PREFIX)) {
    throw new Error('Unexpected sign-in URL from server')
  }
  markOAuthPending()
  window.location.href = authUrl
}

/**
 * Error codes the server may send on the callback redirect (query param `error`).
 */
export const GITHUB_OAUTH_ERROR = {
  ACCESS_DENIED: 'access_denied',
  EXCHANGE_FAILED: 'exchange_failed',
  NOT_STARTED_HERE: 'not_started_here',
} as const

export function getOAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case GITHUB_OAUTH_ERROR.ACCESS_DENIED:
      return 'GitHub sign-in was cancelled or denied. You can try again.'
    case GITHUB_OAUTH_ERROR.EXCHANGE_FAILED:
      return "We couldn't complete sign-in. Please try again."
    case GITHUB_OAUTH_ERROR.NOT_STARTED_HERE:
      return 'This sign-in was not started from this tab, so it was ignored. Please sign in again from Forge.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
