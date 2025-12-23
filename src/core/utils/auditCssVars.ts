/**
 * Audits CSS variables to find broken references
 */

export interface BrokenReference {
  variable: string
  value: string
  referencedVar: string
  reason: 'not-defined' | 'circular' | 'invalid-syntax'
  element?: string // Element selector or description where variable is used
  location?: 'root' | 'element' | 'stylesheet' | 'computed'
}

/**
 * Audits all CSS variables with --recursica prefix to find broken references
 * Enhanced to check:
 * - Root element CSS variables
 * - All DOM elements for CSS variable usage
 * - Computed styles on all elements
 * - Inline styles on all elements
 * - Stylesheet definitions
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
  const varLocations = new Map<string, Set<string>>() // Track where each variable is found

  // Helper to add variable with location tracking
  const addVar = (varName: string, value: string, location: string) => {
    allVars.add(varName)
    // Inline styles take precedence over computed styles
    if (!varValues.has(varName) || location === 'inline') {
      varValues.set(varName, value)
    }
    if (!varLocations.has(varName)) {
      varLocations.set(varName, new Set())
    }
    varLocations.get(varName)!.add(location)
  }

  // Helper to get element description
  const getElementDesc = (el: Element): string => {
    if (el === root) return 'root'
    const id = el.id ? `#${el.id}` : ''
    const classes = el.className ? `.${String(el.className).split(' ').join('.')}` : ''
    const tag = el.tagName.toLowerCase()
    return `${tag}${id}${classes}` || el.tagName || 'unknown'
  }

  // First pass: collect all CSS variables from root
  // Check inline styles first (these are the actual definitions)
  if (root.style) {
    for (let i = 0; i < root.style.length; i++) {
      const prop = root.style[i]
      if (prop.startsWith('--recursica-')) {
        const value = root.style.getPropertyValue(prop).trim()
        addVar(prop, value, 'root-inline')
      }
    }
  }
  
  // Also check computed styles to catch any variables that might be set via stylesheets
  // But prioritize inline styles (they're the source of truth)
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i]
    if (prop.startsWith('--recursica-')) {
      // Only add if not already added from inline styles
      if (!allVars.has(prop)) {
        const value = computedStyle.getPropertyValue(prop).trim()
        addVar(prop, value, 'root-computed')
      }
    }
  }
  
  // Check all stylesheets for CSS variable definitions AND usage
  try {
    const allStyles = Array.from(document.styleSheets)
    for (const sheet of allStyles) {
      try {
        const rules = Array.from(sheet.cssRules || [])
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText || 'unknown'
            const style = rule.style
            // Check for CSS variable definitions (--recursica-* properties)
            for (let i = 0; i < style.length; i++) {
              const prop = style[i]
              if (prop.startsWith('--recursica-')) {
                const value = style.getPropertyValue(prop).trim()
                addVar(prop, value, `stylesheet:${selector}`)
              }
            }
            // Also check all CSS property VALUES for var() references to --recursica- variables
            for (let i = 0; i < style.length; i++) {
              const cssProp = style[i]
              const cssValue = style.getPropertyValue(cssProp).trim()
              if (cssValue && cssValue.includes('var(--recursica-')) {
                // Extract all var() references from this CSS property value
                const varMatches = cssValue.match(/var\s*\(\s*([^,)]+)/g)
                if (varMatches) {
                  for (const varMatch of varMatches) {
                    const innerMatch = varMatch.match(/var\s*\(\s*([^,)]+)/)
                    if (innerMatch) {
                      const referencedVar = innerMatch[1].trim()
                      if (referencedVar.startsWith('--recursica-')) {
                        // Track that this variable is referenced in a stylesheet
                        if (!varLocations.has(`usage:${referencedVar}`)) {
                          varLocations.set(`usage:${referencedVar}`, new Set())
                        }
                        varLocations.get(`usage:${referencedVar}`)!.add(`stylesheet:${selector}:${cssProp}`)
                        // Also check if this variable is defined - if not, we'll catch it as broken
                        if (!allVars.has(referencedVar)) {
                          // Variable is referenced but not defined - we'll add it to broken refs later
                          // For now, just track the usage
                        }
                      }
                    }
                  }
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

  // Check all DOM elements for CSS variable usage (both definitions and references)
  const allElements = document.querySelectorAll('*')
  for (const el of allElements) {
    const elDesc = getElementDesc(el)
    const elComputed = getComputedStyle(el)
    const elInline = el.style

    // Check computed styles for CSS variable definitions
    for (let i = 0; i < elComputed.length; i++) {
      const prop = elComputed[i]
      if (prop.startsWith('--recursica-')) {
        const value = elComputed.getPropertyValue(prop).trim()
        if (value) {
          addVar(prop, value, `element-computed:${elDesc}`)
        }
      }
    }

    // Check inline styles for CSS variable definitions
    if (elInline && elInline.length > 0) {
      for (let i = 0; i < elInline.length; i++) {
        const prop = elInline[i]
        if (prop.startsWith('--recursica-')) {
          const value = elInline.getPropertyValue(prop).trim()
          addVar(prop, value, `element-inline:${elDesc}`)
        }
      }
    }

    // Check all CSS properties for var() references to --recursica- variables
    for (let i = 0; i < elComputed.length; i++) {
      const prop = elComputed[i]
      const value = elComputed.getPropertyValue(prop).trim()
      if (value && value.includes('var(--recursica-')) {
        // Extract all var() references
        const varMatches = value.match(/var\s*\(\s*([^,)]+)/g)
        if (varMatches) {
          for (const varMatch of varMatches) {
            const innerMatch = varMatch.match(/var\s*\(\s*([^,)]+)/)
            if (innerMatch) {
              const referencedVar = innerMatch[1].trim()
              if (referencedVar.startsWith('--recursica-')) {
                // Track that this element uses this CSS variable
                if (!varLocations.has(`usage:${referencedVar}`)) {
                  varLocations.set(`usage:${referencedVar}`, new Set())
                }
                varLocations.get(`usage:${referencedVar}`)!.add(`used-in:${elDesc}:${prop}`)
                // Also add this as a variable reference to check if it exists
                // We'll check it exists in the second pass
                if (!allVars.has(referencedVar)) {
                  // Variable is referenced but not defined - add to varValues with empty value
                  // so it gets checked in the second pass
                  varValues.set(`usage-check:${referencedVar}`, `var(${referencedVar})`)
                }
              }
            }
          }
        }
      }
    }
  }
  
  // After collecting all variables, check for broken references from stylesheet CSS property values
  // This catches cases where CSS properties use var() but the variable isn't defined
  for (const [usageKey, usageLocations] of varLocations.entries()) {
    if (usageKey.startsWith('usage:')) {
      const referencedVar = usageKey.replace('usage:', '')
      if (referencedVar.startsWith('--recursica-')) {
        // Check if this variable exists
        const existsInVars = allVars.has(referencedVar)
        let existsInDom = false
        
        // Check DOM - CSS variables are inherited, so check root first
        try {
          // Check root inline styles first (where CSS variables are actually defined)
          if (root.style) {
            const rootInlineValue = root.style.getPropertyValue(referencedVar)
            // Check if property exists in style object (even if value is empty)
            const existsInRootStyle = Array.from(root.style).includes(referencedVar)
            if (rootInlineValue !== '' || existsInRootStyle) {
              existsInDom = true
            }
          }
          
          if (!existsInDom) {
            // Check root computed styles
            const rootComputedValue = computedStyle.getPropertyValue(referencedVar)
            if (rootComputedValue !== '') {
              existsInDom = true
            } else {
              // Check all elements (CSS variables can be defined on any element)
              for (const el of allElements) {
                const elComputed = getComputedStyle(el)
                const elInline = (el as HTMLElement).style
                // Check inline styles
                if (elInline) {
                  const inlineValue = elInline.getPropertyValue(referencedVar)
                  const existsInInlineStyle = Array.from(elInline).includes(referencedVar)
                  if (inlineValue !== '' || existsInInlineStyle) {
                    existsInDom = true
                    break
                  }
                }
                // Check computed styles
                const elComputedValue = elComputed.getPropertyValue(referencedVar)
                if (elComputedValue !== '') {
                  existsInDom = true
                  break
                }
              }
            }
          }
        } catch (e) {
          existsInDom = false
        }
        
        // If variable doesn't exist, add to broken references
        if (!existsInVars && !existsInDom) {
          const locationStr = Array.from(usageLocations).join(', ')
          broken.push({
            variable: referencedVar,
            value: `var(${referencedVar})`,
            referencedVar: referencedVar,
            reason: 'not-defined',
            element: locationStr,
            location: locationStr.includes('stylesheet') ? 'stylesheet' : 'element',
          })
        }
      }
    }
  }

  // Second pass: check for broken references
  for (const [varName, value] of varValues.entries()) {
    if (!value) continue

    // Check if value is a var() reference
    const varMatch = value.match(/var\s*\(\s*([^)]+)\s*\)/g)
    if (!varMatch) continue

    // Get location info for this variable
    const locations = varLocations.get(varName) || new Set()
    const locationStr = Array.from(locations).join(', ')
    const isRoot = locationStr.includes('root')
    const location: BrokenReference['location'] = isRoot ? 'root' : 
                                                  locationStr.includes('stylesheet') ? 'stylesheet' :
                                                  locationStr.includes('element') ? 'element' : 'computed'

    for (const varRef of varMatch) {
      // Extract the variable name from var(...)
      const innerMatch = varRef.match(/var\s*\(\s*([^,)]+)/)
      if (!innerMatch) {
        broken.push({
          variable: varName,
          value,
          referencedVar: varRef,
          reason: 'invalid-syntax',
          element: locationStr,
          location,
        })
        continue
      }

      const referencedVarName = innerMatch[1].trim()

      // Check if it's a --recursica variable
      if (referencedVarName.startsWith('--recursica-')) {
        // Check if variable exists in our collected vars
        const existsInVars = allVars.has(referencedVarName)
        
        // Check if variable exists in DOM by checking root and all elements
        let existsInDom = false
        let domLocation = ''
        try {
          // Check root inline styles first (where CSS variables are actually defined)
          if (root.style) {
            const rootInlineValue = root.style.getPropertyValue(referencedVarName)
            // Check if property exists in style object (even if value is empty)
            const existsInRootStyle = Array.from(root.style).includes(referencedVarName)
            if (rootInlineValue !== '' || existsInRootStyle) {
              existsInDom = true
              domLocation = 'root-inline'
            }
          }
          
          if (!existsInDom) {
            // Check root computed styles
            const rootComputedValue = computedStyle.getPropertyValue(referencedVarName)
            if (rootComputedValue !== '') {
              existsInDom = true
              domLocation = 'root-computed'
            } else {
              // Check all elements for this variable
              for (const el of allElements) {
                const elComputed = getComputedStyle(el)
                const elInline = (el as HTMLElement).style
                
                // Check inline first
                if (elInline) {
                  const inlineValue = elInline.getPropertyValue(referencedVarName)
                  const existsInInlineStyle = Array.from(elInline).includes(referencedVarName)
                  if (inlineValue !== '' || existsInInlineStyle) {
                    existsInDom = true
                    domLocation = `element-inline:${getElementDesc(el)}`
                    break
                  }
                }
                
                // Check computed
                const elComputedValue = elComputed.getPropertyValue(referencedVarName)
                if (elComputedValue !== '') {
                  existsInDom = true
                  domLocation = `element-computed:${getElementDesc(el)}`
                  break
                }
              }
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
            element: locationStr,
            location,
          })
        } else if (existsInDom || existsInVars) {
          // Variable exists, check for circular references
          const refValue = varValues.get(referencedVarName) || 
                          (existsInDom ? (domLocation.includes('root') ? computedStyle.getPropertyValue(referencedVarName) : '') : '')
          
          // Build a set to track circular reference chain
          const checkCircular = (varToCheck: string, visited: Set<string>, depth: number = 0): boolean => {
            if (depth > 10) return false // Prevent infinite loops
            if (visited.has(varToCheck)) return true // Circular reference found
            visited.add(varToCheck)
            
            const checkValue = varValues.get(varToCheck)
            if (!checkValue) return false
            
            const refs = checkValue.match(/var\s*\(\s*([^,)]+)/g)
            if (!refs) return false
            
            for (const ref of refs) {
              const innerMatch = ref.match(/var\s*\(\s*([^,)]+)/)
              if (innerMatch) {
                const refVar = innerMatch[1].trim()
                if (refVar.startsWith('--recursica-') && checkCircular(refVar, new Set(visited), depth + 1)) {
                  return true
                }
              }
            }
            return false
          }
          
          if (refValue && typeof refValue === 'string') {
            const visited = new Set<string>([varName])
            if (checkCircular(referencedVarName, visited)) {
              broken.push({
                variable: varName,
                value,
                referencedVar: referencedVarName,
                reason: 'circular',
                element: locationStr,
                location,
              })
            }
          }
        }
      }
    }
  }
  
  // Third pass: Check for variables referenced in CSS property values that don't exist
  // This catches cases like background-color: var(--recursica-brand-dark-layer-layer-0-property-surface)
  // where the variable is used in a CSS property but never defined
  for (const [usageKey, usageLocations] of varLocations.entries()) {
    if (usageKey.startsWith('usage:')) {
      const referencedVar = usageKey.replace('usage:', '')
      if (referencedVar.startsWith('--recursica-')) {
        // Check if this variable exists
        const existsInVars = allVars.has(referencedVar)
        let existsInDom = false
        
        // Check DOM
        try {
          if (root.style && root.style.getPropertyValue(referencedVar) !== '') {
            existsInDom = true
          } else {
            const rootComputedValue = computedStyle.getPropertyValue(referencedVar)
            if (rootComputedValue !== '') {
              existsInDom = true
            } else {
              for (const el of allElements) {
                const elComputed = getComputedStyle(el)
                const elInline = el.style
                if (elInline && elInline.getPropertyValue(referencedVar) !== '') {
                  existsInDom = true
                  break
                }
                const elComputedValue = elComputed.getPropertyValue(referencedVar)
                if (elComputedValue !== '') {
                  existsInDom = true
                  break
                }
              }
            }
          }
        } catch (e) {
          existsInDom = false
        }
        
        // If variable doesn't exist, add to broken references
        if (!existsInVars && !existsInDom) {
          const locationStr = Array.from(usageLocations).join(', ')
          // Extract stylesheet selector if available
          let element = locationStr
          let location: BrokenReference['location'] = 'element'
          if (locationStr.includes('stylesheet:')) {
            const match = locationStr.match(/stylesheet:([^:]+)/)
            element = match ? match[1] : locationStr
            location = 'stylesheet'
          } else if (locationStr.includes('used-in:')) {
            const match = locationStr.match(/used-in:([^:]+):(.+)/)
            if (match) {
              element = `${match[1]}:${match[2]}`
            }
          }
          
          broken.push({
            variable: referencedVar,
            value: `var(${referencedVar})`,
            referencedVar: referencedVar,
            reason: 'not-defined',
            element: element,
            location: location,
          })
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

