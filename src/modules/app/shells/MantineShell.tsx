/**
 * MantineShell
 *
 * App frame using Mantine components; provides navigation, reset defaults,
 * and import/export of CSS variables.
 */
import { ReactNode, useEffect, useState, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import {
  AppShell,
  Group,
  MantineProvider,
  Modal as MantineModal,
  Tabs as MantineTabs,
} from "@mantine/core";
import { Tabs } from "../../../components/adapters/Tabs";
import { Dropdown } from "../../../components/adapters/Dropdown";
import { Modal } from "../../../components/adapters/Modal";
import "@mantine/core/styles.css";
import "./MantineShell.css";
import { iconNameToReactComponent } from "../../components/iconUtils";
import { clearOverrides } from "../../theme/tokenOverrides";
import tokensJson from "../../../../recursica_tokens.json";
import { useVars } from "../../vars/VarsContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { UiKit } from "../../uikit/UiKitContext";
import { useThemeMode } from "../../theme/ThemeModeContext";
import {
  useJsonExport,
  ExportComplianceModal,
  ExportSelectionModalWrapper,
  ExportValidationErrorModal,
  GitHubExportModalWrapper,
} from "../../../core/export/exportWithCompliance";
import {
  useJsonImport,
  ImportDirtyDataModal,
  processUploadedFilesAsync,
} from "../../../core/import/importWithDirtyData";
import { Button } from "../../../components/adapters/Button";
import { Tooltip } from "../../../components/adapters/Tooltip";
import { Switch } from "../../../components/adapters/Switch";
import { SegmentedControl } from "../../../components/adapters/SegmentedControl";
import type { SegmentedControlItem } from "../../../components/adapters/SegmentedControl";
import { ImportModal } from "../../../core/import/ImportModal";
import { Sidebar } from "../Sidebar";
import { ThemeSidebar } from "../ThemeSidebar";
import { ComponentsSidebar } from "../../preview/ComponentsSidebar";
import { getComponentCssVar } from "../../../components/utils/cssVarNames";
import { genericLayerProperty, genericLayerText, paletteCore } from "../../../core/css/cssVarBuilder";
import { createBugReport } from "../utils/bugReport";
import { useCompliance } from "../../../core/compliance/ComplianceContext";
import { randomizeAllVariables } from "../../../core/utils/randomizeVariables";
import { RandomizeOptionsModal } from "../../../core/utils/RandomizeOptionsModal";
import {
  getCssAuditAutoRun,
  setCssAuditAutoRun,
} from "../../../core/utils/cssAuditPreference";
import { runRoundTripValidation } from "../../../core/dev/exportImportValidator";

export default function MantineShell({
  children,
  kit,
  onKitChange,
}: {
  children: ReactNode;
  kit: UiKit;
  onKitChange: (k: UiKit) => void;
}) {
  const { resetAll } = useVars();
  const { mode, setMode } = useThemeMode();
  const { issueCount, runScan } = useCompliance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [showRandomizeModal, setShowRandomizeModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [cssAuditAutoRun, setCssAuditAutoRunState] = useState(() =>
    getCssAuditAutoRun(),
  );
  const {
    handleExport,
    showSelectionModal,
    showComplianceModal,
    showValidationModal,
    showGitHubModal,
    githubExportFiles,
    validationErrors,
    complianceIssues,
    handleSelectionConfirm,
    handleSelectionCancel,
    handleAcknowledge,
    handleCancel,
    handleValidationModalClose,
    handleExportToGithub,
    handleGitHubExportCancel,
    handleGitHubExportSuccess,
  } = useJsonExport();
  const {
    selectedFiles,
    setSelectedFiles,
    handleImport,
    showDirtyModal,
    filesToImport,
    handleAcknowledge: handleDirtyAcknowledge,
    handleCancel: handleDirtyCancel,
    clearSelectedFiles,
  } = useJsonImport();
  const handleRoundTripValidation = async () => {
    // Open window synchronously to bypass popup blockers
    const diffWindow = window.open('', '_blank')
    if (diffWindow) {
      diffWindow.document.write('<div style="font-family:sans-serif;padding:40px;text-align:center;">Running validation, please wait...</div>')
    }
    
    setIsValidating(true)
    try {
      await runRoundTripValidation()
      if (diffWindow) {
        diffWindow.location.href = '/dev/diff'
      }
    } catch (e) {
      if (diffWindow) {
        diffWindow.document.body.innerHTML = `
          <div style="font-family:sans-serif;padding:40px;color:#ef4444;background:#111827;height:100vh;">
            <h2>Diagnostic Engine Crashed</h2>
            <p>The validation pipeline threw an unhandled exception before the diff could be rendered.</p>
            <pre style="background:#000;padding:16px;overflow-x:auto;">${e instanceof Error ? e.stack || e.message : String(e)}</pre>
          </div>
        `
      }
      console.error(e)
    } finally {
      setIsValidating(false)
    }
  }

  const location = useLocation();
  const navigate = useNavigate();

  // Sync ?mode= query param on navigation — switches theme and cleans URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlMode = params.get('mode');
    if (urlMode && (urlMode === 'light' || urlMode === 'dark') && urlMode !== mode) {
      setMode(urlMode);
    }
    // Clean the mode param from the URL
    if (urlMode) {
      params.delete('mode');
      const cleanSearch = params.toString();
      navigate(location.pathname + (cleanSearch ? `?${cleanSearch}` : ''), { replace: true });
    }
  }, [location.search]);

  // Determine current route for navigation highlighting
  const currentRoute = useMemo(() => {
    if (location.pathname.startsWith("/tokens")) return "tokens";
    if (location.pathname.startsWith("/theme")) return "theme";
    if (location.pathname.startsWith("/components")) return "components";
    return "tokens";
  }, [location.pathname]);

  // Logo SVG
  const LogoIcon = () => (
    <svg
      width='65'
      height='44'
      viewBox='0 0 65 44'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M2.73689 0C1.22535 0 0 1.23486 0 2.75813V40.2687C0 41.792 1.22535 43.0269 2.73689 43.0269H61.3063C62.8178 43.0269 64.0431 41.792 64.0431 40.2687V2.75813C64.0431 1.23486 62.8178 0 61.3063 0H2.73689ZM4.10533 38.8628C4.10533 20.1314 18.8106 4.86124 37.2217 4.1372V38.8628H4.10533ZM45.4323 38.8628C42.4092 38.8628 39.9585 36.3931 39.9585 33.3465H45.4323V38.8628ZM59.8947 24.2447H39.9585V4.15383C50.6584 4.836 59.2177 13.4618 59.8947 24.2447ZM59.8674 27.0028C59.2296 33.2132 54.3317 38.1491 48.1692 38.7918V27.0028H59.8674ZM43.5165 27.0297C41.5515 27.0297 39.9585 28.635 39.9585 30.6153H43.5165V27.0297Z'
        fill={`var(--recursica_brand_palettes_palette-1_primary_color_tone)`}
      />
    </svg>
  );

  const onFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelectedFiles({});
      setSelectedFileNames([]);
      return;
    }

    try {
      // Process files and detect types
      const importFiles = await processUploadedFilesAsync(files);

      // Update selected files display
      const fileNames: string[] = [];
      if (importFiles.tokens) fileNames.push("recursica_tokens.json");
      if (importFiles.brand) fileNames.push("recursica_brand.json");
      if (importFiles.uikit) fileNames.push("recursica_ui-kit.json");
      setSelectedFileNames(fileNames);

      // Store files for import
      setSelectedFiles(importFiles);
    } catch (error) {
      console.error("Error processing files:", error);
      setSelectedFiles({});
      setSelectedFileNames([]);
    }
  };

  const handleImportClick = () => {
    handleImport(() => {
      // Close modal and clear selection on success
      setIsModalOpen(false);
      clearSelectedFiles();
      setSelectedFileNames([]);
    });
  };

  const handleGithubFilesFetched = (importFiles: any, fileNames: string[]) => {
    setSelectedFiles(importFiles);
    setSelectedFileNames(fileNames);
  };

  const handleDirtyAcknowledgeWithClose = () => {
    handleDirtyAcknowledge(() => {
      setIsModalOpen(false);
      clearSelectedFiles();
      setSelectedFileNames([]);
    });
  };

  const layer0Surface = genericLayerProperty(0, 'surface');
  const layer0TextColor = genericLayerText(0, 'color');
  const layer0TextHigh = genericLayerText(0, 'high-emphasis');
  const layer0TextLow = genericLayerText(0, 'low-emphasis');
  const showSidebar = location.pathname.startsWith("/tokens");
  const showThemeSidebar = location.pathname.startsWith("/theme");
  const headerRef = useRef<HTMLElement>(null);

  // Measure header height and set CSS variable
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        // Use getBoundingClientRect to get accurate height including borders
        const rect = headerRef.current.getBoundingClientRect();
        document.documentElement.style.setProperty(
          "--header-height",
          `${rect.height}px`,
        );
      }
    };
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      updateHeaderHeight();
    });
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [mode]);

  const isDevRoute = location.pathname === '/dev/diff' || location.pathname === '/dev/random';

  return (
    <MantineProvider>
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {!isDevRoute && (
        <header
          ref={headerRef}
          style={{
            backgroundColor: `var(${layer0Surface})`,
            paddingTop: "var(--recursica_brand_dimensions_general_lg)",
            paddingBottom: "var(--recursica_brand_dimensions_general_lg)",
            paddingLeft: "var(--recursica_brand_dimensions_general_xl)",
            paddingRight: "var(--recursica_brand_dimensions_general_xl)",
            height: "auto",
            flexShrink: 0,
          }}
        >
          <Group
            gap='var(--recursica_brand_dimensions_general_xl)'
            wrap='nowrap'
            style={{ width: "100%" }}
          >
            {/* Chunk 1: Logo and Brand */}
            <div
              style={{
                minWidth: "220px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Link
                to='/'
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--recursica_brand_dimensions_general_default)",
                  textDecoration: "none",
                }}
              >
                <LogoIcon />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.2,
                  }}
                >
                  <span
                    style={{
                      color: `var(${layer0TextColor})`,
                      opacity: `var(${layer0TextHigh})`,
                      fontWeight: 600,
                      fontSize:
                        "var(--recursica_brand_typography_body-font-size)",
                    }}
                  >
                    Recursica
                  </span>
                  <span
                    style={{
                      fontSize:
                        "var(--recursica_brand_typography_body-small-font-size)",
                      color: `var(${layer0TextColor})`,
                      opacity: `var(${layer0TextLow})`,
                    }}
                  >
                    Theme Forge
                  </span>
                </div>
              </Link>
            </div>

            {/* Chunk 2: Navigation Tabs */}
            <Tabs
              value={currentRoute}
              variant='pills'
              layer='layer-0'
              style={{ flex: 1 }}
              onChange={(value) => {
                if (value === "tokens") navigate("/tokens");
                else if (value === "theme") navigate("/theme");
                else if (value === "components") navigate("/components");
              }}
            >
              <MantineTabs.List>
                <MantineTabs.Tab value='tokens'>Tokens</MantineTabs.Tab>
                <MantineTabs.Tab value='theme'>
                  {issueCount > 0 ? (
                    <Tooltip label={`${issueCount} compliance ${issueCount === 1 ? 'issue' : 'issues'}`} withinPortal={true} position="bottom" mantine={{ offset: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {(() => {
                          const WarningIcon = iconNameToReactComponent("warning");
                          return WarningIcon ? (
                            <WarningIcon
                              style={{
                                width: 14,
                                height: 14,
                                color: `var(--recursica_brand_themes_${mode}_palettes_core_alert-tone)`,
                              }}
                            />
                          ) : null;
                        })()}
                        Theme
                      </span>
                    </Tooltip>
                  ) : (
                    <span>Theme</span>
                  )}
                </MantineTabs.Tab>
                <MantineTabs.Tab value='components'>Components</MantineTabs.Tab>
              </MantineTabs.List>
            </Tabs>

            {/* Chunk 3: Action Buttons and Framework Dropdown */}
            <div
              style={{
                display: "flex",
                gap: "var(--recursica_brand_dimensions_general_default)",
                alignItems: "center",
                marginLeft: "auto",
              }}
            >
              <Tooltip label='Reset all changes'>
                <Button
                  variant='outline'
                  size='small'
                  icon={(() => {
                    const RefreshIcon = iconNameToReactComponent("arrow-path");
                    return RefreshIcon ? (
                      <RefreshIcon
                        style={{
                          width:
                            "var(--recursica_brand_dimensions_icons_default)",
                          height:
                            "var(--recursica_brand_dimensions_icons_default)",
                        }}
                      />
                    ) : null;
                  })()}
                  onClick={() => setShowResetConfirm(true)}
                />
              </Tooltip>
              <Tooltip label='Import theme'>
                <Button
                  variant='outline'
                  size='small'
                  icon={(() => {
                    const UploadIcon =
                      iconNameToReactComponent("arrow-up-tray");
                    return UploadIcon ? (
                      <UploadIcon
                        style={{
                          width:
                            "var(--recursica_brand_dimensions_icons_default)",
                          height:
                            "var(--recursica_brand_dimensions_icons_default)",
                        }}
                      />
                    ) : null;
                  })()}
                  onClick={() => setIsModalOpen(true)}
                />
              </Tooltip>
              <Tooltip label='Export theme'>
                <Button
                  variant='outline'
                  size='small'
                  icon={(() => {
                    const DownloadIcon =
                      iconNameToReactComponent("arrow-down-tray");
                    return DownloadIcon ? (
                      <DownloadIcon
                        style={{
                          width:
                            "var(--recursica_brand_dimensions_icons_default)",
                          height:
                            "var(--recursica_brand_dimensions_icons_default)",
                        }}
                      />
                    ) : null;
                  })()}
                  onClick={() => handleExport(issueCount)}
                />
              </Tooltip>

              <Tooltip label='Report a bug'>
                <Button
                  variant='outline'
                  size='small'
                  icon={(() => {
                    const BugIcon = iconNameToReactComponent("bug");
                    return BugIcon ? (
                      <BugIcon
                        style={{
                          width:
                            "var(--recursica_brand_dimensions_icons_default)",
                          height:
                            "var(--recursica_brand_dimensions_icons_default)",
                        }}
                      />
                    ) : null;
                  })()}
                  onClick={() => createBugReport()}
                />
              </Tooltip>
              {process.env.NODE_ENV === "development" && (
                <>
                  <Tooltip label='Randomize all variables (dev only)'>
                    <Button
                      variant='outline'
                      size='small'
                      icon={(() => {
                        const ShuffleIcon = iconNameToReactComponent("shuffle");
                        return ShuffleIcon ? (
                          <ShuffleIcon
                            style={{
                              width:
                                "var(--recursica_brand_dimensions_icons_default)",
                              height:
                                "var(--recursica_brand_dimensions_icons_default)",
                            }}
                          />
                        ) : null;
                      })()}
                      onClick={() => setShowRandomizeModal(true)}
                    />
                  </Tooltip>
                  <Tooltip label='Export/Import validation (dev only)'>
                    <Button
                      variant='outline'
                      size='small'
                      disabled={isValidating}
                      icon={(() => {
                        const GitDiffIcon = iconNameToReactComponent('exclude')
                        return GitDiffIcon ? (
                          <GitDiffIcon
                            style={{
                              width: 'var(--recursica_brand_dimensions_icons_default)',
                              height: 'var(--recursica_brand_dimensions_icons_default)',
                              opacity: isValidating ? 0.5 : 1,
                            }}
                          />
                        ) : null
                      })()}
                      onClick={handleRoundTripValidation}
                    />
                  </Tooltip>
                  <Tooltip label='Auto-run CSS audit (dev only)'>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--recursica_brand_dimensions_general_sm)",
                      }}
                    >
                      <Switch
                        checked={cssAuditAutoRun}
                        onChange={(checked) => {
                          setCssAuditAutoRunState(checked);
                          setCssAuditAutoRun(checked);
                          // Trigger audit immediately when enabled
                          if (checked) {
                            setTimeout(() => {
                              import("../../../core/utils/runCssVarAudit").then(
                                ({ runCssVarAudit }) => {
                                  runCssVarAudit(false);
                                },
                              );
                            }, 500); // Small delay to ensure CSS vars are ready
                          }
                        }}
                        sizeVariant='small'
                      />
                    </div>
                  </Tooltip>
                </>
              )}
              <Dropdown
                value={kit}
                onChange={(v) => onKitChange((v as UiKit) ?? "mantine")}
                items={[
                  { label: "Mantine", value: "mantine" },
                  { label: "Material UI", value: "material" },
                  { label: "Carbon", value: "carbon" },
                ]}
                state='disabled'
                style={{ width: 180 }}
                layer='layer-0'
                disableTopBottomMargin={true}
              />
            </div>

            {/* Chunk 4: Theme Mode Segmented Control */}
            {(() => {
              const buttonBorderRadius = getComponentCssVar(
                "Button",
                "size",
                "border-radius",
                undefined,
              );
              const buttonSmallHeight = getComponentCssVar(
                "Button",
                "size",
                "small-height",
                undefined,
              );
              const buttonSmallMinWidth = getComponentCssVar(
                "Button",
                "size",
                "small-min-width",
                undefined,
              );
              const buttonSmallIcon = getComponentCssVar(
                "Button",
                "size",
                "small-icon",
                undefined,
              );
              const buttonSmallIconPadding = getComponentCssVar(
                "Button",
                "size",
                "small-icon-padding",
                undefined,
              );
              const buttonSolidBg = getComponentCssVar(
                "Button",
                "colors",
                "solid-background",
                "layer-0",
              );
              const buttonSolidText = getComponentCssVar(
                "Button",
                "colors",
                "solid-text",
                "layer-0",
              );
              const buttonTextBg = getComponentCssVar(
                "Button",
                "colors",
                "text-background",
                "layer-0",
              );
              const buttonTextText = getComponentCssVar(
                "Button",
                "colors",
                "text-text",
                "layer-0",
              );

              const SunIcon = iconNameToReactComponent("sun");
              const MoonIcon = iconNameToReactComponent("moon");
              const modeItems: SegmentedControlItem[] = [
                {
                  value: "light",
                  icon: SunIcon ? (
                    <SunIcon
                      style={{
                        width: `var(${buttonSmallIcon})`,
                        height: `var(${buttonSmallIcon})`,
                      }}
                    />
                  ) : undefined,
                  tooltip: "Light theme",
                },
                {
                  value: "dark",
                  icon: MoonIcon ? (
                    <MoonIcon
                      style={{
                        width: `var(${buttonSmallIcon})`,
                        height: `var(${buttonSmallIcon})`,
                      }}
                    />
                  ) : undefined,
                  tooltip: "Dark theme",
                },
              ];
              return (
                <SegmentedControl
                  items={modeItems}
                  value={mode}
                  onChange={(value) => setMode(value as "light" | "dark")}
                  orientation='horizontal'
                  fullWidth={false}
                  layer='layer-0'
                  componentNameForCssVars='SegmentedControl'
                />
              );
            })()}
          </Group>
        </header>
        )}
        {isDevRoute ? (
          <>{children}</>
        ) : (
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {showSidebar && <Sidebar />}
          {showThemeSidebar && <ThemeSidebar />}
          <main
            style={{
              flex: 1,
              minHeight: 0,
              backgroundColor: `var(${layer0Surface})`,
              color: `var(${layer0TextColor})`,
            }}
          >
            {children}
          </main>
        </div>
        )}
        <ImportModal
          show={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            clearSelectedFiles();
            setSelectedFileNames([]);
          }}
          onFileSelect={onFileSelect}
          onGithubFilesFetched={handleGithubFilesFetched}
          selectedFileNames={selectedFileNames}
          onImportClick={handleImportClick}
          onClearFiles={() => {
            clearSelectedFiles();
            setSelectedFileNames([]);
          }}
        />
        <ExportValidationErrorModal
          show={showValidationModal}
          errors={validationErrors}
          onClose={handleValidationModalClose}
        />
        <ExportSelectionModalWrapper
          show={showSelectionModal}
          onConfirm={handleSelectionConfirm}
          onCancel={handleSelectionCancel}
          onExportToGithub={handleExportToGithub}
        />
        <GitHubExportModalWrapper
          show={showGitHubModal}
          selectedFiles={githubExportFiles}
          onCancel={handleGitHubExportCancel}
          onSuccess={handleGitHubExportSuccess}
        />
        <ExportComplianceModal
          show={showComplianceModal}
          issues={complianceIssues}
          onAcknowledge={handleAcknowledge}
          onCancel={handleCancel}
        />
        {process.env.NODE_ENV === "development" && (
          <RandomizeOptionsModal
            show={showRandomizeModal}
            onRandomize={(options) => {
              randomizeAllVariables(options);
              setShowRandomizeModal(false);
            }}
            onCancel={() => setShowRandomizeModal(false)}
          />
        )}
        <ImportDirtyDataModal
          show={showDirtyModal}
          filesToImport={filesToImport}
          onAcknowledge={handleDirtyAcknowledgeWithClose}
          onCancel={handleDirtyCancel}
        />

        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={showResetConfirm}
          onClose={() => { if (!isResetting) setShowResetConfirm(false) }}
          title="Reset all changes"
          layer="layer-1"
          centered={true}
          zIndex={30000}
          showFooter={true}
          showSecondaryButton={true}
          secondaryActionLabel="Cancel"
          onSecondaryAction={() => setShowResetConfirm(false)}
          secondaryActionDisabled={isResetting}
          primaryActionLabel={isResetting ? 'Resetting…' : 'Reset'}
          primaryActionDisabled={isResetting}
          onPrimaryAction={() => {
            setIsResetting(true);
            window.dispatchEvent(new CustomEvent('complianceReset'));
            clearOverrides(tokensJson as any);
            resetAll();
            setTimeout(() => {
              runScan();
              setIsResetting(false);
              setShowResetConfirm(false);
            }, 1500);
          }}
          content="Are you sure you want to reset all changes? This will restore the theme to its default state."
        />
      </div>
    </MantineProvider>
  );
}
