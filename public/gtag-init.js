// Google Analytics setup. Kept in a file instead of an inline script so the
// Content-Security-Policy can allow scripts from 'self' only.
window.dataLayer = window.dataLayer || []
function gtag() {
  window.dataLayer.push(arguments)
}
gtag('js', new Date())
gtag('config', 'G-9FCDTBKPGV')
