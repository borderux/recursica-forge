/**
 * Import with Dirty Data Detection
 * 
 * Hook that manages JSON file import with dirty data detection and warning.
 */

import { useState } from 'react'
import { detectDirtyData, detectJsonFileType, importJsonFiles } from './jsonImport'
import { DirtyDataModal } from './DirtyDataModal'
import { validateTokensJson, validateBrandJson, validateUIKitJson } from '../utils/validateJsonSchemas'
import type { JsonLike } from '../resolvers/tokens'

export interface ImportFiles {
  tokens?: object
  brand?: object
  uikit?: object
}

export function useJsonImport() {
  const [showDirtyModal, setShowDirtyModal] = useState(false)
  const [filesToImport, setFilesToImport] = useState<string[]>([])
  const [pendingImport, setPendingImport] = useState<ImportFiles | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<ImportFiles>({})
  
  const setSelectedFilesData = (files: ImportFiles) => {
    setSelectedFiles(files)
  }
  
  const executeImport = (files: ImportFiles, onSuccess?: () => void) => {
    try {
      // Validate JSON files
      if (files.tokens) {
        validateTokensJson(files.tokens as JsonLike)
      }
      if (files.brand) {
        validateBrandJson(files.brand as JsonLike)
      }
      if (files.uikit) {
        validateUIKitJson(files.uikit as JsonLike)
      }
      
      // Determine which files are being imported
      const fileNames: string[] = []
      if (files.tokens) fileNames.push('tokens.json')
      if (files.brand) fileNames.push('brand.json')
      if (files.uikit) fileNames.push('uikit.json')
      
      // Check for dirty data
      const hasDirtyData = detectDirtyData()
      
      if (hasDirtyData && fileNames.length > 0) {
        // Show warning modal
        setFilesToImport(fileNames)
        setPendingImport(files)
        setShowDirtyModal(true)
      } else {
        // No dirty data, proceed with import
        importJsonFiles(files)
        if (onSuccess) onSuccess()
      }
    } catch (error) {
      console.error('Import validation failed:', error)
      alert(`Import failed: ${error instanceof Error ? error.message : 'Invalid JSON file(s)'}`)
    }
  }
  
  const handleImport = (onSuccess?: () => void) => {
    executeImport(selectedFiles, onSuccess)
  }
  
  const handleAcknowledge = (onSuccess?: () => void) => {
    setShowDirtyModal(false)
    if (pendingImport) {
      importJsonFiles(pendingImport)
      setPendingImport(null)
      if (onSuccess) onSuccess()
    }
  }
  
  const handleCancel = () => {
    setShowDirtyModal(false)
    setPendingImport(null)
    setFilesToImport([])
  }
  
  const clearSelectedFiles = () => {
    setSelectedFiles({})
  }
  
  return {
    selectedFiles,
    setSelectedFiles: setSelectedFilesData,
    handleImport,
    showDirtyModal,
    filesToImport,
    handleAcknowledge,
    handleCancel,
    clearSelectedFiles,
  }
}

export function ImportDirtyDataModal({
  show,
  filesToImport,
  onAcknowledge,
  onCancel,
}: {
  show: boolean
  filesToImport: string[]
  onAcknowledge: () => void
  onCancel: () => void
}) {
  if (!show) return null
  
  return <DirtyDataModal filesToImport={filesToImport} onAcknowledge={onAcknowledge} onCancel={onCancel} />
}

/**
 * Processes uploaded files and detects their types
 */
export async function processUploadedFilesAsync(files: FileList | null): Promise<ImportFiles> {
  const result: ImportFiles = {}
  
  if (!files || files.length === 0) return result
  
  const promises = Array.from(files).map(async (file) => {
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const fileType = detectJsonFileType(json)
      
      if (fileType === 'tokens') {
        result.tokens = json
      } else if (fileType === 'brand') {
        result.brand = json
      } else if (fileType === 'uikit') {
        result.uikit = json
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error)
    }
  })
  
  await Promise.all(promises)
  return result
}

