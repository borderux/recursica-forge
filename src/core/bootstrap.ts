import { getVarsStore } from './store/varsStore'
import { validateAllJsonSchemas } from './utils/validateJsonSchemas'
import tokensImport from '../vars/Tokens.json'
import themeImport from '../vars/Brand.json'
import uikitImport from '../vars/UIKit.json'
// Note: fontUtils is imported dynamically to avoid circular dependencies

// Initialize the store and compute/apply initial CSS vars before React mounts
export function bootstrapTheme() {
  try {
    // Validate JSON schemas before initializing store
    const theme = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
    validateAllJsonSchemas(theme, tokensImport as any, uikitImport as any)
    
    getVarsStore()
    
    // Load stored custom fonts (npm/git sources) and fonts from tokens on startup
    if (typeof window !== 'undefined') {
      // Use dynamic import to avoid circular dependencies
      // Import once and use all needed functions
      import('../modules/type/fontUtils').then(({ loadStoredCustomFonts, loadFontsFromTokens, ensureFontLoaded, ensureGoogleFontsPreconnect }) => {
        // Ensure preconnect links are added early for performance
        ensureGoogleFontsPreconnect()
        
        // Load stored custom fonts first
        loadStoredCustomFonts().catch((error) => {
          console.warn('[Bootstrap] Failed to load some custom fonts:', error)
        })
        
        // Then load fonts from token values
        loadFontsFromTokens().catch((error) => {
          console.warn('[Bootstrap] Failed to load some fonts from tokens:', error)
        })
        
        // Listen for token override changes to load fonts automatically
        window.addEventListener('tokenOverridesChanged', ((ev: CustomEvent) => {
          const detail = ev.detail
          if (!detail) return
          
          // Check if a font token was changed
          const tokenName = detail.name
          if (tokenName && typeof tokenName === 'string' && (tokenName.startsWith('font/family/') || tokenName.startsWith('font/typeface/'))) {
            const fontValue = detail.value
            if (fontValue && typeof fontValue === 'string' && fontValue.trim()) {
              ensureFontLoaded(fontValue.trim()).catch((error) => {
                console.warn(`Failed to load font ${fontValue}:`, error)
              })
            }
          }
          
          // Also check all font values in the 'all' object
          const all = detail.all
          if (all && typeof all === 'object') {
            Object.entries(all).forEach(([name, value]) => {
              if (typeof name === 'string' && (name.startsWith('font/family/') || name.startsWith('font/typeface/'))) {
                const fontValue = String(value || '').trim()
                if (fontValue) {
                  ensureFontLoaded(fontValue).catch((error) => {
                    console.warn(`Failed to load font ${fontValue}:`, error)
                  })
                }
              }
            })
          }
        }) as EventListener)
      }).catch((error) => {
        console.warn('[Bootstrap] Failed to import fontUtils:', error)
      })
    }
  } catch (error) {
    // Log validation errors but don't crash the app in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[Bootstrap] Schema validation failed:', error)
      throw error
    } else {
      console.error('[Bootstrap] Schema validation failed (non-fatal):', error)
    }
  }
}


