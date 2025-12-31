/**
 * Audits CSS variables to find broken references
 */

export interface BrokenReference {
  variable: string
  value: string
  referencedVar: string
  reason: 'not-defined' | 'circular' | 'invalid-syntax' | 'brace-notation'
  element?: string // Element selector or description where variable is used
  location?: 'root' | 'element' | 'stylesheet' | 'computed'
}

/**
 * Known CSS variables that are calculated/set on component instances (not on :root)
 * These are valid even if not found on :root during audit
 */
const COMPONENT_INSTANCE_VARS = new Set([
  '--recursica-ui-kit-components-switch-track-height', // Calculated: thumb-height + 2 * track-inner-padding
])

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

  // Helper to check if a value is brace notation (unresolved JSON reference)
  const isBraceNotation = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false
    const trimmed = value.trim()
    return trimmed.startsWith('{') && trimmed.endsWith('}')
  }

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
    
    // Check for brace notation in CSS variable values
    if (isBraceNotation(value)) {
      const locations = varLocations.get(varName) || new Set()
      const locationStr = Array.from(locations).join(', ')
      const isRoot = locationStr.includes('root')
      const locationType: BrokenReference['location'] = isRoot ? 'root' : 
                                                        locationStr.includes('stylesheet') ? 'stylesheet' :
                                                        locationStr.includes('element') ? 'element' : 'computed'
      broken.push({
        variable: varName,
        value: value,
        referencedVar: value,
        reason: 'brace-notation',
        element: locationStr,
        location: locationType,
      })
    }
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
              if (cssValue && cssValue.includes('--recursica-')) {
                // Extract all --recursica- variable references from the CSS value
                // This regex matches --recursica-* variable names anywhere in the value
                // It handles both direct references and nested var() calls
                const varNamePattern = /--recursica-[a-z0-9-]+/g
                let match
                while ((match = varNamePattern.exec(cssValue)) !== null) {
                  const referencedVar = match[0]
                  // Track that this variable is referenced in a stylesheet
                  if (!varLocations.has(`usage:${referencedVar}`)) {
                    varLocations.set(`usage:${referencedVar}`, new Set())
                  }
                  varLocations.get(`usage:${referencedVar}`)!.add(`stylesheet:${selector}:${cssProp}`)
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
      if (value && value.includes('--recursica-')) {
        // Extract all --recursica- variable references from the CSS value
        // This regex matches --recursica-* variable names anywhere in the value
        const varNamePattern = /--recursica-[a-z0-9-]+/g
        let match
        while ((match = varNamePattern.exec(value)) !== null) {
          const referencedVar = match[0]
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
  
  // After collecting all variables, check for broken references from stylesheet CSS property values
  // This catches cases where CSS properties use var() but the variable isn't defined
  for (const [usageKey, usageLocations] of varLocations.entries()) {
    if (usageKey.startsWith('usage:')) {
      const referencedVar = usageKey.replace('usage:', '')
      if (referencedVar.startsWith('--recursica-')) {
        // Skip component-instance variables (calculated values set on component instances)
        if (COMPONENT_INSTANCE_VARS.has(referencedVar)) {
          continue
        }
        
        // Check if this variable is used as a fallback for component-level variables
        let isUsedAsComponentFallback = false
        const checkValueForFallback = (value: string): boolean => {
          if (!value) return false
          // Pattern: var(--component-var, var(--recursica-...))
          const fallbackPattern = new RegExp(`var\\s*\\(\\s*(--[a-z-]+)\\s*,\\s*var\\s*\\(\\s*${referencedVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\)\\s*\\)`, 'i')
          const match = value.match(fallbackPattern)
          if (match) {
            const primaryVar = match[1]
            const componentVarPattern = /^--(toast|button|avatar|badge|switch)-/
            return componentVarPattern.test(primaryVar)
          }
          return false
        }
        
        // Check if used as fallback in stylesheets
        for (const location of usageLocations) {
          if (location.includes('stylesheet:')) {
            const match = location.match(/stylesheet:([^:]+):(.+)/)
            if (match) {
              const selector = match[1]
              const cssProp = match[2]
              try {
                const allStyles = Array.from(document.styleSheets)
                for (const sheet of allStyles) {
                  try {
                    const rules = Array.from(sheet.cssRules || [])
                    for (const rule of rules) {
                      if (rule instanceof CSSStyleRule) {
                        const ruleSelector = rule.selectorText || ''
                        if (ruleSelector === selector || ruleSelector.replace(/\s+/g, ' ').trim() === selector.replace(/\s+/g, ' ').trim()) {
                          const value = rule.style.getPropertyValue(cssProp)
                          if (checkValueForFallback(value)) {
                            isUsedAsComponentFallback = true
                            break
                          }
                        }
                      }
                    }
                    if (isUsedAsComponentFallback) break
                  } catch (e) {
                    // Cross-origin stylesheets can't be accessed
                  }
                }
                if (isUsedAsComponentFallback) break
              } catch (e) {
                // Ignore errors
              }
            }
          }
        }
        
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
        // Skip variables used as fallbacks for component-level variables
        if (!existsInVars && !existsInDom && !isUsedAsComponentFallback) {
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
    
    // Skip usage-check entries that are component-instance variables
    if (varName.startsWith('usage-check:')) {
      const checkVar = varName.replace('usage-check:', '')
      if (COMPONENT_INSTANCE_VARS.has(checkVar)) {
        continue
      }
    }

    // Check for brace notation (unresolved JSON references)
    // This should have been caught in addVar, but check again here as a safety net
    if (isBraceNotation(value)) {
      const locations = varLocations.get(varName) || new Set()
      const locationStr = Array.from(locations).join(', ')
      const isRoot = locationStr.includes('root')
      const locationType: BrokenReference['location'] = isRoot ? 'root' : 
                                                        locationStr.includes('stylesheet') ? 'stylesheet' :
                                                        locationStr.includes('element') ? 'element' : 'computed'
      // Only add if not already added (avoid duplicates)
      const alreadyAdded = broken.some(b => b.variable === varName && b.reason === 'brace-notation')
      if (!alreadyAdded) {
        broken.push({
          variable: varName,
          value: value,
          referencedVar: value,
          reason: 'brace-notation',
          element: locationStr,
          location: locationType,
        })
      }
      continue // Skip further processing for brace notation values
    }

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
        // Skip component-instance variables (calculated values set on component instances)
        if (COMPONENT_INSTANCE_VARS.has(referencedVarName)) {
          continue
        }
        
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
        
        // Check if this variable is used as a fallback for component-level variables
        let isUsedAsComponentFallback = false
        if (value) {
          // Escape special regex characters in the referencedVarName
          const escapedVar = referencedVarName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // Pattern: var(--component-var, var(--recursica-...))
          const fallbackPattern = new RegExp(
            `var\\s*\\(\\s*(--[a-z0-9-]+)\\s*,\\s*var\\s*\\(\\s*${escapedVar}\\s*\\)\\s*\\)`,
            'i'
          )
          const match = value.match(fallbackPattern)
          if (match) {
            const primaryVar = match[1]
            const componentVarPattern = /^--(toast|button|avatar|badge|switch)-/
            if (componentVarPattern.test(primaryVar)) {
              isUsedAsComponentFallback = true
            }
          }
        }
        
        // If the variable doesn't exist anywhere, it's broken
        // Skip variables used as fallbacks for component-level variables
        if (!existsInVars && !existsInDom && !isUsedAsComponentFallback) {
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
        
        // Check if this variable is used as a fallback (second argument in var())
        // Pattern: var(--component-var, var(--recursica-...))
        // Component-level variables like --toast-text-size, --button-bg are set by components
        // and use UIKit variables as fallbacks, so fallbacks are valid even if not directly defined
        let isUsedAsComponentFallback = false
        
        // Helper to check if a CSS value uses the referencedVar as a fallback
        const checkValueForFallback = (value: string): boolean => {
          if (!value) return false
          // Pattern: var(--component-var, var(--recursica-...))
          // Escape special regex characters in the referencedVar
          const escapedVar = referencedVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // Match: var(--component-var, var(--recursica-...))
          // Allow flexible whitespace
          const fallbackPattern = new RegExp(
            `var\\s*\\(\\s*(--[a-z0-9-]+)\\s*,\\s*var\\s*\\(\\s*${escapedVar}\\s*\\)\\s*\\)`,
            'i'
          )
          
          const match = value.match(fallbackPattern)
          if (match) {
            const primaryVar = match[1]
            // Check if primary variable is a component-level variable
            // Component-level vars follow pattern: --component-prop (e.g., --toast-text-size, --button-bg)
            const componentVarPattern = /^--(toast|button|avatar|badge|switch)-/
            if (componentVarPattern.test(primaryVar)) {
              return true
            }
          }
          return false
        }
        
        // Check stylesheet locations
        for (const location of usageLocations) {
          if (location.includes('stylesheet:')) {
            // Extract the CSS value from the location
            const match = location.match(/stylesheet:([^:]+):(.+)/)
            if (match) {
              const selector = match[1]
              const cssProp = match[2]
              try {
                const allStyles = Array.from(document.styleSheets)
                for (const sheet of allStyles) {
                  try {
                    const rules = Array.from(sheet.cssRules || [])
                    for (const rule of rules) {
                      if (rule instanceof CSSStyleRule) {
                        // Match selector (may need to normalize)
                        const ruleSelector = rule.selectorText || ''
                        if (ruleSelector === selector || ruleSelector.replace(/\s+/g, ' ').trim() === selector.replace(/\s+/g, ' ').trim()) {
                          const value = rule.style.getPropertyValue(cssProp)
                          if (checkValueForFallback(value)) {
                            isUsedAsComponentFallback = true
                            break
                          }
                        }
                      }
                    }
                    if (isUsedAsComponentFallback) break
                  } catch (e) {
                    // Cross-origin stylesheets can't be accessed
                  }
                }
                if (isUsedAsComponentFallback) break
              } catch (e) {
                // Ignore errors
              }
            }
          } else if (location.includes('element-') || location.includes('used-in:')) {
            // Also check element inline styles and computed styles
            try {
              for (const el of allElements) {
                const elInline = (el as HTMLElement).style
                const elComputed = getComputedStyle(el)
                
                // Check all CSS properties for this element
                if (elInline) {
                  for (let i = 0; i < elInline.length; i++) {
                    const prop = elInline[i]
                    const value = elInline.getPropertyValue(prop)
                    if (checkValueForFallback(value)) {
                      isUsedAsComponentFallback = true
                      break
                    }
                  }
                }
                
                if (!isUsedAsComponentFallback && elComputed) {
                  for (let i = 0; i < elComputed.length; i++) {
                    const prop = elComputed[i]
                    const value = elComputed.getPropertyValue(prop)
                    if (checkValueForFallback(value)) {
                      isUsedAsComponentFallback = true
                      break
                    }
                  }
                }
                
                if (isUsedAsComponentFallback) break
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }
        
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
        // Skip component-instance variables (calculated values set on component instances)
        // Skip variables used as fallbacks for component-level variables (e.g., --toast-text-size uses UIKit var as fallback)
        if (!existsInVars && !existsInDom && !COMPONENT_INSTANCE_VARS.has(referencedVar) && 
            !isUsedAsComponentFallback) {
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
    'brace-notation': [] as BrokenReference[],
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

  if (byReason['brace-notation'].length > 0) {
    report += `🔴 Brace Notation (Unresolved JSON Reference) (${byReason['brace-notation'].length}):\n`
    for (const ref of byReason['brace-notation']) {
      report += `  • ${ref.variable}\n`
      report += `    → Value: ${ref.value}\n`
      if (ref.element) {
        report += `    → Location: ${ref.element}\n`
      }
      report += `\n`
    }
  }

  return report
}

