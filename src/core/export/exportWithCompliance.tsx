/**
 * Export with Validation and AA Compliance Check
 * 
 * Wrapper component that validates JSON/CSS and checks AA compliance before allowing export.
 * Flow: Validate → Check AA Compliance → Show Export Modal
 */

import { useState } from 'react'
import { checkAACompliance } from './aaComplianceCheck'
import { ComplianceModal } from './ComplianceModal'
import { ExportSelectionModal } from './ExportSelectionModal'
import { ValidationErrorModal, ValidationError } from './ValidationErrorModal'
import { downloadJsonFiles } from './jsonExport'
import { exportTokensJson, exportBrandJson, exportUIKitJson } from './jsonExport'
import { validateTokensJson, validateBrandJson, validateUIKitJson } from '../utils/validateJsonSchemas'
import { validateCssExport } from './validateCss'
import type { JsonLike } from '../resolvers/tokens'

export function useJsonExport() {
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [showComplianceModal, setShowComplianceModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [complianceIssues, setComplianceIssues] = useState<ReturnType<typeof checkAACompliance>>([])
  const [pendingExportFiles, setPendingExportFiles] = useState<{ tokens: boolean; brand: boolean; uikit: boolean; cssSpecific: boolean; cssScoped: boolean } | null>(null)
  
  const handleExport = () => {
    // Step 1: Validate all JSON files and CSS
    const errors: ValidationError[] = []
    
    // Validate JSON files (always validate all, even if not exporting them)
    try {
      const tokens = exportTokensJson()
      validateTokensJson(tokens as JsonLike)
    } catch (error) {
      errors.push({
        file: 'tokens',
        message: error instanceof Error ? error.message : String(error)
      })
    }
    
    try {
      const brand = exportBrandJson()
      validateBrandJson(brand as JsonLike)
    } catch (error) {
      errors.push({
        file: 'brand',
        message: error instanceof Error ? error.message : String(error)
      })
    }
    
    try {
      const uikit = exportUIKitJson()
      validateUIKitJson(uikit as JsonLike)
    } catch (error) {
      errors.push({
        file: 'uikit',
        message: error instanceof Error ? error.message : String(error)
      })
    }
    
    // Validate CSS files (always validate both)
    const cssErrors = validateCssExport({ specific: true, scoped: true })
    cssErrors.forEach(cssError => {
      errors.push({
        file: cssError.file === 'specific' ? 'css-specific' : 'css-scoped',
        message: cssError.message
      })
    })
    
    // If validation errors, show validation modal
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationModal(true)
      return
    }
    
    // Step 2: Validation passed, check AA compliance
    const issues = checkAACompliance()
    
    if (issues.length > 0) {
      // Show compliance modal
      setComplianceIssues(issues)
      setShowComplianceModal(true)
    } else {
      // No AA issues, proceed directly to export modal
      setShowSelectionModal(true)
    }
  }
  
  const handleValidationModalClose = () => {
    setShowValidationModal(false)
    setValidationErrors([])
  }
  
  const handleSelectionConfirm = (files: { tokens: boolean; brand: boolean; uikit: boolean; cssSpecific: boolean; cssScoped: boolean }) => {
    setShowSelectionModal(false)
    
    // Export files (validation already passed)
    downloadJsonFiles(files).catch((error) => {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Failed to export files. Please check the console for details.'}`)
    })
  }
  
  const handleSelectionCancel = () => {
    setShowSelectionModal(false)
  }
  
  const handleAcknowledge = () => {
    setShowComplianceModal(false)
    setComplianceIssues([])
    // After acknowledging AA compliance, show export modal
    setShowSelectionModal(true)
  }
  
  const handleCancel = () => {
    setShowComplianceModal(false)
    setComplianceIssues([])
  }
  
  return {
    handleExport,
    showSelectionModal,
    showComplianceModal,
    showValidationModal,
    validationErrors,
    complianceIssues,
    handleSelectionConfirm,
    handleSelectionCancel,
    handleAcknowledge,
    handleCancel,
    handleValidationModalClose,
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

export function ExportValidationErrorModal({
  show,
  errors,
  onClose,
}: {
  show: boolean
  errors: ValidationError[]
  onClose: () => void
}) {
  return <ValidationErrorModal show={show} errors={errors} onClose={onClose} />
}

export function ExportSelectionModalWrapper({
  show,
  onConfirm,
  onCancel,
}: {
  show: boolean
  onConfirm: (files: { tokens: boolean; brand: boolean; uikit: boolean; cssSpecific: boolean; cssScoped: boolean }) => void
  onCancel: () => void
}) {
  return <ExportSelectionModal show={show} onExport={onConfirm} onCancel={onCancel} />
}

