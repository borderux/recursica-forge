/**
 * GitHub Export Modal Component
 *
 * Multi-step modal for exporting files to GitHub via pull request:
 * 1. Authentication (OAuth)
 * 2. Repository selection
 * 3. PR creation
 * 4. Success
 */

import { useState, useEffect } from "react";
import { Modal } from "../../components/adapters/Modal";
import { Button } from "../../components/adapters/Button";
import { TextField } from "../../components/adapters/TextField";
import { Dropdown } from "../../components/adapters/Dropdown";
import type { DropdownItem } from "../../components/adapters/Dropdown";
import {
  getStoredAuth,
  clearAuth,
  getAuthenticatedUser,
  getUserRepositories,
  getRepository,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  SANDBOX_ENTRY,
  isSandboxRepo,
  type GitHubUser,
  type GitHubPullRequest,
  type RepositoryOption,
} from "./githubService";
import { startGitHubOAuth } from "./githubOAuth";
import { API_ENDPOINTS } from "./auth";
import {
  exportTokensJson,
  exportBrandJson,
  exportUIKitJson,
} from "./jsonExport";
import { recursicaJsonTransform as recursicaJsonTransformSpecific } from "./recursicaJsonTransformSpecific";
import { recursicaJsonTransform as recursicaJsonTransformScoped } from "./recursicaJsonTransformScoped";
import {
  EXPORT_FILENAME_TOKENS,
  EXPORT_FILENAME_BRAND,
  EXPORT_FILENAME_UIKIT,
  EXPORT_FILENAME_CSS_SPECIFIC,
  EXPORT_FILENAME_CSS_SCOPED,
} from "./EXPORT_FILENAMES";
import { iconNameToReactComponent } from "../../modules/components/iconUtils";

interface GitHubExportModalProps {
  show: boolean;
  selectedFiles: {
    tokens: boolean;
    brand: boolean;
    uikit: boolean;
    css: boolean;
  };
  onCancel: () => void;
  onSuccess?: (prUrl: string) => void;
}

type Step = "auth" | "repositories" | "create-pr" | "success";

