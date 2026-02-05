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
 * Patterns for CSS variables that are set dynamically on component instances
 * These are valid even if not found on :root during audit
 */
const COMPONENT_INSTANCE_VAR_PATTERNS = [
  /^--recursica-ui-kit-components-menu-item-variants-styles-(hover|selected|focused)-properties-colors-layer-\d+-background$/,
]

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
    const elInline = (el as HTMLElement).style

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
        
        // Check if it matches component-instance variable patterns
        if (COMPONENT_INSTANCE_VAR_PATTERNS.some(pattern => pattern.test(referencedVarName))) {
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
        // Skip component-instance variables (calculated values set on component instances)
        if (COMPONENT_INSTANCE_VARS.has(referencedVar)) {
          continue
        }
        
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
                const elInline = (el as HTMLElement).style
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

/**
 * Deep audit issue with detailed information for fixing
 */
export interface DeepAuditIssue {
  cssVar: string
  element: HTMLElement | null
  elementPath: string // HTML node tree path (e.g., "html > body > div.button-container > button")
  sourceFile: string | null // Likely source file (e.g., "Button.tsx")
  cssProperty: string // CSS property using the variable (e.g., "background-color")
  value: string // The CSS value containing the variable
  issueType: 'undefined' | 'malformed' | 'wrong-format' | 'wrong-scope' | 'circular'
  suggestedFix: string[] // Step-by-step fix instructions
  similarVars?: string[] // Similar variable names that exist (for format mismatches)
}

/**
 * Deep audit that checks all DOM elements and traces CSS variable references
 * Returns detailed issues with fix instructions
 */
export function deepAuditCssVars(): DeepAuditIssue[] {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return []
  }

  const issues: DeepAuditIssue[] = []
  const allElements = document.querySelectorAll('*')
  const root = document.documentElement
  const allDefinedVars = new Set<string>()
  const varValues = new Map<string, string>()
  const checkedVars = new Set<string>() // Track which vars we've already checked to avoid duplicates

  // Helper to normalize a key segment (hyphens/underscores -> underscores, lowercase)
  const normalizeKeySegment = (key: string): string => {
    return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase()
  }

  // Helper to get element path for identification
  const getElementPath = (el: Element): string => {
    if (el === root) return 'html'
    const path: string[] = []
    let current: Element | null = el
    while (current && current !== root) {
      let selector = current.tagName.toLowerCase()
      if (current.id) {
        selector += `#${current.id}`
      } else if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).slice(0, 3).join('.')
        if (classes) selector += `.${classes}`
      }
      path.unshift(selector)
      current = current.parentElement
    }
    return path.length > 0 ? `html > ${path.join(' > ')}` : 'html'
  }

  // Helper to identify likely source file from element
  const identifySourceFile = (el: Element): string | null => {
    // Try React DevTools fiber data
    const reactKey = Object.keys(el).find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'))
    if (reactKey) {
      const fiber = (el as any)[reactKey]
      if (fiber) {
        let current = fiber
        let depth = 0
        while (current && depth < 10) {
          if (current._debugSource) {
            const fileName = current._debugSource.fileName
            if (fileName) {
              // Extract just the filename
              const match = fileName.match(/([^/\\]+\.(tsx?|jsx?))$/)
              if (match) return match[1]
            }
          }
          if (current.elementType && typeof current.elementType === 'function') {
            const componentName = current.elementType.name || current.elementType.displayName
            if (componentName && componentName !== 'Anonymous') {
              // Infer filename from component name
              const inferredFile = `${componentName}.tsx`
              return inferredFile
            }
          }
          current = current.return
          depth++
        }
      }
    }

    // Try to infer from class names
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(/\s+/)
      for (const cls of classes) {
        // Common patterns: component-name, ComponentName, etc.
        const componentMatch = cls.match(/^([A-Z][a-zA-Z0-9]+)/)
        if (componentMatch) {
          return `${componentMatch[1]}.tsx`
        }
      }
    }

    return null
  }

  // Helper to check if CSS variable is defined (including scoped variables)
  const isCssVarDefined = (varName: string, element?: HTMLElement): boolean => {
    // First check if we already collected this variable in the first pass
    if (allDefinedVars.has(varName)) return true
    
    // Check root first
    const rootValue = getComputedStyle(root).getPropertyValue(varName)
    if (rootValue !== '') return true

    // Check if it's a scoped variable (theme/layer scoped)
    // Note: Scoped variables like --recursica-brand-themes-light-palettes-... are NOT on :root
    // They're defined in scoped stylesheets that only apply with theme classes
    if (varName.includes('-themes-') && varName.startsWith('--recursica-brand-')) {
      // Try to get theme from variable name
      const themeMatch = varName.match(/--recursica-brand-themes-([a-z]+)-/)
      if (themeMatch) {
        const theme = themeMatch[1]
        
        // Check scoped stylesheets if available via window global
        try {
          const win = window as any
          if (win.__recursicaGetInlineStylesheetManager) {
            const manager = win.__recursicaGetInlineStylesheetManager('brand')
            if (manager && typeof manager.getScopedRules === 'function') {
              const scopedRules = manager.getScopedRules()
              const themeKey = `${theme}:*`
              const themeVars = scopedRules.get(themeKey) || {}
              if (themeVars[varName]) return true
            }
          }
        } catch (e) {
          // Ignore errors - fall back to DOM check
        }

        // Check on a temporary element with theme class
        // This is the most reliable way to check scoped variables
        const testEl = document.createElement('div')
        testEl.className = `recursica-theme-${theme}`
        testEl.setAttribute('data-recursica-theme', theme)
        testEl.style.display = 'none'
        testEl.style.visibility = 'hidden'
        testEl.style.position = 'absolute'
        document.body.appendChild(testEl)
        try {
          const computed = getComputedStyle(testEl).getPropertyValue(varName)
          document.body.removeChild(testEl)
          if (computed !== '') return true
        } catch (e) {
          document.body.removeChild(testEl)
        }
      }
    }

    // Check all elements
    for (const el of allElements) {
      const computed = getComputedStyle(el).getPropertyValue(varName)
      if (computed !== '') return true
      const inline = (el as HTMLElement).style
      if (inline && inline.getPropertyValue(varName) !== '') return true
    }

    return false
  }

  // Helper to extract all CSS variable references from a value
  const extractVarRefs = (value: string): string[] => {
    const refs: string[] = []
    const varPattern = /var\s*\(\s*([^,)]+)/g
    let match
    while ((match = varPattern.exec(value)) !== null) {
      const varName = match[1].trim()
      if (varName.startsWith('--recursica-')) {
        refs.push(varName)
      }
    }
    return refs
  }

  // Helper to trace a CSS variable value recursively
  const traceCssVar = (varName: string, visited: Set<string> = new Set(), depth: number = 0): { resolved: boolean; chain: string[] } => {
    if (depth > 10 || visited.has(varName)) {
      return { resolved: false, chain: Array.from(visited) }
    }
    visited.add(varName)

    const value = readCssVarValue(varName)
    if (!value) {
      return { resolved: false, chain: Array.from(visited) }
    }

    // If it's not a var() reference, it's resolved
    if (!value.includes('var(')) {
      return { resolved: true, chain: Array.from(visited) }
    }

    // Extract nested var() references
    const refs = extractVarRefs(value)
    for (const ref of refs) {
      const result = traceCssVar(ref, new Set(visited), depth + 1)
      if (!result.resolved) {
        return result
      }
    }

    return { resolved: true, chain: Array.from(visited) }
  }

  // Helper to read CSS variable value (checks all elements and scoped variables)
  const readCssVarValue = (varName: string): string | null => {
    try {
      // Check root inline first
      const rootInline = root.style.getPropertyValue(varName)
      if (rootInline !== '') return rootInline.trim()

      // Check root computed
      const rootComputed = getComputedStyle(root).getPropertyValue(varName)
      if (rootComputed !== '') return rootComputed.trim()

      // Check if it's a scoped variable
      if (varName.includes('-themes-') && varName.startsWith('--recursica-brand-')) {
        const themeMatch = varName.match(/--recursica-brand-themes-([a-z]+)-/)
        if (themeMatch) {
          const theme = themeMatch[1]
          const testEl = document.createElement('div')
          testEl.className = `recursica-theme-${theme}`
          testEl.setAttribute('data-recursica-theme', theme)
          testEl.style.display = 'none'
          testEl.style.visibility = 'hidden'
          testEl.style.position = 'absolute'
          document.body.appendChild(testEl)
          try {
            const computed = getComputedStyle(testEl).getPropertyValue(varName)
            document.body.removeChild(testEl)
            if (computed !== '') return computed.trim()
          } catch (e) {
            document.body.removeChild(testEl)
          }
        }
      }

      // Check all elements
      for (const el of allElements) {
        const computed = getComputedStyle(el).getPropertyValue(varName)
        if (computed !== '') return computed.trim()
        const inline = (el as HTMLElement).style
        if (inline) {
          const inlineValue = inline.getPropertyValue(varName)
          if (inlineValue !== '') return inlineValue.trim()
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return null
  }

  // Helper to detect malformed variable names
  const detectMalformedVar = (varName: string): { isMalformed: boolean; issues: string[] } => {
    const issues: string[] = []
    
    // Check for double hyphens
    if (varName.includes('--')) {
      const doubleHyphenMatch = varName.match(/--+/g)
      if (doubleHyphenMatch && doubleHyphenMatch.some(m => m.length > 2)) {
        issues.push('double-hyphens')
      }
    }

    // Check for invalid characters
    if (!/^--[a-z0-9-]+$/i.test(varName)) {
      issues.push('invalid-characters')
    }

    // Check for trailing hyphens
    if (varName.endsWith('-')) {
      issues.push('trailing-hyphen')
    }

    return { isMalformed: issues.length > 0, issues }
  }

  // Helper to find similar variable names
  const findSimilarVars = (varName: string, allVars: Set<string>): string[] => {
    const similar: string[] = []
    const varParts = varName.split('-')
    
    for (const definedVar of allVars) {
      if (definedVar === varName) continue
      
      const definedParts = definedVar.split('-')
      // Check if they have similar structure (same prefix, similar length)
      if (varParts.length === definedParts.length) {
        let differences = 0
        for (let i = 0; i < Math.min(varParts.length, definedParts.length); i++) {
          if (varParts[i] !== definedParts[i]) {
            differences++
          }
        }
        // If only 1-2 segments differ, it's similar
        if (differences <= 2) {
          similar.push(definedVar)
        }
      }
    }

    return similar.slice(0, 5) // Return top 5 similar
  }

  // Helper to generate fix instructions
  const generateFixInstructions = (
    varName: string,
    issueType: DeepAuditIssue['issueType'],
    element: HTMLElement | null,
    sourceFile: string | null,
    similarVars?: string[]
  ): string[] => {
    const instructions: string[] = []

    if (issueType === 'undefined') {
      instructions.push(`1. The CSS variable "${varName}" is not defined anywhere in the DOM or stylesheets.`)
      
      // Check if it's a format issue
      const malformed = detectMalformedVar(varName)
      if (malformed.isMalformed) {
        instructions.push(`2. The variable name appears malformed: ${malformed.issues.join(', ')}.`)
        instructions.push(`3. Fix the variable name in the code that uses it (${sourceFile || 'unknown file'}).`)
        instructions.push(`4. Ensure the variable name follows the normalization rules: segments joined with hyphens, keys normalized with underscores.`)
      } else if (similarVars && similarVars.length > 0) {
        instructions.push(`2. Similar variables exist: ${similarVars.slice(0, 3).join(', ')}.`)
        instructions.push(`3. Check if you meant to use one of these instead.`)
        instructions.push(`4. If the variable should exist, verify it's being generated by the parsers (parseBrand.ts, parseUIKit.ts, parseTokens.ts).`)
      } else {
        instructions.push(`2. Check if this variable should be generated by the parsers (parseBrand.ts, parseUIKit.ts, parseTokens.ts).`)
        instructions.push(`3. Verify the JSON structure matches the expected format for this variable.`)
        instructions.push(`4. If the variable name is incorrect, fix it in ${sourceFile || 'the file using it'}.`)
      }

      instructions.push(`5. NEVER add fallback values - fix the root cause.`)
      instructions.push(`6. NEVER modify Tokens.json, Brand.json, or UIKit.json - only fix the code using the variable.`)
    } else if (issueType === 'malformed') {
      instructions.push(`1. The CSS variable name "${varName}" is malformed.`)
      instructions.push(`2. Fix the variable name in ${sourceFile || 'the file using it'}.`)
      instructions.push(`3. Ensure variable names follow normalization rules: use utility functions (toCssVarName, normalizeKeySegment) instead of manual construction.`)
    } else if (issueType === 'wrong-format') {
      instructions.push(`1. The CSS variable "${varName}" uses the wrong format.`)
      if (similarVars && similarVars.length > 0) {
        instructions.push(`2. The correct format appears to be: ${similarVars[0]}.`)
      }
      instructions.push(`3. Update the variable name in ${sourceFile || 'the file using it'} to match the correct format.`)
      instructions.push(`4. Check the inline stylesheets in browser DevTools to see the actual variable names being generated.`)
    } else if (issueType === 'wrong-scope') {
      instructions.push(`1. The CSS variable "${varName}" may be scoped to a theme/layer that's not active.`)
      instructions.push(`2. Verify the element has the required theme class (e.g., "recursica-theme-light") or layer class.`)
      instructions.push(`3. If the variable should be available, check if it's defined in the correct scoped stylesheet.`)
      instructions.push(`4. Fix the variable name if it's incorrect - do not add theme classes as a workaround.`)
    } else if (issueType === 'circular') {
      instructions.push(`1. The CSS variable "${varName}" has a circular reference.`)
      instructions.push(`2. Trace the reference chain and remove the circular dependency.`)
      instructions.push(`3. One of the variables in the chain should reference a token or direct value instead of another CSS variable.`)
    }

    return instructions
  }

  // First pass: collect all defined CSS variables
  // Check root
  for (let i = 0; i < root.style.length; i++) {
    const prop = root.style[i]
    if (prop.startsWith('--recursica-')) {
      allDefinedVars.add(prop)
      varValues.set(prop, root.style.getPropertyValue(prop).trim())
    }
  }

  // Check all elements
  for (const el of allElements) {
    const computed = getComputedStyle(el)
    const inline = (el as HTMLElement).style

    // Check computed styles
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i]
      if (prop.startsWith('--recursica-')) {
        allDefinedVars.add(prop)
        if (!varValues.has(prop)) {
          varValues.set(prop, computed.getPropertyValue(prop).trim())
        }
      }
    }

    // Check inline styles
    if (inline) {
      for (let i = 0; i < inline.length; i++) {
        const prop = inline[i]
        if (prop.startsWith('--recursica-')) {
          allDefinedVars.add(prop)
          varValues.set(prop, inline.getPropertyValue(prop).trim())
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
                allDefinedVars.add(prop)
                if (!varValues.has(prop)) {
                  varValues.set(prop, style.getPropertyValue(prop).trim())
                }
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

  // Second pass: check all elements for CSS variable usage and trace references
  for (const el of allElements) {
    const elPath = getElementPath(el)
    const sourceFile = identifySourceFile(el)
    const computed = getComputedStyle(el)
    const inline = (el as HTMLElement).style

    // Check all CSS properties for var() references
    for (let i = 0; i < computed.length; i++) {
      const cssProp = computed[i]
      const value = computed.getPropertyValue(cssProp).trim()
      
      if (value && value.includes('--recursica-')) {
        const varRefs = extractVarRefs(value)
        
        for (const varRef of varRefs) {
          if (checkedVars.has(`${elPath}:${cssProp}:${varRef}`)) continue
          checkedVars.add(`${elPath}:${cssProp}:${varRef}`)

          // Check if variable is defined
          const isDefined = isCssVarDefined(varRef, el as HTMLElement)
          
          if (!isDefined) {
            // Trace the variable to see if nested references fail
            const trace = traceCssVar(varRef)
            
            // Determine issue type
            let issueType: DeepAuditIssue['issueType'] = 'undefined'
            const malformed = detectMalformedVar(varRef)
            if (malformed.isMalformed) {
              issueType = 'malformed'
            } else if (trace.chain.length > 1 && !trace.resolved) {
              // Check if it's a circular reference
              const lastVar = trace.chain[trace.chain.length - 1]
              if (trace.chain.includes(lastVar) && trace.chain.indexOf(lastVar) < trace.chain.length - 1) {
                issueType = 'circular'
              }
            }

            // Check for format mismatches
            // Only flag as "wrong-format" if there's a very close match (same structure, only 1 segment differs)
            // AND the variable name appears to be a typo or invalid token key
            const similar = findSimilarVars(varRef, allDefinedVars)
            if (similar.length > 0) {
              // Check if this looks like a typo: same prefix/suffix, only middle segment differs
              const varParts = varRef.split('-')
              const hasVeryCloseMatch = similar.some(similarVar => {
                const similarParts = similarVar.split('-')
                if (varParts.length !== similarParts.length) return false
                // Count differences - if only 1 segment differs, it's likely a typo
                let differences = 0
                for (let i = 0; i < varParts.length; i++) {
                  if (varParts[i] !== similarParts[i]) {
                    differences++
                  }
                }
                return differences === 1
              })
              
              // Only flag as wrong-format if there's a very close match
              // Otherwise, it's just undefined (might be a valid reference that isn't generated yet)
              if (hasVeryCloseMatch) {
                issueType = 'wrong-format'
              }
            }

            // Check if it's a scoped variable issue
            if (varRef.includes('-themes-') && !isDefined) {
              // Check if element has theme class
              const hasThemeClass = el.classList.toString().includes('recursica-theme-')
              if (!hasThemeClass) {
                issueType = 'wrong-scope'
              }
            }

            issues.push({
              cssVar: varRef,
              element: el as HTMLElement,
              elementPath: elPath,
              sourceFile,
              cssProperty: cssProp,
              value,
              issueType,
              suggestedFix: generateFixInstructions(varRef, issueType, el as HTMLElement, sourceFile, similar),
              similarVars: similar.length > 0 ? similar : undefined
            })
          } else {
            // Variable is defined, but trace nested references
            const trace = traceCssVar(varRef)
            if (!trace.resolved && trace.chain.length > 1) {
              // Find which nested variable failed
              const failedVar = trace.chain[trace.chain.length - 1]
              if (!isCssVarDefined(failedVar, el as HTMLElement)) {
                if (!checkedVars.has(`${elPath}:${cssProp}:${failedVar}`)) {
                  checkedVars.add(`${elPath}:${cssProp}:${failedVar}`)
                  
                  const similar = findSimilarVars(failedVar, allDefinedVars)
                  let issueType: DeepAuditIssue['issueType'] = 'undefined'
                  const malformed = detectMalformedVar(failedVar)
                  if (malformed.isMalformed) {
                    issueType = 'malformed'
                  } else if (similar.length > 0) {
                    // Only flag as "wrong-format" if there's a very close match (same structure, only 1 segment differs)
                    const varParts = failedVar.split('-')
                    const hasVeryCloseMatch = similar.some(similarVar => {
                      const similarParts = similarVar.split('-')
                      if (varParts.length !== similarParts.length) return false
                      let differences = 0
                      for (let i = 0; i < varParts.length; i++) {
                        if (varParts[i] !== similarParts[i]) {
                          differences++
                        }
                      }
                      return differences === 1
                    })
                    if (hasVeryCloseMatch) {
                      issueType = 'wrong-format'
                    }
                  }

                  issues.push({
                    cssVar: failedVar,
                    element: el as HTMLElement,
                    elementPath: elPath,
                    sourceFile,
                    cssProperty: cssProp,
                    value: readCssVarValue(failedVar) || `var(${failedVar})`,
                    issueType,
                    suggestedFix: generateFixInstructions(failedVar, issueType, el as HTMLElement, sourceFile, similar),
                    similarVars: similar.length > 0 ? similar : undefined
                  })
                }
              }
            }
          }
        }
      }
    }

    // Also check inline styles
    if (inline) {
      for (let i = 0; i < inline.length; i++) {
        const cssProp = inline[i]
        const value = inline.getPropertyValue(cssProp).trim()
        
        if (value && value.includes('--recursica-')) {
          const varRefs = extractVarRefs(value)
          
          for (const varRef of varRefs) {
            if (checkedVars.has(`${elPath}:inline:${cssProp}:${varRef}`)) continue
            checkedVars.add(`${elPath}:inline:${cssProp}:${varRef}`)

            const isDefined = isCssVarDefined(varRef, el as HTMLElement)
            
            if (!isDefined) {
              const trace = traceCssVar(varRef)
              let issueType: DeepAuditIssue['issueType'] = 'undefined'
              const malformed = detectMalformedVar(varRef)
              if (malformed.isMalformed) {
                issueType = 'malformed'
              }
              const similar = findSimilarVars(varRef, allDefinedVars)
              if (similar.length > 0) {
                // Only flag as "wrong-format" if there's a very close match (same structure, only 1 segment differs)
                const varParts = varRef.split('-')
                const hasVeryCloseMatch = similar.some(similarVar => {
                  const similarParts = similarVar.split('-')
                  if (varParts.length !== similarParts.length) return false
                  let differences = 0
                  for (let i = 0; i < varParts.length; i++) {
                    if (varParts[i] !== similarParts[i]) {
                      differences++
                    }
                  }
                  return differences === 1
                })
                if (hasVeryCloseMatch) {
                  issueType = 'wrong-format'
                }
              }

              issues.push({
                cssVar: varRef,
                element: el as HTMLElement,
                elementPath: elPath,
                sourceFile,
                cssProperty: cssProp,
                value,
                issueType,
                suggestedFix: generateFixInstructions(varRef, issueType, el as HTMLElement, sourceFile, similar),
                similarVars: similar.length > 0 ? similar : undefined
              })
            }
          }
        }
      }
    }
  }

  return issues
}


