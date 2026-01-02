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
    const computed = getComputedStyle(root)
    return computed.getPropertyValue(varName).trim() || fallback || ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateValue = () => {
      const root = document.documentElement
      const computed = getComputedStyle(root)
      setValue(computed.getPropertyValue(varName).trim() || fallback || '')
    }

    // Initial value
    updateValue()

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(updateValue)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    // Also listen for CSS variable changes via custom events
    const handleVarChange = () => updateValue()
    window.addEventListener('cssvarchange', handleVarChange)
    window.addEventListener('cssVarsUpdated', handleVarChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('cssvarchange', handleVarChange)
      window.removeEventListener('cssVarsUpdated', handleVarChange)
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

