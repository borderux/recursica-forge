/**
 * Export with AA Compliance Check
 * 
 * Wrapper component that checks AA compliance before allowing export.
 */

import { useState } from 'react'
import { checkAACompliance } from './aaComplianceCheck'
import { ComplianceModal } from './ComplianceModal'
import { downloadJsonFiles } from './jsonExport'

export function useJsonExport() {
  const [showModal, setShowModal] = useState(false)
  const [complianceIssues, setComplianceIssues] = useState<ReturnType<typeof checkAACompliance>>([])
  
  const handleExport = () => {
    const issues = checkAACompliance()
    
    if (issues.length > 0) {
      setComplianceIssues(issues)
      setShowModal(true)
    } else {
      // No issues, proceed with export
      downloadJsonFiles()
    }
  }
  
  const handleAcknowledge = () => {
    setShowModal(false)
    downloadJsonFiles()
  }
  
  const handleCancel = () => {
    setShowModal(false)
    setComplianceIssues([])
  }
  
  return {
    handleExport,
    showModal,
    complianceIssues,
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

