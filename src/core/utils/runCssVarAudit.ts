/**
 * Runs CSS variable audit and logs results to console
 * Can be called from browser console: window.auditCssVars()
 */

import { auditRecursicaCssVars, formatBrokenReferencesReport } from './auditCssVars'

export function runCssVarAudit(): void {
  if (typeof window === 'undefined') {
    console.error('CSS variable audit can only run in browser environment')
    return
  }

  console.log('🔍 Auditing CSS variables with --recursica prefix...\n')
  
  const broken = auditRecursicaCssVars()
  const report = formatBrokenReferencesReport(broken)
  
  console.log(report)
  
  if (broken.length > 0) {
    console.group('📋 Detailed List:')
    for (const ref of broken) {
      console.group(`❌ ${ref.variable}`)
      console.log('Value:', ref.value)
      console.log('References:', ref.referencedVar)
      console.log('Reason:', ref.reason)
      
      // Check if the referenced variable exists in DOM
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      const referencedValue = computedStyle.getPropertyValue(ref.referencedVar).trim() || 
                             root.style.getPropertyValue(ref.referencedVar).trim()
      console.log('Referenced var exists in DOM:', referencedValue.length > 0 ? 'YES' : 'NO')
      if (referencedValue) {
        console.log('Referenced var value:', referencedValue)
      }
      console.groupEnd()
    }
    console.groupEnd()
    
    // Also return as JSON for programmatic access
    console.log('\n📊 JSON Export:')
    console.log(JSON.stringify(broken, null, 2))
  }
  
  return broken as any
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).auditCssVars = runCssVarAudit
  
  // Auto-run audit on localhost after app initializes
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Wait for app to fully initialize and CSS vars to be set
    // Use setTimeout to ensure all providers and stores have initialized
    setTimeout(() => {
      console.log('%c🔍 Auto-running CSS variable audit (localhost only)...', 'color: #4CAF50; font-weight: bold;')
      runCssVarAudit()
    }, 1000) // 1 second delay to ensure all CSS vars are applied
  }
}

