/**
 * GitHub Service
 *
 * Handles GitHub API interactions for exporting files to GitHub repositories
 * via pull requests. Authentication is obtained via GitHub OAuth; see RECURSICA_API_GITHUB_OAUTH.md.
 */

const STORAGE_KEY = 'rf:github:auth'

export interface GitHubAuth {
  accessToken: string
  tokenType: 'Bearer'
  storedAt: number
}

export interface GitHubUser {
  login: string
  name?: string
  avatar_url?: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  default_branch: string
  private: boolean
}

export interface GitHubPullRequest {
  number: number
  html_url: string
  title: string
}

export interface GitHubFileContent {
  content: string
  encoding: 'base64' | 'utf-8'
  sha?: string
}

/**
 * Stores GitHub authentication token in localStorage
 */
export function storeAuth(auth: GitHubAuth): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  } catch (error) {
    throw new Error('Failed to store GitHub authentication')
  }
}

/**
 * Retrieves GitHub authentication token from localStorage
 */
export function getStoredAuth(): GitHubAuth | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const auth = JSON.parse(stored) as GitHubAuth
    return auth
  } catch {
    return null
  }
}

/**
 * Removes GitHub authentication token from localStorage
 */
export function clearAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore errors
  }
}


/**
 * Validates a GitHub token by fetching the authenticated user
 */
export async function validateToken(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid or expired token')
    }
    throw new Error(`GitHub API error: ${response.statusText}`)
  }

  return response.json() as Promise<GitHubUser>
}

/**
 * Gets the authenticated user's information
 */
export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  return validateToken(token)
}

/**
 * Lists repositories accessible to the authenticated user
 */
export async function getUserRepositories(token: string): Promise<GitHubRepository[]> {
  const repos: GitHubRepository[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid or expired token')
      }
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const pageRepos = (await response.json()) as GitHubRepository[]
    if (pageRepos.length === 0) break

    repos.push(...pageRepos)

    // If we got fewer than perPage, we're done
    if (pageRepos.length < perPage) break
    page++
  }

  return repos
}

/**
 * Gets repository information by owner and repo name
 */
export async function getRepository(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubRepository> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found`)
    }
    throw new Error(`GitHub API error: ${response.statusText}`)
  }

  return response.json() as Promise<GitHubRepository>
}

/**
 * Gets the SHA of the latest commit on a branch
 */
async function getBranchSha(token: string, owner: string, repo: string, branch: string): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Branch ${branch} not found`)
    }
    throw new Error(`GitHub API error: ${response.statusText}`)
  }

  const data = (await response.json()) as { object: { sha: string } }
  return data.object.sha
}

/**
 * Creates a new branch from a base branch
 */
export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string
): Promise<void> {
  const baseSha = await getBranchSha(token, owner, repo, baseBranch)

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    if (response.status === 422 && error.message?.includes('already exists')) {
      // Branch already exists, that's okay - we'll update it
      return
    }
    throw new Error(`Failed to create branch: ${error.message || response.statusText}`)
  }
}

/**
 * Gets the SHA of a file if it exists
 */
async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    // 404 is expected for new files - return null silently
    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const data = (await response.json()) as GitHubFileContent
    return data.sha || null
  } catch (error) {
    // Handle network errors or other issues
    // If it's a 404-related error, return null (file doesn't exist)
    if (error instanceof TypeError || (error instanceof Error && error.message.includes('404'))) {
      return null
    }
    throw error
  }
}

/**
 * Creates or updates a file in a repository
 */
export async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  branch: string,
  message: string
): Promise<void> {
  const existingSha = await getFileSha(token, owner, repo, path, branch)

  // Encode content as base64
  const base64Content = btoa(unescape(encodeURIComponent(content)))

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: base64Content,
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to create/update file: ${error.message || response.statusText}`)
  }
}

/**
 * Creates a pull request
 */
export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<GitHubPullRequest> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to create pull request: ${error.message || response.statusText}`)
  }

  return response.json() as Promise<GitHubPullRequest>
}
