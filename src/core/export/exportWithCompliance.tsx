/**
 * Export with AA Compliance Check
 * 
 * Wrapper component that checks AA compliance before allowing export.
 */

import { useState } from 'react'
import { checkAACompliance } from './aaComplianceCheck'
import { ComplianceModal } from './ComplianceModal'
import { ExportSelectionModal } from './ExportSelectionModal'
import { GitHubExportModal } from './GitHubExportModal'
import { downloadJsonFiles } from './jsonExport'

export function useJsonExport() {
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [showComplianceModal, setShowComplianceModal] = useState(false)
  const [showGitHubModal, setShowGitHubModal] = useState(false)
  const [complianceIssues, setComplianceIssues] = useState<ReturnType<typeof checkAACompliance>>([])
  const [pendingExportFiles, setPendingExportFiles] = useState<{ tokens: boolean; brand: boolean; uikit: boolean; css: boolean } | null>(null)
  const [githubExportFiles, setGithubExportFiles] = useState<{ tokens: boolean; brand: boolean; uikit: boolean; css: boolean } | null>(null)
  
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
      downloadJsonFiles(files).catch(console.error)
      setPendingExportFiles(null)
    }
  }
  
  const handleSelectionCancel = () => {
    setShowSelectionModal(false)
  }
  
  const handleAcknowledge = () => {
    setShowComplianceModal(false)
    if (pendingExportFiles) {
      downloadJsonFiles(pendingExportFiles).catch(console.error)
      setPendingExportFiles(null)
    }
  }
  
  const handleCancel = () => {
    setShowComplianceModal(false)
    setComplianceIssues([])
    setPendingExportFiles(null)
  }

  const handleExportToGithub = (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => {
    setShowSelectionModal(false)
    setGithubExportFiles(files)
    setShowGitHubModal(true)
  }

  const handleGitHubExportCancel = () => {
    setShowGitHubModal(false)
    setGithubExportFiles(null)
  }

  const handleGitHubExportSuccess = () => {
    setShowGitHubModal(false)
    setGithubExportFiles(null)
  }
  
  return {
    handleExport,
    showSelectionModal,
    showComplianceModal,
    showGitHubModal,
    complianceIssues,
    githubExportFiles,
    handleSelectionConfirm,
    handleSelectionCancel,
    handleAcknowledge,
    handleCancel,
    handleExportToGithub,
    handleGitHubExportCancel,
    handleGitHubExportSuccess,
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
  onExportToGithub,
}: {
  show: boolean
  onConfirm: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
  onCancel: () => void
  onExportToGithub?: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
}) {
  return <ExportSelectionModal show={show} onExport={onConfirm} onCancel={onCancel} onExportToGithub={onExportToGithub} />
}

export function GitHubExportModalWrapper({
  show,
  selectedFiles,
  onCancel,
  onSuccess,
}: {
  show: boolean
  selectedFiles: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean } | null
  onCancel: () => void
  onSuccess?: () => void
}) {
  if (!selectedFiles) return null
  return <GitHubExportModal show={show} selectedFiles={selectedFiles} onCancel={onCancel} onSuccess={onSuccess} />
}

