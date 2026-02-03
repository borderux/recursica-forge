# Generic GitHub OAuth — Developer Guide

This guide is for app developers integrating with the **generic GitHub OAuth flow** on the Recursica server. Use it to obtain a GitHub access token in your app (e.g. Forge, or other recursica.com apps). It does not cover the plugin-specific OAuth flow.

**Base URL:** Use the server’s API base URL for your environment:
- **Production:** `https://api.recursica.com`
- **Development:** `https://dev-api.recursica.com`

Replace the base URL in all examples below with the one that matches your environment.

---

## Overview

1. Your app calls **POST /api/github/oauth/authorize** with `app` and `redirect_uri`.
2. The server derives the callback URL from the request (the host you called) and returns a GitHub authorize URL; you redirect the user to it.
3. The user approves (or denies) on GitHub; GitHub redirects to the server's callback.
4. The server exchanges the code for a token and redirects the user to **your** `redirect_uri` with either the token or an error in the query string.

Your app's job is to: (a) start the flow by calling authorize and redirecting to `authUrl`, and (b) handle the callback by reading `access_token` or `error` on the page that lives at `redirect_uri`.

---

## 1. Starting the OAuth flow

**Endpoint:** `POST /api/github/oauth/authorize`  
**Content-Type:** `application/json`

**Request body:**

| Field           | Required | Description |
|-----------------|----------|-------------|
| `app`           | Yes      | Your app's identifier (e.g. `"forge"`). Must be registered on the server. |
| `redirect_uri`  | Yes      | Full URL of the page in your app that will receive the user after OAuth (with token or error). Must match the server's allowed patterns (e.g. `https://forge.recursica.com/auth/callback`). |

**Callback URL:** The server derives it from the request host. When you call `https://api.recursica.com/api/github/oauth/authorize`, the callback URL is `https://api.recursica.com/api/github/callback`; when you call `https://dev-api.recursica.com/...`, it is `https://dev-api.recursica.com/api/github/callback`. You do not send it. Register both callback URLs in your GitHub OAuth App (Settings → Developer settings → OAuth Apps → your app → Authorization callback URL).

**Example (start "Sign in with GitHub"):**

Use the API base URL for your environment (prod or dev). The server derives the callback URL from the host you call. Your `redirect_uri` is the page in your app that will receive the user after OAuth (e.g. `/auth/callback`).

```javascript
// Use the API base URL for your environment (e.g. from env var)
const API_BASE = import.meta.env?.VITE_RECURSICA_API_URL ?? "https://api.recursica.com"; // dev: https://dev-api.recursica.com
const REDIRECT_URI = "https://forge.recursica.com/auth/callback"; // your app page that will receive the user after OAuth

const response = await fetch(`${API_BASE}/api/github/oauth/authorize`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    app: "forge",
    redirect_uri: REDIRECT_URI,
  }),
});

if (!response.ok) {
  // Handle 400/500: invalid body, unknown app, redirect_uri not allowed, or app not configured
  const err = await response.json().catch(() => ({}));
  throw new Error(err.message ?? err.error ?? `HTTP ${response.status}`);
}

const { authUrl } = await response.json();
window.location.href = authUrl;  // send user to GitHub
```

**Possible errors from the authorize call:**

| Status | `error` (in JSON body) | Meaning |
|--------|------------------------|---------|
| 400    | `Invalid request body` | Missing or invalid `app` or `redirect_uri`. |
| 400    | `Invalid app`          | `app` is not in the server's registry. |
| 400    | `redirect_uri not allowed` | `redirect_uri` does not match the server's allowed pattern. |
| 400    | `callback_url not allowed` | The callback URL derived from the request host is not in the server's allowed list (wrong environment). |
| 500    | `App not configured`   | Server has no GitHub OAuth credentials for this app (env not set). |

Handle these in your UI (e.g. show a message or redirect to an error page). Do not redirect the user to GitHub if the authorize call fails.

---

## 2. Handling the callback (your `redirect_uri` page)

After the user completes (or cancels) the flow on GitHub, the server redirects the browser to **your** `redirect_uri` with query parameters. Your app must have a route/page that corresponds to `redirect_uri` and that reads these parameters.

**Success:** The server redirects to:

```
<redirect_uri>?access_token=<token>
```

If your `redirect_uri` already contains a query string, the server appends `&access_token=...`.

**Failure:** The server redirects to:

```
<redirect_uri>?error=<error_code>
```

Again, if `redirect_uri` already has query params, the server uses `&error=...`.

### Reading the result on your callback page

On the page that serves `redirect_uri` (e.g. `/auth/callback`):

