# Create-PR endpoint spec (api.recursica.com)

Spec for the create-PR endpoint at **api.recursica.com**. Recursica Theme Forge calls this endpoint when a user submits theme changes; the endpoint creates a branch and pull request in the target repo (e.g. recursica-sandbox) and assigns the user to the PR.

**Implemented** in this repo: path `/api/sandbox/create-pr`; env vars use `SANDBOX_*` prefix; see `functions/API.md` and deploy workflow for config.

---

## Purpose and context

- **Caller**: Recursica Theme Forge (user has connected to the target repo and edited Recursica JSON/files).
- **Trigger**: User submits changes in Theme Forge; Theme Forge sends the updated file contents to this API.
- **Result**: A new branch is created in the target repo, files are committed, a PR is opened (with optional description), and the authenticated user is assigned to the PR. CI (e.g. in recursica-sandbox) can then build Storybook and update the PR with a preview URL.

---

## Endpoint

- **Base URL**: `https://api.recursica.com` (dev: `https://dev-api.recursica.com` or equivalent)
- **Path**: `/api/sandbox/create-pr`
- **Method**: `POST`
- **Content-Type**: `application/json`

---

## Request

### Headers

| Header             | Required | Description                                                                 |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| `Authorization`    | Yes      | `Bearer <token>` where the token is a valid GitHub user token (e.g. OAuth access token). Used to identify the user for branch naming and PR assignment. |
| `Content-Type`     | Yes      | `application/json`                                                          |

### Body

JSON object:

| Field         | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `files`      | object | Yes      | Map of file path (key) to UTF-8 file content (string). **Flat paths only** (no `/`; no folders). **1–10 entries.** Each file ≤ 2 MB. Filenames are cleaned for special characters (alphanumeric, `_`, `-`, `.` only). Empty file content is rejected. |
| `description`| string | No       | Optional PR body/description. If provided, set as the PR body when creating the PR. |
| `title`      | string | No       | Optional PR title. Max 100 characters. Default: `Recursica tokens update`. |

Example:

```json
{
  "files": {
    "recursica.json": "{ \"project\": { \"name\": \"recursica-sandbox\" } }",
    "recursica-bundle.json": "...",
    "recursica.css": "..."
  },
  "description": "Theme updates from Theme Forge",
  "title": "My theme changes"
}
```

- **Body size**: Max request body **25 MB**; reject with **413** if exceeded.
- **Validation**: `files` required, non-empty, 1–10 entries. Each key must be flat (no `/`). Each value non-empty string, ≤ 2 MB. Optional `title` string, max 100 characters. Reject with **400** on failure.

---

## Response

### Success

- **Status**: `201 Created`
- **Body**:

```json
{
  "prUrl": "https://github.com/<owner>/<repo>/pull/123",
  "prNumber": 123
}
```

### Errors

| Status | When |
| ------ | ---- |
| `400` | Missing or invalid `files`; path contains `/`; empty file content; file count not 1–10; file exceeds 2 MB; invalid `description` or `title` type; title exceeds 100 characters. |
| `401` | Missing or invalid `Authorization`; token validation against GitHub failed. |
| `413` | Request body too large. |
| `429` | Rate limit exceeded for this user. Include `Retry-After` header (seconds). |
| `5xx` | Server or GitHub API error; return a clear message. |

Error body shape: `{ "error": "<message>" }`.

---

## Security

### 1. Authentication — valid GitHub account

- Require `Authorization: Bearer <token>` on every request.
- Validate the token by calling GitHub `GET https://api.github.com/user` with the token. If the request fails or returns non-2xx, reject with **401**.
- Use the authenticated user’s **login** and **id** from the GitHub response for:
  - Branch name: `sandbox/{safeUsername}_{unixEpoch}` (sanitize login: alphanumeric and `_` only; timestamp = Unix epoch in seconds).
  - PR assignment: assign this user to the created PR.
  - Rate limiting: key by GitHub user ID (or login).
- Do **not** accept or trust a user identifier in the request body; derive identity only from the token.

### 2. Rate limiting

