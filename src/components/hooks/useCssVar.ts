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
    window.addEventListener('cssVarsReset', handleVarChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('cssvarchange', handleVarChange)
      window.removeEventListener('cssVarsUpdated', handleVarChange)
      window.removeEventListener('cssVarsReset', handleVarChange)
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

/**
 * useRawCssVar Hook
 * 
 * Hook for reading RAW, uncomputed CSS variables.
 * Watches for changes and updates reactively.
 */
export function useRawCssVar(varName: string, fallback?: string): string {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return fallback || ''
    
    // Check inline style first
    const inlineValue = document.documentElement.style.getPropertyValue(varName)
    if (inlineValue !== '') return inlineValue.trim()

    // Search through all style tags
    const styleElements = Array.from(document.querySelectorAll('style')).reverse()
    for (const style of styleElements) {
      if (!style.textContent) continue
      const regex = new RegExp(`${varName}\\s*:\\s*([^;}]+)`, 'g')
      let match
      let lastMatch
      while ((match = regex.exec(style.textContent)) !== null) {
        lastMatch = match[1]
      }
      if (lastMatch) return lastMatch.replace(/\/\*[\s\S]*?\*\//g, '').trim()
    }

    return fallback || ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateValue = () => {
      // Check inline style first
      const inlineValue = document.documentElement.style.getPropertyValue(varName)
      if (inlineValue !== '') {
        setValue(inlineValue.trim())
        return
      }

      // Search through all style tags
      const styleElements = Array.from(document.querySelectorAll('style')).reverse()
      for (const style of styleElements) {
        if (!style.textContent) continue
        const regex = new RegExp(`${varName}\\s*:\\s*([^;}]+)`, 'g')
        let match
        let lastMatch
        while ((match = regex.exec(style.textContent)) !== null) {
          lastMatch = match[1]
        }
        if (lastMatch) {
          setValue(lastMatch.replace(/\/\*[\s\S]*?\*\//g, '').trim())
          return
        }
      }
      
      setValue(fallback || '')
    }

    // Initial value
    updateValue()

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(updateValue)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    observer.observe(document.head, {
      childList: true,
      subtree: true,
    })

    // Also listen for CSS variable changes via custom events
    const handleVarChange = () => updateValue()
    window.addEventListener('cssvarchange', handleVarChange)
    window.addEventListener('cssVarsUpdated', handleVarChange)
    window.addEventListener('cssVarsReset', handleVarChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('cssvarchange', handleVarChange)
      window.removeEventListener('cssVarsUpdated', handleVarChange)
      window.removeEventListener('cssVarsReset', handleVarChange)
    }
  }, [varName, fallback])

  return value
}

