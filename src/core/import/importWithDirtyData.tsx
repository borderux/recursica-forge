/**
 * Import with Dirty Data Detection
 *
 * Hook that manages JSON file import with dirty data detection and warning.
 */

import { useState } from "react";
import {
  detectDirtyData,
  detectJsonFileType,
  importJsonFiles,
} from "./jsonImport";
import { DirtyDataModal } from "./DirtyDataModal";
import {
  validateTokensJson,
  validateBrandJson,
  validateUIKitJson,
} from "../utils/validateJsonSchemas";
import type { JsonLike } from "../resolvers/tokens";
import JSZip from 'jszip';
import { isDiffSessionPending, consumeDiffSession } from '../dev/diffSession';
import { captureCurrentSnapshot, computeDiff, LOCAL_STORAGE_KEY } from '../dev/exportImportValidator';

export interface ImportFiles {
  tokens?: object;
  brand?: object;
  uikit?: object;
}

export function useJsonImport() {
  const [showDirtyModal, setShowDirtyModal] = useState(false);
  const [filesToImport, setFilesToImport] = useState<string[]>([]);
  const [pendingImport, setPendingImport] = useState<ImportFiles | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<ImportFiles>({});

  const setSelectedFilesData = (files: ImportFiles) => {
    setSelectedFiles(files);
  };

  const executeImport = (files: ImportFiles, onSuccess?: () => void) => {
    try {
      // Validate JSON files
      if (files.tokens) {
        validateTokensJson(files.tokens as JsonLike);
      }
      if (files.brand) {
        validateBrandJson(files.brand as JsonLike);
      }
      if (files.uikit) {
        validateUIKitJson(files.uikit as JsonLike);
      }

      // Determine which files are being imported
      const fileNames: string[] = [];
      if (files.tokens) fileNames.push("recursica_tokens.json");
      if (files.brand) fileNames.push("recursica_brand.json");
      if (files.uikit) fileNames.push("recursica_ui-kit.json");

      // Check for dirty data
      const hasDirtyData = detectDirtyData();

      if (hasDirtyData && fileNames.length > 0) {
        // Show warning modal
        setFilesToImport(fileNames);
        setPendingImport(files);
        setShowDirtyModal(true);
      } else {
        // No dirty data, proceed with import
        importJsonFiles(files);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      alert(
        `Import failed: ${
          error instanceof Error ? error.message : "Invalid JSON file(s)"
        }`,
      );
    }
  };

  const handleImport = (onSuccess?: () => void) => {
    executeImport(selectedFiles, () => {
      triggerDiffIfPending()
      if (onSuccess) onSuccess()
    })
  }

  const handleAcknowledge = (onSuccess?: () => void) => {
    setShowDirtyModal(false);
    if (pendingImport) {
      importJsonFiles(pendingImport);
      setPendingImport(null);
      triggerDiffIfPending()
      if (onSuccess) onSuccess();
    }
  };

  const handleCancel = () => {
    setShowDirtyModal(false);
    setPendingImport(null);
    setFilesToImport([]);
  };

  const clearSelectedFiles = () => {
    setSelectedFiles({});
  };

  return {
    selectedFiles,
    setSelectedFiles: setSelectedFilesData,
    handleImport,
    showDirtyModal,
    filesToImport,
    handleAcknowledge,
    handleCancel,
    clearSelectedFiles,
  };
}

export function ImportDirtyDataModal({
  show,
  filesToImport,
  onAcknowledge,
  onCancel,
}: {
  show: boolean;
  filesToImport: string[];
  onAcknowledge: () => void;
  onCancel: () => void;
}) {
  if (!show) return null;

  return (
    <DirtyDataModal
      filesToImport={filesToImport}
      onAcknowledge={onAcknowledge}
      onCancel={onCancel}
    />
  );
}

/**
 * If a diff session is pending (started via the Diff button), capture the
 * post-import snapshot, compute the diff, store it, and open the diff tab.
 */
function triggerDiffIfPending(): void {
  if (!isDiffSessionPending()) return

  // Small delay to let recomputeAndApplyAll settle after import
  setTimeout(() => {
    const sessionData = consumeDiffSession()
    if (!sessionData) return

    const importedSnapshot = captureCurrentSnapshot()

    const result = computeDiff(
      { ...sessionData.originalJson, css: sessionData.originalCss },
      // "exported" == the original state (what was downloaded) — same as original
      // because we don't re-randomise; we just check if import preserved everything
      { ...sessionData.originalJson, css: sessionData.originalCss },
      importedSnapshot,
    )



    // Store result for the diff tab
    if (typeof window !== 'undefined') {
      ;(window as any).__RECURSICA_ROUNDTRIP_DATA__ = result
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result))
    } catch { /* quota exceeded */ }

    window.open(window.location.origin + '/dev/diff', '_blank')
  }, 300)
}

/**
 * Processes uploaded files and detects their types.
 * Supports individual .json files and .zip archives containing json files.
 */
export async function processUploadedFilesAsync(
  files: FileList | null,
): Promise<ImportFiles> {
  const result: ImportFiles = {};

  if (!files || files.length === 0) return result;

  const processJson = (json: object) => {
    const fileType = detectJsonFileType(json)
    if (fileType === 'tokens') result.tokens = json
    else if (fileType === 'brand') result.brand = json
    else if (fileType === 'uikit') result.uikit = json
  }

  const promises = Array.from(files).map(async (file) => {
    try {
      if (file.name.endsWith('.zip') || file.type === 'application/zip') {
        // Extract JSON files from the zip archive
        const zip = await JSZip.loadAsync(file)
        const jsonPromises = Object.values(zip.files)
          .filter(entry => !entry.dir && entry.name.endsWith('.json'))
          .map(async (entry) => {
            try {
              const text = await entry.async('text')
              processJson(JSON.parse(text))
            } catch { /* skip malformed entries */ }
          })
        await Promise.all(jsonPromises)
      } else {
        const text = await file.text();
        processJson(JSON.parse(text))
      }
    } catch {
      // Skip malformed files
    }
  });

  await Promise.all(promises);
  return result;
}
