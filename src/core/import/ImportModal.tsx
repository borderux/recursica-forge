/**
 * Import Modal Component
 *
 * Multi-step modal for importing files locally or from GitHub.
 */

import { useState, useEffect } from "react";
import { Modal } from "../../components/adapters/Modal";
import { Button } from "../../components/adapters/Button";
import { TextField } from "../../components/adapters/TextField";
import { FileUpload } from "../../components/adapters/FileUpload";
import type { FileUploadItem } from "../../components/adapters/FileUpload";
import { SegmentedControl } from "../../components/adapters/SegmentedControl";
import { Dropdown } from "../../components/adapters/Dropdown";
import type { DropdownItem } from "../../components/adapters/Dropdown";
import {
  getStoredAuth,
  clearAuth,
  getAuthenticatedUser,
  getUserRepositories,
  getRepository,
  getFileContent,
  SANDBOX_ENTRY,
  isSandboxRepo,
  type GitHubUser,
  type RepositoryOption,
} from "../export/githubService";
import { startGitHubOAuth } from "../export/githubOAuth";
import { iconNameToReactComponent } from "../../modules/components/iconUtils";
import {
  EXPORT_FILENAME_TOKENS,
  EXPORT_FILENAME_BRAND,
  EXPORT_FILENAME_UIKIT,
} from "../export/EXPORT_FILENAMES";
import { detectJsonFileType } from "./jsonImport";

const IMPORT_MODE_STORAGE_KEY = "rf:import:preferredMode";

type ImportMode = "local" | "github";
type GitHubStep = "auth" | "repositories" | "fetch-files";

interface ImportModalProps {
  show: boolean;
  onClose: () => void;
  onFileSelect: (files: FileList | null) => void;
  onGithubFilesFetched: (importFiles: any, fileNames: string[]) => void;
  selectedFileNames: string[];
  onImportClick: () => void;
  onClearFiles: () => void;
}

