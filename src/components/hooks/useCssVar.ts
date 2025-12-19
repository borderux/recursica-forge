/**
 * useCssVar Hook
 * 
 * Hook for reading CSS variables with fallback support.
 * Watches for changes and updates reactively.
 */

import { useState, useEffect } from 'react'

export function useCssVar(varName: string, fallback?: string): string {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return fallback || ''
    const root = document.documentElement
    // Try inline style first
    let val = root.style.getPropertyValue(varName).trim()
    if (!val) {
      const computed = getComputedStyle(root)
      val = computed.getPropertyValue(varName).trim()
    }
    const finalValue = val || fallback || ''
    if (varName.includes('border-size')) {
      console.log(`useCssVar: Initial value for ${varName} = "${finalValue}"`)
    }
    return finalValue
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateValue = () => {
      const root = document.documentElement
      // Try reading from inline style first (faster, more direct)
      let value = root.style.getPropertyValue(varName).trim()
      // Fall back to computed style if not in inline style
      if (!value) {
        const computed = getComputedStyle(root)
        value = computed.getPropertyValue(varName).trim()
      }
      const finalValue = value || fallback || ''
      // Debug logging for border-size
      if (varName.includes('border-size')) {
        console.log(`useCssVar: ${varName} = "${finalValue}" (inline: "${root.style.getPropertyValue(varName)}")`)
      }
      setValue(finalValue)
    }

    // Initial value
    updateValue()

    // Watch for changes using MutationObserver
    // Use a more aggressive approach: check for any style attribute changes
    const observer = new MutationObserver((mutations) => {
      // Check if any mutation affects the style attribute
      const hasStyleChange = mutations.some(mutation => 
        mutation.type === 'attributes' && mutation.attributeName === 'style'
      )
      if (hasStyleChange) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(updateValue)
      }
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
      attributeOldValue: false,
    })

    // Also listen for CSS variable changes via custom event
    // This is dispatched by updateCssVar when variables are updated
    const handleVarChange = (event?: CustomEvent) => {
      // Debug logging
      if (varName.includes('border-size')) {
        console.log(`useCssVar: Received cssvarchange event`, event?.detail)
      }
      // If event specifies a variable name, only update if it matches
      if (event?.detail?.cssVarName) {
        if (event.detail.cssVarName === varName) {
          if (varName.includes('border-size')) {
            console.log(`useCssVar: Matched varName, updating value`)
          }
          requestAnimationFrame(updateValue)
        }
      } else {
        // Update for any CSS variable change
        if (varName.includes('border-size')) {
          console.log(`useCssVar: No varName in event, updating anyway`)
        }
        requestAnimationFrame(updateValue)
      }
    }
    window.addEventListener('cssvarchange', handleVarChange as EventListener)
    
    // Also add a polling fallback for border-size to ensure we catch changes
    let pollInterval: number | undefined
    if (varName.includes('border-size')) {
      pollInterval = window.setInterval(() => {
        const root = document.documentElement
        const currentValue = root.style.getPropertyValue(varName).trim()
        const stateValue = value
        if (currentValue !== stateValue && currentValue) {
          console.log(`useCssVar: Polling detected change: "${stateValue}" -> "${currentValue}"`)
          updateValue()
        }
      }, 100) // Poll every 100ms
    }

    return () => {
      observer.disconnect()
      window.removeEventListener('cssvarchange', handleVarChange)
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [varName, fallback])

  return value
}

/**
 * Reads a CSS variable synchronously (non-reactive)
 */
export function readCssVar(varName: string, fallback?: string): string {
  if (typeof window === 'undefined') return fallback || ''
  const root = document.documentElement
  const computed = getComputedStyle(root)
  return computed.getPropertyValue(varName).trim() || fallback || ''
}