1. Parse the URL query string (e.g. `URLSearchParams` in the browser, or your framework's router query).
2. If `access_token` is present, the flow succeeded. Store or use the token (e.g. in memory, secure storage, or send to your backend). Then redirect the user to the intended destination (e.g. dashboard) or show success.
3. If `error` is present, the flow failed. Handle the error code (see below) and show an appropriate message or redirect to an error page.

**Example (callback page logic):**

```javascript
// On your redirect_uri page (e.g. /auth/callback)
const params = new URLSearchParams(window.location.search);
const accessToken = params.get("access_token");
const error = params.get("error");

if (accessToken) {
  // Success: store token and send user onward
  yourAuthStore.setGitHubToken(accessToken);
  navigate("/dashboard");
} else if (error) {
  // Failure: handle error and optionally clear any partial state
  handleOAuthError(error);
  navigate("/auth/error");  // or show inline message
} else {
  // No token and no error: user may have landed here without going through OAuth
  navigate("/");
}
```

### Error codes from the callback redirect

When the server redirects to your `redirect_uri` with `?error=...`, the value is one of:

| `error` value      | Meaning |
|--------------------|--------|
| `access_denied`    | The user denied authorization on GitHub, or GitHub returned an error (e.g. `error` and optionally `error_description` in the callback). Treat as "user cancelled" or "GitHub denied." |
| `exchange_failed`  | The server failed to exchange the authorization code for a token (e.g. network or GitHub API error). The user did authorize; the failure is on the server side. You can ask the user to try again. |

**Example error handling:**

```javascript
function handleOAuthError(errorCode) {
  switch (errorCode) {
    case "access_denied":
      showMessage("GitHub sign-in was cancelled or denied. You can try again.");
      break;
    case "exchange_failed":
      showMessage("We couldn't complete sign-in. Please try again.");
      break;
    default:
      showMessage("Something went wrong. Please try again.");
  }
}
```

---

## 3. End-to-end error handling summary

| Where                | What can go wrong | What to do in your app |
|----------------------|-------------------|-------------------------|
| **Authorize request** | 400 + body with `error` / `message` | Don't redirect to GitHub. Show message or error page; fix `app`, `redirect_uri`, or `callback_url` if invalid. |
| **User on GitHub**   | User clicks "Cancel" or denies access | Server redirects to your `redirect_uri?error=access_denied`. On your callback page, read `error` and show "cancelled" or "denied." |
| **After user approves** | Token exchange fails on server | Server redirects to your `redirect_uri?error=exchange_failed`. On your callback page, read `error` and show "try again" or similar. |

Always implement the callback page so that:

- Success: you read `access_token`, store it (or use it), then navigate away or show success.
- Error: you read `error`, show or log a clear message, and optionally redirect to a dedicated error route.

---

## 4. Scope and token

The server requests the scopes needed by each app. For **Forge** (and any app that creates branches and pull requests), the server must request:

- **`read:user`** and **`user:email`** — to identify the user.
- **`repo`** — full read/write access to repositories (required to create branches, push commits, and open pull requests).

So the server should request **`read:user user:email repo`** for the `forge` app. After a successful flow, the token you receive is a GitHub OAuth access token; use it with the GitHub API (e.g. `Authorization: Bearer <access_token>`). The token is not stored on the Recursica server; your app is responsible for storing and using it.

---

## 5. Environments

- **Production:** Call `https://api.recursica.com/api/github/oauth/authorize`. The server uses callback URL `https://api.recursica.com/api/github/callback`.
- **Development:** Call `https://dev-api.recursica.com/api/github/oauth/authorize`. The server uses callback URL `https://dev-api.recursica.com/api/github/callback`.

In your GitHub OAuth App settings, add both callback URLs (prod and dev) so the same app works in both environments.

---

## 6. Quick reference

**Authorize:** `POST <baseUrl>/api/github/oauth/authorize`  
Body: `{ "app": "forge", "redirect_uri": "<your callback page URL>" }`  
The server derives the callback URL from the host you call. Response: `{ "authUrl": "..." }` → redirect user to `authUrl`.

**Your callback page (`redirect_uri`):**  
Read `access_token` → success (store token, navigate away); read `error` → show or handle `access_denied` / `exchange_failed`.

**You do not call** `/api/github/callback` yourself; GitHub redirects there. Your integration: (1) call authorize, (2) redirect user to `authUrl`, (3) handle the result on the page that matches your `redirect_uri` (read query params).

**Environment reference:**

| Environment | API base URL | Callback URL (derived by server) |
|-------------|--------------|-----------------------------------|
| Production  | `https://api.recursica.com` | `https://api.recursica.com/api/github/callback` |
| Development | `https://dev-api.recursica.com` | `https://dev-api.recursica.com/api/github/callback` |

Ensure your GitHub OAuth App has both callback URLs listed as Authorization callback URLs.