- Limit per authenticated GitHub user (not per IP).
- **Implemented**: Firestore-backed; **5 requests per hour** per user by default; configurable via env (`SANDBOX_CREATE_PR_RATE_LIMIT_COUNT`, `SANDBOX_CREATE_PR_RATE_LIMIT_WINDOW_SECONDS`).
- When exceeded, return **429** and include a `Retry-After` header (seconds until the window resets).

---

## Server logic (step-by-step)

1. **Validate request**: Check `Authorization` header; validate token with GitHub `GET /user`. On failure → 401.
2. **Rate limit**: Check Firestore rate limit for the authenticated user. If exceeded → 429 with `Retry-After`.
3. **Validate body**: Ensure `files` is present, non-empty, 1–10 entries. Each key flat (no `/`). Each value non-empty string, ≤ 2 MB. Optional `description` and `title` must be strings if present; `title` max 100 characters. Clean filenames (alphanumeric, `_`, `-`, `.`). On failure → 400.
4. **Repo config**: Read target repo from env (`SANDBOX_GITHUB_REPO_OWNER`, `SANDBOX_GITHUB_REPO_NAME`); default branch (`SANDBOX_GITHUB_DEFAULT_BRANCH`, default `main`).
5. **GitHub App token**: Obtain an installation access token for the GitHub App (using `SANDBOX_GITHUB_APP_ID`, `SANDBOX_GITHUB_APP_PRIVATE_KEY`, `SANDBOX_GITHUB_APP_INSTALLATION_ID`).
6. **Create branch**: Get latest commit SHA of the default branch; create branch `refs/heads/sandbox/{safeUsername}_{unixEpoch}` (Unix epoch in seconds).
7. **Commit files**: For each entry in `files`, call GitHub createOrUpdateFileContents on the new branch (path = cleaned key, content = base64-encode(value)). One commit per file, sequential.
8. **Create PR**: Create a pull request (base = default branch, head = new branch). Set `title` from request `title` if provided (max 100 chars), else default "Recursica tokens update". Set `body` from request `description` if provided.
9. **Assign user**: Add assignees to the issue (PR) with the authenticated user’s login.
10. **Response**: Return 201 with `{ "prUrl": "<pr html url>", "prNumber": <number> }`.

---

## Repo configuration

- **Owner / repo**: From env `SANDBOX_GITHUB_REPO_OWNER`, `SANDBOX_GITHUB_REPO_NAME`.
- **Default branch**: From env `SANDBOX_GITHUB_DEFAULT_BRANCH` (default `main`).
- **Branch naming**: `sandbox/{safeUsername}_{unixEpoch}` (Unix epoch in seconds). Sanitize username: alphanumeric and `_` only.
- **PR title**: Optional request field; max 100 characters; default "Recursica tokens update".
- **Files**: Flat paths only (no `/`). Arbitrary filenames; cleaned to alphanumeric, `_`, `-`, `.`. 1–10 files, each ≤ 2 MB, no empty content.

---

## Environment variables

All Create-PR config uses the **SANDBOX_** prefix.

| Variable                               | Description                                      |
| -------------------------------------- | ------------------------------------------------ |
| `SANDBOX_GITHUB_APP_ID`                | GitHub App ID.                                   |
| `SANDBOX_GITHUB_APP_PRIVATE_KEY`       | GitHub App private key (PEM). Single line with `\n` for newlines in env/file. |
| `SANDBOX_GITHUB_APP_INSTALLATION_ID`   | Installation ID for the target repo.             |
| `SANDBOX_GITHUB_REPO_OWNER`            | Target repo owner (e.g. org or user).             |
| `SANDBOX_GITHUB_REPO_NAME`             | Target repo name (e.g. `recursica-sandbox`).     |
| `SANDBOX_GITHUB_DEFAULT_BRANCH`        | Optional; default `main`.                         |
| `SANDBOX_CREATE_PR_RATE_LIMIT_COUNT`   | Optional; default `5` (requests per window).     |
| `SANDBOX_CREATE_PR_RATE_LIMIT_WINDOW_SECONDS` | Optional; default `3600` (1 hour).        |

---

This document describes the implemented create-PR API. Code lives in this repo (`functions/src/sandbox/`, `functions/src/github/appToken.ts`); no API code for this endpoint lives in the target repo (e.g. recursica-sandbox).
