import { getVarsStore } from './store/varsStore'
import { validateAllJsonSchemas } from './utils/validateJsonSchemas'
import tokensImport from '../vars/Tokens.json'
import themeImport from '../vars/Brand.json'
import uikitImport from '../vars/UIKit.json'

// Initialize the store and compute/apply initial CSS vars before React mounts
export function bootstrapTheme() {
  try {
    // Validate JSON schemas before initializing store
    const theme = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
    validateAllJsonSchemas(theme, tokensImport as any, uikitImport as any)
    
    getVarsStore()
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


