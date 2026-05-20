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
import { ImportValidationErrorModal } from "./ImportValidationErrorModal";
import { ImportValidationError } from "./importHydration";
import {
  validateTokensJson,
  validateBrandJson,
  validateUIKitJson,
} from "../utils/validateJsonSchemas";
import type { JsonLike } from "../resolvers/tokens";
import JSZip from 'jszip';

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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorNodes, setErrorNodes] = useState<string[]>([]);

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
      if (error instanceof ImportValidationError) {
        setErrorNodes(error.missingNodes);
        setShowErrorModal(true);
      } else {
        alert(
          `Import failed: ${
            error instanceof Error ? error.message : "Invalid JSON file(s)"
          }`,
        );
      }
    }
  };

  const handleImport = (onSuccess?: () => void) => {
    executeImport(selectedFiles, () => {
      if (onSuccess) onSuccess()
    })
  }

  const handleAcknowledge = (onSuccess?: () => void) => {
    setShowDirtyModal(false);
    if (pendingImport) {
      try {
        importJsonFiles(pendingImport);
        setPendingImport(null);
        if (onSuccess) onSuccess();
      } catch (error) {
        if (error instanceof ImportValidationError) {
          setErrorNodes(error.missingNodes);
          setShowErrorModal(true);
        } else {
          alert(
            `Import failed: ${
              error instanceof Error ? error.message : "Invalid JSON file(s)"
            }`,
          );
        }
      }
    }
  };

  const handleCancel = () => {
    setShowDirtyModal(false);
    setShowErrorModal(false);
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
    showErrorModal,
    errorNodes,
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

export function ImportErrorModal({
  show,
  missingNodes,
  onAcknowledge,
}: {
  show: boolean;
  missingNodes: string[];
  onAcknowledge: () => void;
}) {
  if (!show) return null;

  return (
    <ImportValidationErrorModal
      missingNodes={missingNodes}
      onAcknowledge={onAcknowledge}
    />
  );
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
