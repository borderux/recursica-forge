/**
 * Runs CSS variable audit and logs results to console
 * Can be called from browser console: window.auditCssVars()
 */

import { auditRecursicaCssVars, deepAuditCssVars, type DeepAuditIssue } from './auditCssVars'

export interface AuditSummary {
  totalVars: number
  brokenRefs: number
  missingVars: string[]
  allVars: string[]
  deepIssues?: DeepAuditIssue[]
  broken?: any[]
}

export function runCssVarAudit(silent: boolean = false): AuditSummary {
  if (typeof window === 'undefined') {
    console.error('CSS variable audit can only run in browser environment')
    return { totalVars: 0, brokenRefs: 0, missingVars: [], allVars: [] }
  }

  if (!silent) {
    console.log('🔍 Auditing CSS variables with --recursica prefix...\n')
  }
  
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
  
  // Run deep audit for detailed issues with fix instructions
  const deepIssues = deepAuditCssVars()
  
  if (!silent && (broken.length > 0 || deepIssues.length > 0)) {
    const totalIssues = Math.max(broken.length, deepIssues.length)
    console.log(`❌ Found ${totalIssues} CSS variable issue(s):\n`)
    
    // Use deep audit results if available (more detailed)
    if (deepIssues.length > 0) {
      // Group by source file for better organization
      const byFile = new Map<string, DeepAuditIssue[]>()
      for (const issue of deepIssues) {
        const file = issue.sourceFile || 'unknown'
        if (!byFile.has(file)) {
          byFile.set(file, [])
        }
        byFile.get(file)!.push(issue)
      }

      // Collect all unique fix instructions to output once at the end
      const allFixInstructions = new Set<string>()
      
      for (const [file, fileIssues] of Array.from(byFile.entries()).sort()) {
        console.log(`\n📁 ${file} (${fileIssues.length} issue${fileIssues.length > 1 ? 's' : ''}):`)
        console.log('='.repeat(80))
        
        for (const issue of fileIssues) {
          console.log(`\n🔴 CSS Variable: ${issue.cssVar}`)
          console.log(`   Property: ${issue.cssProperty}`)
          console.log(`   Value: ${issue.value}`)
          console.log(`   Element: ${issue.elementPath}`)
          console.log(`   Issue Type: ${issue.issueType}`)
          
          if (issue.similarVars && issue.similarVars.length > 0) {
            console.log(`   Similar variables found: ${issue.similarVars.join(', ')}`)
          }
          
          // Collect fix instructions instead of outputting them immediately
          issue.suggestedFix.forEach((instruction) => {
            allFixInstructions.add(instruction)
          })
        }
      }
      
      // Output all fix instructions once at the end
      if (allFixInstructions.size > 0) {
        console.log(`\n${'='.repeat(80)}`)
        console.log(`\n🤖 FIX INSTRUCTIONS:`)
        Array.from(allFixInstructions).sort().forEach((instruction) => {
          console.log(`   ${instruction}`)
        })
      }
    } else {
      // Fall back to basic audit if deep audit didn't find issues
      for (const ref of broken) {
        let location = 'unknown'
        if (ref.element) {
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
    }
    
    console.log(`\n${'='.repeat(80)}`)
    console.log(`\n📋 SUMMARY:`)
    console.log(`   Total issues: ${totalIssues}`)
    console.log(`   Files affected: ${deepIssues.length > 0 ? new Set(deepIssues.map(i => i.sourceFile).filter(Boolean)).size : 'unknown'}`)
    
    // Only output "Remember" section if there are issues
    if (totalIssues > 0) {
      console.log(`\n💡 Remember:`)
      console.log(`   - NEVER add fallback values`)
      console.log(`   - NEVER modify Tokens.json, Brand.json, or UIKit.json`)
      console.log(`   - Always fix the code using the variable, not the normalization process`)
      console.log(`   - Never create CSS aliases for the same variable`)
      console.log(`   - Always normalize CSS variables using utility functions`)
      console.log(`   - ALWAYS use scale-n CSS variable references (e.g., scale-01, scale-02), NEVER use alias references (e.g., cornflower, gray, greensheen)`)
    }
  } else if (!silent) {
    console.log('✅ No broken CSS variable references found!')
  }
  
  const summary: AuditSummary = {
    totalVars: allVarsArray.length,
    brokenRefs: broken.length,
    missingVars: broken.filter(b => b.reason === 'not-defined').map(b => b.referencedVar),
    allVars: allVarsArray,
    deepIssues,
    broken,
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

// Make it available globally for easy console access (dev mode only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const win = window as any
  win.auditCssVars = runCssVarAudit
  win.deepAuditCssVars = deepAuditCssVars
  win.getAllCssVars = getAllCssVars
  
  // Helper to run audit on multiple routes
  win.auditAllRoutes = async function auditAllRoutes(routes?: string[]) {
    // Default routes include all main routes and sub-routes from left navigation
    const defaultRoutes = [
      // Tokens routes (path-based navigation)
      '/tokens',
      '/tokens/font',
      '/tokens/opacity',
      // Theme sub-routes
      '/theme/core-properties',
      '/theme/type',
      '/theme/palettes',
      '/theme/elevations',
      '/theme/layers',
      '/theme/dimensions',
      // Components base
      '/components',
      // Component detail pages
      '/components/avatar',
      '/components/badge',
      '/components/breadcrumb',
      '/components/button',
      '/components/chip',
      '/components/label',
      '/components/menu',
      '/components/menu-item',
      '/components/slider',
      '/components/switch',
      '/components/toast',
    ]
    
    const routesToAudit = routes || defaultRoutes
    const results: Record<string, AuditSummary> = {}
    
    console.log(`🚀 Starting CSS variable audit on ${routesToAudit.length} route(s)...\n`)
    
    // Collect all issues across routes
    const allDeepIssues: DeepAuditIssue[] = []
    const allBroken: any[] = []
    
    for (let i = 0; i < routesToAudit.length; i++) {
      const route = routesToAudit[i]
      console.log(`📍 Auditing route: ${route} (${i + 1}/${routesToAudit.length})`)
      
      // Navigate to route (all routes are now path-based)
      window.history.pushState({}, '', route)
      // Trigger popstate event for React Router
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
      
      // Wait for page to load and CSS vars to be applied
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Run audit silently
      const result = runCssVarAudit(true)
      results[route] = result
      
      // Collect issues
      if (result.deepIssues) {
        allDeepIssues.push(...result.deepIssues)
      }
      if (result.broken) {
        allBroken.push(...result.broken)
      }
    }
    
    // Output all issues at the end
    console.log(`\n${'='.repeat(80)}`)
    console.log(`\n📊 CROSS-ROUTE AUDIT RESULTS:`)
    console.log('='.repeat(80))
    
    // Deduplicate broken references
    const brokenKey = (ref: any) => `${ref.variable}|${ref.element || ref.location || 'unknown'}`
    const seenBroken = new Set<string>()
    const uniqueBroken: any[] = []
    for (const ref of allBroken) {
      const key = brokenKey(ref)
      if (!seenBroken.has(key)) {
        seenBroken.add(key)
        uniqueBroken.push(ref)
      }
    }
    
    // Deduplicate deep issues
    const issueKey = (issue: DeepAuditIssue) => 
      `${issue.sourceFile || 'unknown'}|${issue.cssVar}|${issue.elementPath}`
    const seenIssues = new Set<string>()
    const uniqueDeepIssues: DeepAuditIssue[] = []
    for (const issue of allDeepIssues) {
      const key = issueKey(issue)
      if (!seenIssues.has(key)) {
        seenIssues.add(key)
        uniqueDeepIssues.push(issue)
      }
    }
    
    const totalIssues = uniqueDeepIssues.length || uniqueBroken.length
    const routesWithIssues = Object.entries(results).filter(([_, r]) => r.brokenRefs > 0)
    
    if (totalIssues === 0) {
      console.log(`✅ No CSS variable issues found across all ${routesToAudit.length} route(s)!`)
    } else {
      console.log(`❌ Found ${totalIssues} unique issue(s) across ${routesWithIssues.length} route(s):\n`)
      
      // Group issues by route for summary
      routesWithIssues.forEach(([route, result]) => {
        console.log(`   ${route}: ${result.brokenRefs} issue(s)`)
      })
      
      // Output all deep issues grouped by file (already deduplicated above)
      if (uniqueDeepIssues.length > 0) {
        const byFile = new Map<string, DeepAuditIssue[]>()
        for (const issue of uniqueDeepIssues) {
          const file = issue.sourceFile || 'unknown'
          if (!byFile.has(file)) {
            byFile.set(file, [])
          }
          byFile.get(file)!.push(issue)
        }

        // Collect all unique fix instructions
        const allFixInstructions = new Set<string>()
        
        for (const [file, fileIssues] of Array.from(byFile.entries()).sort()) {
          console.log(`\n📁 ${file} (${fileIssues.length} issue${fileIssues.length > 1 ? 's' : ''}):`)
          console.log('='.repeat(80))
          
          for (const issue of fileIssues) {
            console.log(`\n🔴 CSS Variable: ${issue.cssVar}`)
            console.log(`   Property: ${issue.cssProperty}`)
            console.log(`   Value: ${issue.value}`)
            console.log(`   Element: ${issue.elementPath}`)
            console.log(`   Issue Type: ${issue.issueType}`)
            
            if (issue.similarVars && issue.similarVars.length > 0) {
              console.log(`   Similar variables found: ${issue.similarVars.join(', ')}`)
            }
            
            // Collect fix instructions
            issue.suggestedFix.forEach((instruction) => {
              allFixInstructions.add(instruction)
            })
          }
        }
        
        // Output all fix instructions once at the end
        if (allFixInstructions.size > 0) {
          console.log(`\n${'='.repeat(80)}`)
          console.log(`\n🤖 FIX INSTRUCTIONS:`)
          Array.from(allFixInstructions).sort().forEach((instruction) => {
            console.log(`   ${instruction}`)
          })
        }
      } else if (uniqueBroken.length > 0) {
        // Fall back to basic audit if deep audit didn't find issues
        for (const ref of uniqueBroken) {
          let location = 'unknown'
          if (ref.element) {
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
      }
      
      console.log(`\n${'='.repeat(80)}`)
      console.log(`\n📋 SUMMARY:`)
      console.log(`   Total unique issues: ${totalIssues}`)
      console.log(`   Routes with issues: ${routesWithIssues.length}`)
      console.log(`   Files affected: ${uniqueDeepIssues.length > 0 ? new Set(uniqueDeepIssues.map(i => i.sourceFile).filter(Boolean)).size : 'unknown'}`)
      
      console.log(`\n💡 Remember:`)
      console.log(`   - NEVER add fallback values`)
      console.log(`   - NEVER modify Tokens.json, Brand.json, or UIKit.json`)
      console.log(`   - Always fix the code using the variable, not the normalization process`)
      console.log(`   - Never create CSS aliases for the same variable`)
      console.log(`   - Always normalize CSS variables using utility functions`)
      console.log(`   - ALWAYS use scale-n CSS variable references (e.g., scale-01, scale-02), NEVER use alias references (e.g., cornflower, gray, greensheen)`)
    }
    
    return results
  }
  
  // Auto-run audit only in development mode after app fully initializes
  if (process.env.NODE_ENV === 'development') {
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

