// Runs before analytics on every page load. On the GitHub OAuth callback it moves the token out
// of the address bar into sessionStorage, so the token never reaches Google Analytics page_view
// data or browser history. AuthCallbackPage then reads it from there.
(function () {
  if (window.location.pathname !== '/auth/callback') return
  var query = new URLSearchParams(window.location.search)
  var hash = new URLSearchParams(window.location.hash.slice(1))
  var token = hash.get('access_token') || query.get('access_token')
  var error = query.get('error') || hash.get('error')
  if (token) {
    try {
      sessionStorage.setItem('recursica_oauth_callback', JSON.stringify({ accessToken: token }))
    } catch (e) {
      // AuthCallbackPage shows a sign-in error when the token is missing.
    }
  }
  window.history.replaceState(
    window.history.state,
    '',
    '/auth/callback' + (error ? '?error=' + encodeURIComponent(error) : ''),
  )
})()
