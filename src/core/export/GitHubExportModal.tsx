/**
 * GitHub Export Modal Component
 * 
 * Multi-step modal for exporting files to GitHub via pull request:
 * 1. Authentication (OAuth)
 * 2. Repository selection
 * 3. PR creation
 */

import { useState, useEffect } from 'react'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { TextField } from '../../components/adapters/TextField'
import {
  getStoredAuth,
  storeAuth,
  clearAuth,
  validateToken,
  getAuthenticatedUser,
  getUserRepositories,
  getRepository,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  SANDBOX_ENTRY,
  isSandboxRepo,
  type GitHubAuth,
  type GitHubUser,
  type GitHubRepository,
  type GitHubPullRequest,
  type RepositoryOption,
} from './githubService'
import { startGitHubOAuth } from './githubOAuth'
import { API_ENDPOINTS } from './auth'
import {
  exportTokensJson,
  exportBrandJson,
  exportUIKitJson,
  exportCssStylesheet,
} from './jsonExport'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'

interface GitHubExportModalProps {
  show: boolean
  selectedFiles: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }
  onCancel: () => void
  onSuccess?: (prUrl: string) => void
}

type Step = 'auth' | 'repositories' | 'create-pr' | 'success'

export function GitHubExportModal({
  show,
  selectedFiles,
  onCancel,
  onSuccess,
}: GitHubExportModalProps) {
  const { mode } = useThemeMode()
  const [step, setStep] = useState<Step>('auth')
  const [token, setToken] = useState('')
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [repositories, setRepositories] = useState<RepositoryOption[]>([])
  const [selectedRepo, setSelectedRepo] = useState<RepositoryOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPr, setCreatedPr] = useState<GitHubPullRequest | null>(null)
  const [manualRepoUrl, setManualRepoUrl] = useState('')
  const [showManualUrlInput, setShowManualUrlInput] = useState(false)

  // Check for existing auth on mount
  useEffect(() => {
    if (show) {
      const storedAuth = getStoredAuth()
      if (storedAuth) {
        setToken(storedAuth.accessToken)
        validateAndLoadUser(storedAuth.accessToken)
      } else {
        setStep('auth')
        setUser(null)
        setRepositories([])
        setSelectedRepo(null)
        setError(null)
      }
    }
  }, [show])

  const validateAndLoadUser = async (authToken: string) => {
    setLoading(true)
    setError(null)
    try {
      const userData = await getAuthenticatedUser(authToken)
      setUser(userData)
      setStep('repositories')
      await loadRepositories(authToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate token')
      clearAuth()
      setToken('')
      setStep('auth')
    } finally {
      setLoading(false)
    }
  }

  const loadRepositories = async (authToken: string) => {
    setLoading(true)
    setError(null)
    try {
      const repos = await getUserRepositories(authToken)
      const sorted = [...repos].sort((a, b) => a.full_name.localeCompare(b.full_name))
      setRepositories([SANDBOX_ENTRY, ...sorted])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await startGitHubOAuth()
      // On success we redirect away; only reach here if authorize call failed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate authentication')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    setToken('')
    setUser(null)
    setRepositories([])
    setSelectedRepo(null)
    setStep('auth')
    setError(null)
  }

  const generateBranchName = (username: string): string => {
    const now = new Date()
    // Format: YYYYMMDDHHMMSS (no dashes, condensed)
    const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    return `recursica/${username}-${timestamp}`
  }

  const generatePRTitle = (): string => {
    return 'Export Recursica Design Tokens'
  }

  const generatePRDescription = (): string => {
    const fileList: string[] = []
    if (selectedFiles.tokens) fileList.push('tokens.json')
    if (selectedFiles.brand) fileList.push('brand.json')
    if (selectedFiles.uikit) fileList.push('uikit.json')
    if (selectedFiles.css) {
      fileList.push('recursica-variables-specific.css')
      fileList.push('recursica-variables-scoped.css')
    }
    return `This PR exports the following Recursica design token files:\n\n${fileList.map(f => `- ${f}`).join('\n')}`
  }

  const handleRepoSelect = (repo: RepositoryOption) => {
    setSelectedRepo(repo)
    setStep('create-pr')
  }

  // Automatically create PR when step changes to 'create-pr'
  useEffect(() => {
    if (step === 'create-pr' && selectedRepo && user && !loading && !createdPr && !error) {
      handleCreatePR()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const handleCreatePR = async () => {
    if (!selectedRepo || !user) return

    setLoading(true)
    setError(null)

    try {
      const authToken = token || getStoredAuth()?.accessToken
      if (!authToken) {
        throw new Error('No authentication token available')
      }

      // Generate file contents (shared by GitHub and sandbox flows)
      const files: Array<{ path: string; content: string }> = []

      if (selectedFiles.tokens) {
        const tokens = exportTokensJson()
        files.push({
          path: 'tokens.json',
          content: JSON.stringify(tokens, null, 2),
        })
      }

      if (selectedFiles.brand) {
        const brand = exportBrandJson()
        files.push({
          path: 'brand.json',
          content: JSON.stringify(brand, null, 2),
        })
      }

      if (selectedFiles.uikit) {
        const uikit = exportUIKitJson()
        files.push({
          path: 'uikit.json',
          content: JSON.stringify(uikit, null, 2),
        })
      }

      if (selectedFiles.css) {
        const cssExports = exportCssStylesheet({ specific: true, scoped: true })
        if (cssExports.specific) {
          files.push({
            path: 'recursica-variables-specific.css',
            content: cssExports.specific,
          })
        }
        if (cssExports.scoped) {
          files.push({
            path: 'recursica-variables-scoped.css',
            content: cssExports.scoped,
          })
        }
      }

      if (isSandboxRepo(selectedRepo)) {
        const filesRecord: Record<string, string> = Object.fromEntries(files.map((f) => [f.path, f.content]))
        const title = generatePRTitle()
        const description = generatePRDescription()
        const response = await fetch(API_ENDPOINTS.sandboxCreatePr, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: filesRecord, description, title }),
        })
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error || response.statusText)
        }
        const data = (await response.json()) as { prUrl: string; prNumber: number }
        setCreatedPr({ number: data.prNumber, html_url: data.prUrl, title })
        return
      }

      const [owner, repo] = selectedRepo.full_name.split('/')
      const branchName = generateBranchName(user.login)
      const baseBranch = selectedRepo.default_branch

      await createBranch(authToken, owner, repo, branchName, baseBranch)

      for (const file of files) {
        await createOrUpdateFile(
          authToken,
          owner,
          repo,
          file.path,
          file.content,
          branchName,
          `Add ${file.path}`
        )
      }

      const pr = await createPullRequest(
        authToken,
        owner,
        repo,
        generatePRTitle(),
        generatePRDescription(),
        branchName,
        baseBranch
      )

      setCreatedPr(pr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pull request')
    } finally {
      setLoading(false)
    }
  }

  const parseRepositoryUrl = (url: string): { owner: string; repo: string } | null => {
    try {
      // Handle various GitHub URL formats:
      // https://github.com/owner/repo
      // https://github.com/owner/repo.git
      // github.com/owner/repo
      // owner/repo
      const cleanUrl = url.trim().replace(/\.git$/, '')
      let match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) {
        // Try owner/repo format
        match = cleanUrl.match(/^([^\/]+)\/([^\/]+)$/)
      }
      if (match) {
        return { owner: match[1], repo: match[2] }
      }
      return null
    } catch {
      return null
    }
  }

  const handleManualRepoSubmit = async () => {
    const parsed = parseRepositoryUrl(manualRepoUrl)
    if (!parsed) {
      setError('Invalid repository URL. Please use format: owner/repo or https://github.com/owner/repo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const authToken = token || getStoredAuth()?.accessToken
      if (!authToken) {
        throw new Error('No authentication token available')
      }

      // Fetch repository info from GitHub to get the default branch
      const repoInfo = await getRepository(authToken, parsed.owner, parsed.repo)
      handleRepoSelect(repoInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository information')
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'success') {
          onCancel()
        }
      }}
    >
      <div
        style={{
          backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
          color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
          border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
          borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
          padding: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding)`,
          maxWidth: '600px',
          width: '90%',
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Auth Step */}
          {step === 'auth' && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: '16px' }}>
                Login to GitHub
              </h2>
              <p style={{ marginBottom: '20px', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-low-emphasis)`, fontSize: '14px' }}>
                You need to authenticate with your GitHub account. You will be redirected to GitHub and then back here.
              </p>
              {error && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', fontSize: '14px' }}>
                  {error}
                </div>
              )}
            </>
          )}

          {/* Repositories Step */}
          {step === 'repositories' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Select Repository</h2>
                {user && (
                  <a
                    href={`https://github.com/${user.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '14px',
                      color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    {user.login}
                  </a>
                )}
              </div>
              {error && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', fontSize: '14px' }}>
                  {error}
                </div>
              )}
              {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-low-emphasis)` }}>
                  Loading repositories...
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '8px', fontSize: '14px', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)` }}>
                    Select your repository from the list below
                  </div>
                  <div style={{ height: '120px', overflowY: 'auto', marginBottom: '12px', border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`, borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)` }}>
                    {repositories.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-low-emphasis)` }}>
                        No repositories available
                      </div>
                    ) : (
                      repositories.map((repo) => {
                        const StarIcon = iconNameToReactComponent('star')
                        const isSandbox = isSandboxRepo(repo)
                        const label = isSandbox ? repo.name : `${repo.owner.login} / ${repo.name}`
                        return (
                          <button
                            key={repo.id}
                            onClick={() => handleRepoSelect(repo)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              textAlign: 'left',
                              border: 'none',
                              borderBottom: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
                              borderRadius: 0,
                              backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-surface)`,
                              color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                              cursor: 'pointer',
                              fontSize: '14px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = `var(--recursica-brand-themes-${mode}-layer-layer-2-property-surface)`
                            }}
                          >
                            {isSandbox && StarIcon ? <StarIcon size={16} style={{ flexShrink: 0 }} /> : null}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                  {!showManualUrlInput ? (
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <button
                        onClick={() => setShowManualUrlInput(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                          cursor: 'pointer',
                          fontSize: '14px',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Don't see your repository in the list, press here
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Enter Repository URL
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <TextField
                          value={manualRepoUrl}
                          onChange={(e) => setManualRepoUrl(e.target.value)}
                          placeholder="https://github.com/owner/repo or owner/repo"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleManualRepoSubmit()
                            }
                          }}
                          style={{ flex: 1, fontSize: '14px' }}
                          layer="layer-3"
                        />
                        <button
                          onClick={handleManualRepoSubmit}
                          disabled={!manualRepoUrl.trim()}
                          style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                            backgroundColor: !manualRepoUrl.trim() ? '#ccc' : '#24292e',
                            color: 'white',
                            cursor: !manualRepoUrl.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Use URL
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Create PR Step */}
          {step === 'create-pr' && selectedRepo && user && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: '16px' }}>
                Create Pull Request
              </h2>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)` }}>
                  <div style={{ marginBottom: '16px', fontSize: '18px' }}>Creating pull request...</div>
                  <div style={{ width: '40px', height: '40px', border: `4px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`, borderTop: `4px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                </div>
              ) : createdPr ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '14px' }}>
                    Pull request created successfully!
                  </div>
                  <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <a
                      href={createdPr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        // Call onSuccess when user clicks the link to view the PR
                        if (onSuccess) {
                          onSuccess(createdPr.html_url)
                        }
                      }}
                      style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        backgroundColor: '#24292e',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                        fontSize: '16px',
                        fontWeight: '500',
                      }}
                    >
                      View Pull Request →
                    </a>
                  </div>
                </>
              ) : error ? (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', fontSize: '14px' }}>
                  {error}
                </div>
              ) : null}
            </>
          )}

          {/* Success Step */}
          {step === 'success' && createdPr && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#28a745' }}>
                Pull Request Created!
              </h2>
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '14px' }}>
                Your pull request has been successfully created.
              </div>
              <div style={{ marginBottom: '20px' }}>
                <a
                  href={createdPr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#24292e',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                    fontSize: '14px',
                  }}
                >
                  View Pull Request →
                </a>
              </div>
            </>
          )}
        </div>
        <div style={{ borderTop: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`, paddingTop: '12px', marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {step === 'auth' && (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
                  borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                  backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
                  color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthLogin}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                  backgroundColor: loading ? '#ccc' : '#24292e',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {loading ? (
                  'Starting...'
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    Login to Github
                  </>
                )}
              </button>
            </>
          )}
          {step === 'repositories' && (
            <>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
                  borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                  backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
                  color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
              <button
                onClick={onCancel}
                style={{
                  padding: '8px 16px',
                  border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
                  borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                  backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
                  color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          )}
          {step === 'create-pr' && (
            <>
              {!createdPr && (
                <button
                  onClick={() => setStep('repositories')}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
                    borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                    backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
                    color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Back
                </button>
              )}
              <button
                onClick={onCancel}
                style={{
                  padding: '8px 16px',
                  border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
                  borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                  backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
                  color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          )}
          {step === 'success' && (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                backgroundColor: '#24292e',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