export function GitHubExportModal({
  show,
  selectedFiles,
  onCancel,
  onSuccess,
}: GitHubExportModalProps) {
  const [step, setStep] = useState<Step>("auth");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepositoryOption | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPr, setCreatedPr] = useState<GitHubPullRequest | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    if (show) {
      const storedAuth = getStoredAuth();
      if (storedAuth) {
        setToken(storedAuth.accessToken);
        validateAndLoadUser(storedAuth.accessToken);
      } else {
        setStep("auth");
        setUser(null);
        setRepositories([]);
        setSelectedRepo(null);
        setError(null);
      }
    }
  }, [show]);

  const validateAndLoadUser = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await getAuthenticatedUser(authToken);
      setUser(userData);
      setStep("repositories");
      await loadRepositories(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate token");
      clearAuth();
      setToken("");
      setStep("auth");
    } finally {
      setLoading(false);
    }
  };

  const loadRepositories = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const repos = await getUserRepositories(authToken);
      const sorted = [...repos].sort((a, b) =>
        a.full_name.localeCompare(b.full_name),
      );
      setRepositories([SANDBOX_ENTRY, ...sorted]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load repositories",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuthLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await startGitHubOAuth();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate authentication",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setToken("");
    setUser(null);
    setRepositories([]);
    setSelectedRepo(null);
    setStep("auth");
    setError(null);
  };

  const generateBranchName = (username: string): string => {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    return `recursica/${username}-${timestamp}`;
  };

  const generatePRTitle = (): string => "Export Recursica Design Tokens";

  const generatePRDescription = (): string => {
    const fileList: string[] = [];
    if (selectedFiles.tokens) fileList.push(EXPORT_FILENAME_TOKENS);
    if (selectedFiles.brand) fileList.push(EXPORT_FILENAME_BRAND);
    if (selectedFiles.uikit) fileList.push(EXPORT_FILENAME_UIKIT);
    if (selectedFiles.css) {
      fileList.push(EXPORT_FILENAME_CSS_SPECIFIC);
      fileList.push(EXPORT_FILENAME_CSS_SCOPED);
    }
    return `This PR exports the following Recursica design token files:\n\n${fileList
      .map((f) => `- ${f}`)
      .join("\n")}`;
  };

  const handleRepoSelect = (repo: RepositoryOption) => {
    setSelectedRepo(repo);
    setStep("create-pr");
  };

  useEffect(() => {
    if (
      step === "create-pr" &&
      selectedRepo &&
      user &&
      !loading &&
      !createdPr &&
      !error
    ) {
      handleCreatePR();
    }
  }, [step]);

  const handleCreatePR = async () => {
    if (!selectedRepo || !user) return;
    setLoading(true);
    setError(null);
    try {
      const authToken = token || getStoredAuth()?.accessToken;
      if (!authToken) throw new Error("No authentication token available");

      const files: Array<{ path: string; content: string }> = [];
      if (selectedFiles.tokens) {
        const tokens = exportTokensJson();
        files.push({
          path: EXPORT_FILENAME_TOKENS,
          content: JSON.stringify(tokens, null, 2),
        });
      }
      if (selectedFiles.brand) {
        const brand = exportBrandJson();
        files.push({
          path: EXPORT_FILENAME_BRAND,
          content: JSON.stringify(brand, null, 2),
        });
      }
      if (selectedFiles.uikit) {
        const uikit = exportUIKitJson();
        files.push({
          path: EXPORT_FILENAME_UIKIT,
          content: JSON.stringify(uikit, null, 2),
        });
      }
      if (selectedFiles.css) {
        const json = {
          tokens: exportTokensJson(),
          brand: exportBrandJson(),
          uikit: exportUIKitJson(),
        } as Parameters<typeof recursicaJsonTransformSpecific>[0];
        const [specificFile] = recursicaJsonTransformSpecific(json);
        const [scopedFile] = recursicaJsonTransformScoped(json);
        files.push({
          path: specificFile.filename,
          content: specificFile.contents,
        });
        files.push({ path: scopedFile.filename, content: scopedFile.contents });
      }

      if (isSandboxRepo(selectedRepo)) {
        const filesRecord: Record<string, string> = Object.fromEntries(
          files.map((f) => [f.path, f.content]),
        );
        const title = generatePRTitle();
        const description = generatePRDescription();
        const response = await fetch(API_ENDPOINTS.sandboxCreatePr, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ files: filesRecord, description, title }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error || response.statusText);
        }
        const data = (await response.json()) as {
          prUrl: string;
          prNumber: number;
        };
        setCreatedPr({ number: data.prNumber, html_url: data.prUrl, title });
        return;
      }

      const [owner, repo] = selectedRepo.full_name.split("/");
      const branchName = generateBranchName(user.login);
      const baseBranch = selectedRepo.default_branch;
      await createBranch(authToken, owner, repo, branchName, baseBranch);
      for (const file of files) {
        await createOrUpdateFile(
          authToken,
          owner,
          repo,
          file.path,
          file.content,
          branchName,
          `Add ${file.path}`,
        );
      }
      const pr = await createPullRequest(
        authToken,
        owner,
        repo,
        generatePRTitle(),
        generatePRDescription(),
        branchName,
        baseBranch,
      );
      setCreatedPr(pr);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create pull request",
      );
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case "auth":
        return "Login to GitHub";
      case "repositories":
        return "Select Repository";
      case "create-pr":
        return "Create Pull Request";
      case "success":
        return "Pull Request Created!";
      default:
        return "Export to GitHub";
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={() => {
        if (step !== "success") onCancel();
      }}
      title={getModalTitle()}
      showFooter={false}
      layer='layer-3'
      size='md'
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "400px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {step === "auth" && (
            <>
              <p style={{ margin: 0, opacity: 0.7, fontSize: "14px" }}>
                You need to authenticate with your GitHub account. You will be
                redirected to GitHub and then back here.
              </p>
              {error && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fee",
                    color: "#c00",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}
            </>
          )}

          {step === "repositories" && (
            <>
              {user && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "8px",
                  }}
                >
                  <Button variant='outline' size='small' onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              )}
              {error && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fee",
                    color: "#c00",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}
              {loading ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.7,
                  }}
                >
                  Loading repositories...
                </div>
              ) : (
                <>
                  {repositories.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        opacity: 0.5,
                        border:
                          "1px solid var(--modal-border-color, rgba(0,0,0,0.1))",
                        borderRadius: "var(--modal-border-radius)",
                      }}
                    >
                      No repositories available
                    </div>
                  ) : (
                    <Dropdown
                      label='Select Repository'
                      placeholder='Choose a repository...'
                      layer='layer-1'
                      items={repositories.map((repo): DropdownItem => {
                        const StarIcon = iconNameToReactComponent("star");
                        const isSandbox = isSandboxRepo(repo);
                        const label = isSandbox
                          ? "Recursica Sandbox (come play around)"
                          : `${repo.owner.login} / ${repo.name}`;
                        return {
                          value: repo.id.toString(),
                          label: label,
                          leadingIcon:
                            isSandbox && StarIcon ? (
                              <StarIcon style={{ width: 16, height: 16 }} />
                            ) : undefined,
                          leadingIconType: isSandbox ? "icon" : "none",
                        };
                      })}
                      onChange={(val) => {
                        const repo = repositories.find(
                          (r) => r.id.toString() === val,
                        );
                        if (repo) handleRepoSelect(repo);
                      }}
                      mantine={{
                        styles: {
                          dropdown: {
                            maxHeight:
                              "calc(var(--recursica_component_menu_item_min_height, 36px) * 5.5)",
                            overflowY: "auto",
                          },
                        },
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}

          {step === "create-pr" && selectedRepo && user && (
            <>
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px",
                  }}
                >
                  <div style={{ marginBottom: "16px", fontSize: "18px" }}>
                    Creating pull request...
                  </div>
                  <div
                    className='spinner'
                    style={{
                      width: "40px",
                      height: "40px",
                      border: `4px solid var(--modal-border-color)`,
                      borderTop: `4px solid currentColor`,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              ) : createdPr ? (
                <>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#d4edda",
                      color: "#155724",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    Pull request created successfully!
                  </div>
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Button
                      variant='outline'
                      onClick={() => {
                        window.open(createdPr.html_url, "_blank");
                        if (onSuccess) onSuccess(createdPr.html_url);
                      }}
                    >
                      View Pull Request →
                    </Button>
                  </div>
                </>
              ) : error ? (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fee",
                    color: "#c00",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              ) : null}
            </>
          )}

          {step === "success" && createdPr && (
            <>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                Your pull request has been successfully created.
              </div>
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <Button
                  variant='outline'
                  onClick={() => window.open(createdPr.html_url, "_blank")}
                >
                  View Pull Request →
                </Button>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--modal-border-color)",
            paddingTop: "16px",
            marginTop: "16px",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          {step === "auth" && (
            <>
              <Button variant='text' onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant='solid'
                onClick={handleAuthLogin}
                disabled={loading}
                style={{ backgroundColor: "#24292e", color: "white" }}
              >
                {loading ? "Starting..." : "Login to GitHub"}
              </Button>
            </>
          )}
          {step === "repositories" && (
            <>
              <Button variant='text' onClick={handleLogout} disabled={loading}>
                Logout
              </Button>
              <Button variant='text' onClick={onCancel}>
                Cancel
              </Button>
            </>
          )}
          {step === "create-pr" && (
            <>
              {!createdPr && (
                <Button
                  variant='text'
                  onClick={() => setStep("repositories")}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button variant='text' onClick={onCancel}>
                Cancel
              </Button>
            </>
          )}
          {step === "success" && (
            <Button
              variant='solid'
              onClick={onCancel}
              style={{ backgroundColor: "#24292e", color: "white" }}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
