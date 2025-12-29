/**
 * Runs CSS variable audit and logs results to console
 * Can be called from browser console: window.auditCssVars()
 */

import { auditRecursicaCssVars } from './auditCssVars'

export interface AuditSummary {
  totalVars: number
  brokenRefs: number
  missingVars: string[]
  allVars: string[]
}

export function runCssVarAudit(): AuditSummary {
  if (typeof window === 'undefined') {
    console.error('CSS variable audit can only run in browser environment')
    return { totalVars: 0, brokenRefs: 0, missingVars: [], allVars: [] }
  }

  console.log('🔍 Auditing CSS variables with --recursica prefix...\n')
  
  const broken = auditRecursicaCssVars()
  
  // Collect all CSS variables found
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  const allVars = new Set<string>()
  
  // Get all CSS variables from root
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i]
    if (prop.startsWith('--recursica-')) {
      allVars.add(prop)
    }
  }
  
  // Get all CSS variables from all elements
  const allElements = document.querySelectorAll('*')
  for (const el of allElements) {
    const elComputed = getComputedStyle(el)
    const elInline = (el as HTMLElement).style
    
    // Check computed styles
    for (let i = 0; i < elComputed.length; i++) {
      const prop = elComputed[i]
      if (prop.startsWith('--recursica-')) {
        allVars.add(prop)
      }
    }
    
    // Check inline styles
    if (elInline && elInline.length > 0) {
      for (let i = 0; i < elInline.length; i++) {
        const prop = elInline[i]
        if (prop.startsWith('--recursica-')) {
          allVars.add(prop)
        }
      }
    }
  }
  
  // Check stylesheets
  try {
    const allStyles = Array.from(document.styleSheets)
    for (const sheet of allStyles) {
      try {
        const rules = Array.from(sheet.cssRules || [])
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            const style = rule.style
            for (let i = 0; i < style.length; i++) {
              const prop = style[i]
              if (prop.startsWith('--recursica-')) {
                allVars.add(prop)
              }
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets can't be accessed
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  const allVarsArray = Array.from(allVars).sort()
  
  if (broken.length > 0) {
    console.log(`❌ Found ${broken.length} broken CSS variable reference(s):\n`)
    for (const ref of broken) {
      // Extract location/file information
      let location = 'unknown'
      if (ref.element) {
        // Parse location from element string
        if (ref.element.includes('root')) {
          location = 'root'
        } else if (ref.element.includes('stylesheet:')) {
          const match = ref.element.match(/stylesheet:(.+)/)
          location = match ? `stylesheet: ${match[1]}` : 'stylesheet'
        } else if (ref.element.includes('element-')) {
          const match = ref.element.match(/element-(?:inline|computed):(.+)/)
          location = match ? match[1] : 'element'
        } else {
          location = ref.element
        }
      } else if (ref.location) {
        location = ref.location
      }
      
      console.log(`${ref.variable}`)
      console.log(`  → ${location}`)
    }
  } else {
    console.log('✅ No broken CSS variable references found!')
  }
  
  const summary: AuditSummary = {
    totalVars: allVarsArray.length,
    brokenRefs: broken.length,
    missingVars: broken.filter(b => b.reason === 'not-defined').map(b => b.referencedVar),
    allVars: allVarsArray,
  }
  
  return summary as any
}

// Helper function to get all CSS variables
function getAllCssVars(): string[] {
  if (typeof window === 'undefined') return []
  
  const allVars = new Set<string>()
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  
  // Get all CSS variables from root
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i]
    if (prop.startsWith('--recursica-')) {
      allVars.add(prop)
    }
  }
  
  // Get all CSS variables from all elements
  const allElements = document.querySelectorAll('*')
  for (const el of allElements) {
    const elComputed = getComputedStyle(el)
    const elInline = (el as HTMLElement).style
    
    // Check computed styles
    for (let i = 0; i < elComputed.length; i++) {
      const prop = elComputed[i]
      if (prop.startsWith('--recursica-')) {
        allVars.add(prop)
      }
    }
    
    // Check inline styles
    if (elInline && elInline.length > 0) {
      for (let i = 0; i < elInline.length; i++) {
        const prop = elInline[i]
        if (prop.startsWith('--recursica-')) {
          allVars.add(prop)
        }
      }
    }
  }
  
  // Check stylesheets
  try {
    const allStyles = Array.from(document.styleSheets)
    for (const sheet of allStyles) {
      try {
        const rules = Array.from(sheet.cssRules || [])
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            const style = rule.style
            for (let i = 0; i < style.length; i++) {
              const prop = style[i]
              if (prop.startsWith('--recursica-')) {
                allVars.add(prop)
              }
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets can't be accessed
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  return Array.from(allVars).sort()
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  const win = window as any
  win.auditCssVars = runCssVarAudit
  win.getAllCssVars = getAllCssVars
  
  // Auto-run audit on localhost after app fully initializes
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const runAuditWhenReady = () => {
      // Wait for app to be fully loaded, then run audit
      setTimeout(() => {
        runCssVarAudit()
      }, 2000) // 2 second delay to ensure all CSS vars are applied
    }
    
    // Start after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runAuditWhenReady)
    } else {
      // DOM is already ready
      runAuditWhenReady()
    }
  }
}