export function ImportModal({
  show,
  onClose,
  onFileSelect,
  onGithubFilesFetched,
  selectedFileNames,
  onImportClick,
  onClearFiles,
}: ImportModalProps) {
  const [mode, setMode] = useState<ImportMode>("local");

  // Local state
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);

  // GitHub state
  const [githubStep, setGithubStep] = useState<GitHubStep>("auth");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepositoryOption | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialization
  useEffect(() => {
    if (show) {
      const storedMode = localStorage.getItem(
        IMPORT_MODE_STORAGE_KEY,
      ) as ImportMode;
      if (storedMode === "local" || storedMode === "github") {
        setMode(storedMode);
      }

      setGithubStep("auth");
      setUser(null);
      setRepositories([]);
      setSelectedRepo(null);
      setError(null);

      const storedAuth = getStoredAuth();
      if (storedAuth) {
        setToken(storedAuth.accessToken);
        validateAndLoadUser(storedAuth.accessToken);
      }
    } else {
      setUploadedFiles([]);
    }
  }, [show]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode as ImportMode);
    localStorage.setItem(IMPORT_MODE_STORAGE_KEY, newMode);
    onClearFiles();
    setUploadedFiles([]);
    setError(null);
  };

  // GitHub Logic
  const validateAndLoadUser = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await getAuthenticatedUser(authToken);
      setUser(userData);
      setGithubStep("repositories");
      await loadRepositories(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate token");
      clearAuth();
      setToken("");
      setGithubStep("auth");
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
    setGithubStep("auth");
    setError(null);
    onClearFiles();
  };

  const handleRepoSelect = async (repo: RepositoryOption) => {
    setSelectedRepo(repo);
    setGithubStep("fetch-files");
    setLoading(true);
    setError(null);
    onClearFiles();

    try {
      const authToken = token || getStoredAuth()?.accessToken;
      if (!authToken) throw new Error("No authentication token available");

      const fileNamesToTry = [
        EXPORT_FILENAME_TOKENS,
        "tokens.json",
        EXPORT_FILENAME_BRAND,
        "brand.json",
        EXPORT_FILENAME_UIKIT,
        "uikit.json",
      ];

      const owner = repo.owner.login;
      const repoName = repo.name;
      const branch = repo.default_branch;

      const importFiles: any = {};
      const foundNames: string[] = [];

      for (const fileName of fileNamesToTry) {
        try {
          const content = await getFileContent(
            authToken,
            owner,
            repoName,
            fileName,
            branch,
          );
          if (content) {
            const json = JSON.parse(content);
            const type = detectJsonFileType(json);
            if (type && !importFiles[type]) {
              importFiles[type] = json;
              foundNames.push(fileName);
            }
          }
        } catch (err) {
          // ignore individual file fetch/parse errors
        }
      }

      if (Object.keys(importFiles).length === 0) {
        setError(
          `No valid Recursica JSON files found in the root of ${repo.full_name}`,
        );
      } else {
        onGithubFilesFetched(importFiles, foundNames);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch files from repository",
      );
    } finally {
      setLoading(false);
    }
  };

  const FolderIcon = iconNameToReactComponent("file-text");
  const GithubIcon = iconNameToReactComponent("stack"); // fallback for github if no github icon available

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title='Import Design Tokens'
      layer='layer-1'
      size='md'
      primaryActionLabel='Import'
      onPrimaryAction={onImportClick}
      primaryActionDisabled={selectedFileNames.length === 0 || loading}
      onSecondaryAction={onClose}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--recursica_brand_dimensions_general_md)",
        }}
      >
        <SegmentedControl
          items={[
            {
              value: "local",
              label: "Local Files",
              icon: FolderIcon ? (
                <FolderIcon style={{ width: 16, height: 16 }} />
              ) : undefined,
            },
            {
              value: "github",
              label: "GitHub",
              icon: GithubIcon ? (
                <GithubIcon style={{ width: 16, height: 16 }} />
              ) : undefined,
            },
          ]}
          value={mode}
          onChange={handleModeChange}
          fullWidth
          layer='layer-1'
        />

        {mode === "local" && (
          <div style={{ marginTop: "8px" }}>
            <FileUpload
              label='JSON File(s)'
              helpText='recursica_tokens.json, recursica_brand.json, and/or recursica_ui-kit.json only'
              accept='application/json,.json'
              multiple
              layer='layer-1'
              layout='stacked'
              disableTopBottomMargin
              files={uploadedFiles}
              onUpload={(files: File[]) => {
                const dt = new DataTransfer();
                files.forEach((f) => dt.items.add(f));
                onFileSelect(dt.files);
                setUploadedFiles(
                  files.map((f, i) => ({
                    id: `file-${i}`,
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    status: "success" as const,
                  })),
                );
              }}
              onRemove={(fileId: string) => {
                const updated = uploadedFiles.filter((f) => f.id !== fileId);
                setUploadedFiles(updated);

                // If we removed a file, we need to pass the remaining files back to onFileSelect
                // But FileUpload doesn't easily let us get the actual File objects back
                // For simplicity, we just clear everything and rely on the parent state
                onClearFiles();
              }}
            />
          </div>
        )}

        {mode === "github" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "150px",
              marginTop: "8px",
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
              {githubStep === "auth" && (
                <>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: "14px" }}>
                    Authenticate with GitHub to import design tokens directly
                    from a repository.
                  </p>
                  {error && (
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor:
                          "var(--recursica_brand_themes_light_palettes_palette_2_danger_color_tone, #fee)",
                        color: "#c00",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      {error}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "24px",
                    }}
                  >
                    <Button
                      variant='outline'
                      onClick={handleAuthLogin}
                      disabled={loading}
                    >
                      {loading ? "Starting..." : "Login to GitHub"}
                    </Button>
                  </div>
                </>
              )}

              {githubStep === "repositories" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: "8px",
                    }}
                  >
                    {user && (
                      <Button
                        variant='outline'
                        size='small'
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    )}
                  </div>

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

              {githubStep === "fetch-files" && selectedRepo && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                      {selectedRepo.owner.login}/{selectedRepo.name}
                    </div>
                    <Button
                      variant='text'
                      size='small'
                      onClick={() => {
                        setGithubStep("repositories");
                        setError(null);
                      }}
                      disabled={loading}
                    >
                      Change Repo
                    </Button>
                  </div>

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
                      <div style={{ marginBottom: "16px", fontSize: "14px" }}>
                        Scanning repository for recursively exported design
                        tokens...
                      </div>
                    </div>
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
                  ) : (
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor:
                          "var(--recursica_brand_themes_light_layers_layer-2_surface, rgba(0,0,0,0.02))",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ fontSize: "14px", marginBottom: "12px" }}>
                        Found {selectedFileNames.length} file(s) to import:
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "20px",
                          fontSize: "14px",
                        }}
                      >
                        {selectedFileNames.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                      <div
                        style={{
                          marginTop: "16px",
                          fontSize: "14px",
                          opacity: 0.8,
                        }}
                      >
                        Click <strong>Import</strong> to continue.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
