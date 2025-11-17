/**
 * Audits CSS variables to find broken references
 */

export interface BrokenReference {
  variable: string
  value: string
  referencedVar: string
  reason: 'not-defined' | 'circular' | 'invalid-syntax'
}

/**
 * Audits all CSS variables with --recursica prefix to find broken references
 */
export function auditRecursicaCssVars(): BrokenReference[] {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return []
  }

  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  const broken: BrokenReference[] = []
  const allVars = new Set<string>()
  const varValues = new Map<string, string>()

  // First pass: collect all CSS variables
  const allStyles = Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules)
      } catch {
        return []
      }
    })
    .filter((rule) => rule instanceof CSSStyleRule)

  // Get all CSS variables from root (computed styles)
  const rootVars: string[] = []
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i]
    if (prop.startsWith('--recursica-')) {
      rootVars.push(prop)
      allVars.add(prop)
      const value = computedStyle.getPropertyValue(prop).trim()
      varValues.set(prop, value)
    }
  }

  // Also check inline styles on root (these take precedence)
  if (root.style) {
    for (let i = 0; i < root.style.length; i++) {
      const prop = root.style[i]
      if (prop.startsWith('--recursica-')) {
        allVars.add(prop) // Always add to set, even if already there (inline takes precedence)
        const value = root.style.getPropertyValue(prop).trim()
        varValues.set(prop, value) // Overwrite with inline value
      }
    }
  }
  
  // Also check all stylesheets for CSS variable definitions
  try {
    const allStyles = Array.from(document.styleSheets)
    for (const sheet of allStyles) {
      try {
        const rules = Array.from(sheet.cssRules || [])
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            // Check if this rule sets any --recursica- variables
            const style = rule.style
            for (let i = 0; i < style.length; i++) {
              const prop = style[i]
              if (prop.startsWith('--recursica-')) {
                allVars.add(prop)
                const value = style.getPropertyValue(prop).trim()
                if (!varValues.has(prop)) {
                  varValues.set(prop, value)
                }
              }
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets can't be accessed, skip
      }
    }
  } catch (e) {
    // Ignore errors accessing stylesheets
  }

  // Second pass: check for broken references
  for (const [varName, value] of varValues.entries()) {
    if (!value) continue

    // Check if value is a var() reference
    const varMatch = value.match(/var\s*\(\s*([^)]+)\s*\)/g)
    if (!varMatch) continue

    for (const varRef of varMatch) {
      // Extract the variable name from var(...)
      const innerMatch = varRef.match(/var\s*\(\s*([^,)]+)/)
      if (!innerMatch) {
        broken.push({
          variable: varName,
          value,
          referencedVar: varRef,
          reason: 'invalid-syntax',
        })
        continue
      }

      const referencedVarName = innerMatch[1].trim()

      // Check if it's a --recursica variable
      if (referencedVarName.startsWith('--recursica-')) {
        // Check if variable exists in our collected vars
        const existsInVars = allVars.has(referencedVarName)
        
        // Check if variable exists in DOM by checking if it's in the style's property list
        // or if getPropertyValue returns a non-empty value
        let existsInDom = false
        try {
          // Check inline styles first (faster)
          if (root.style && root.style.getPropertyValue(referencedVarName) !== '') {
            existsInDom = true
          } else {
            // Check computed styles - if variable doesn't exist, getPropertyValue returns empty string
            const computedValue = computedStyle.getPropertyValue(referencedVarName)
            // An empty string could mean the variable doesn't exist OR has an empty value
            // But if it's in our allVars set, we know it should exist
            // If it's not in allVars and is empty, it likely doesn't exist
            if (computedValue !== '') {
              existsInDom = true
            } else {
              // Double-check by trying to read it as a custom property
              // If the variable is truly missing, CSS will use the fallback or empty
              // We can't perfectly detect this, but if it's not in allVars and empty, assume broken
              existsInDom = false
            }
          }
        } catch (e) {
          // If there's an error reading, assume it doesn't exist
          existsInDom = false
        }
        
        // If the variable doesn't exist anywhere, it's broken
        if (!existsInVars && !existsInDom) {
          broken.push({
            variable: varName,
            value,
            referencedVar: referencedVarName,
            reason: 'not-defined',
          })
        } else if (existsInDom || existsInVars) {
          // Variable exists, check for circular references
          const refValue = varValues.get(referencedVarName) || 
                          (existsInDom ? computedStyle.getPropertyValue(referencedVarName) : '')
          if (refValue && typeof refValue === 'string' && refValue.includes(varName)) {
            broken.push({
              variable: varName,
              value,
              referencedVar: referencedVarName,
              reason: 'circular',
            })
          }
        }
      }
    }
  }

  return broken
}

/**
 * Formats broken references as a readable report
 */
export function formatBrokenReferencesReport(broken: BrokenReference[]): string {
  if (broken.length === 0) {
    return '✅ No broken CSS variable references found!'
  }

  const byReason = {
    'not-defined': [] as BrokenReference[],
    'circular': [] as BrokenReference[],
    'invalid-syntax': [] as BrokenReference[],
  }

  for (const ref of broken) {
    byReason[ref.reason].push(ref)
  }

  let report = `❌ Found ${broken.length} broken CSS variable reference(s):\n\n`

  if (byReason['not-defined'].length > 0) {
    report += `🔴 Not Defined (${byReason['not-defined'].length}):\n`
    for (const ref of byReason['not-defined']) {
      report += `  • ${ref.variable}\n`
      report += `    → References: ${ref.referencedVar}\n`
      report += `    → Value: ${ref.value}\n\n`
    }
  }

  if (byReason['circular'].length > 0) {
    report += `🟡 Circular Reference (${byReason['circular'].length}):\n`
    for (const ref of byReason['circular']) {
      report += `  • ${ref.variable}\n`
      report += `    → References: ${ref.referencedVar}\n\n`
    }
  }

  if (byReason['invalid-syntax'].length > 0) {
    report += `🟠 Invalid Syntax (${byReason['invalid-syntax'].length}):\n`
    for (const ref of byReason['invalid-syntax']) {
      report += `  • ${ref.variable}\n`
      report += `    → Value: ${ref.value}\n\n`
    }
  }

  return report
}

