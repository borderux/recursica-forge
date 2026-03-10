/**
 * ComplianceContext — React context for AA compliance state
 * 
 * Wraps the ComplianceService singleton and provides reactive state
 * to React components (nav badges, compliance page, export modal).
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { getComplianceService, type ComplianceIssue } from './ComplianceService'

interface ComplianceContextValue {
    issues: ComplianceIssue[]
    issueCount: number
    lightIssueCount: number
    darkIssueCount: number
    runScan: () => void
    applySuggestion: (id: string) => boolean
    applyAllSuggestions: () => number
}

const ComplianceContext = createContext<ComplianceContextValue>({
    issues: [],
    issueCount: 0,
    lightIssueCount: 0,
    darkIssueCount: 0,
    runScan: () => { },
    applySuggestion: () => false,
    applyAllSuggestions: () => 0,
})

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
    const [issues, setIssues] = useState<ComplianceIssue[]>([])
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true

        const handleIssuesChanged = () => {
            if (!mountedRef.current) return
            setIssues(getComplianceService().getIssues())
        }

        // Listen for compliance events
        window.addEventListener('complianceIssuesChanged', handleIssuesChanged)

        // Get initial state
        const service = getComplianceService()
        setIssues(service.getIssues())

        return () => {
            mountedRef.current = false
            window.removeEventListener('complianceIssuesChanged', handleIssuesChanged)
        }
    }, [])

    const runScan = useCallback(() => {
        getComplianceService().runFullScan()
    }, [])

    const applySuggestion = useCallback((id: string) => {
        return getComplianceService().applySuggestion(id)
    }, [])

    const applyAllSuggestions = useCallback(() => {
        return getComplianceService().applyAllSuggestions()
    }, [])

    const issueCount = issues.length
    const lightIssueCount = issues.filter(i => i.mode === 'light').length
    const darkIssueCount = issues.filter(i => i.mode === 'dark').length

    return (
        <ComplianceContext.Provider
            value={{
                issues,
                issueCount,
                lightIssueCount,
                darkIssueCount,
                runScan,
                applySuggestion,
                applyAllSuggestions,
            }}
        >
            {children}
        </ComplianceContext.Provider>
    )
}

export function useCompliance() {
    return useContext(ComplianceContext)
}
