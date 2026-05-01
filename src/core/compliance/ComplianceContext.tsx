/**
 * ComplianceContext — React context for AA compliance state
 * 
 * Wraps the ComplianceService singleton and provides reactive state
 * to React components (nav badges, compliance page, export modal).
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { getComplianceService, type ComplianceIssue, type ComponentComplianceIssue } from './ComplianceService'

interface ComplianceContextValue {
    /** Theme issues only (palette, core, layer) */
    issues: ComplianceIssue[]
    /** Deduplicated dual-mode component issues */
    componentIssues: ComponentComplianceIssue[]
    /** Total count of all issues (theme + component) */
    issueCount: number
    lightIssueCount: number
    darkIssueCount: number
    runScan: () => void
    applySuggestion: (id: string) => boolean
    applyAllSuggestions: () => number
}

const ComplianceContext = createContext<ComplianceContextValue>({
    issues: [],
    componentIssues: [],
    issueCount: 0,
    lightIssueCount: 0,
    darkIssueCount: 0,
    runScan: () => { },
    applySuggestion: () => false,
    applyAllSuggestions: () => 0,
})

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
    const [issues, setIssues] = useState<ComplianceIssue[]>([])
    const [componentIssues, setComponentIssues] = useState<ComponentComplianceIssue[]>([])
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true

        const handleIssuesChanged = () => {
            if (!mountedRef.current) return
            const service = getComplianceService()
            setIssues(service.getThemeIssues())
            setComponentIssues(service.getComponentIssues())
        }

        // Listen for compliance events
        window.addEventListener('complianceIssuesChanged', handleIssuesChanged)

        // Get initial state
        const service = getComplianceService()
        setIssues(service.getThemeIssues())
        setComponentIssues(service.getComponentIssues())

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

    const issueCount = issues.length + componentIssues.length
    const lightIssueCount = issues.filter(i => i.mode === 'light').length
    const darkIssueCount = issues.filter(i => i.mode === 'dark').length

    return (
        <ComplianceContext.Provider
            value={{
                issues,
                componentIssues,
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
