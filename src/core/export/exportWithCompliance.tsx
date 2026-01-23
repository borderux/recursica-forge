/**
 * Export with AA Compliance Check
 * 
 * Wrapper component that checks AA compliance before allowing export.
 */

import { useState } from 'react'
import { checkAACompliance } from './aaComplianceCheck'
import { ComplianceModal } from './ComplianceModal'
import { ExportSelectionModal } from './ExportSelectionModal'
import { downloadJsonFiles } from './jsonExport'

export function useJsonExport() {
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [showComplianceModal, setShowComplianceModal] = useState(false)
  const [complianceIssues, setComplianceIssues] = useState<ReturnType<typeof checkAACompliance>>([])
  const [pendingExportFiles, setPendingExportFiles] = useState<{ tokens: boolean; brand: boolean; uikit: boolean; css: boolean } | null>(null)
  
  const handleExport = () => {
    // Show selection modal first
    setShowSelectionModal(true)
  }
  
  const handleSelectionConfirm = (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => {
    setShowSelectionModal(false)
    setPendingExportFiles(files)
    
    // Check compliance before exporting JSON files (CSS export is independent)
    // Only check if at least one JSON file is selected
    const hasJsonFiles = files.tokens || files.brand || files.uikit
    const issues = hasJsonFiles ? checkAACompliance() : []
    
    if (issues.length > 0) {
      setComplianceIssues(issues)
      setShowComplianceModal(true)
    } else {
      // No issues, proceed with export (CSS will be exported independently)
      downloadJsonFiles(files).catch((error) => {
        console.error('Export failed:', error)
        alert(`Export failed: ${error instanceof Error ? error.message : 'Failed to export files. Please check the console for details.'}`)
      })
      setPendingExportFiles(null)
    }
  }
  
  const handleSelectionCancel = () => {
    setShowSelectionModal(false)
  }
  
  const handleAcknowledge = () => {
    setShowComplianceModal(false)
    if (pendingExportFiles) {
      downloadJsonFiles(pendingExportFiles).catch((error) => {
        console.error('Export failed:', error)
        alert(`Export failed: ${error instanceof Error ? error.message : 'Failed to export files. Please check the console for details.'}`)
      })
      setPendingExportFiles(null)
    }
  }
  
  const handleCancel = () => {
    setShowComplianceModal(false)
    setComplianceIssues([])
    setPendingExportFiles(null)
  }
  
  return {
    handleExport,
    showSelectionModal,
    showComplianceModal,
    complianceIssues,
    handleSelectionConfirm,
    handleSelectionCancel,
    handleAcknowledge,
    handleCancel,
  }
}

export function ExportComplianceModal({
  show,
  issues,
  onAcknowledge,
  onCancel,
}: {
  show: boolean
  issues: ReturnType<typeof checkAACompliance>
  onAcknowledge: () => void
  onCancel: () => void
}) {
  if (!show) return null
  
  return <ComplianceModal issues={issues} onAcknowledge={onAcknowledge} onCancel={onCancel} />
}

export function ExportSelectionModalWrapper({
  show,
  onConfirm,
  onCancel,
}: {
  show: boolean
  onConfirm: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
  onCancel: () => void
}) {
  return <ExportSelectionModal show={show} onExport={onConfirm} onCancel={onCancel} />
}

