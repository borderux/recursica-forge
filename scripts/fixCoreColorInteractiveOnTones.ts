/**
 * Script to fix core color interactive on-tone values for accessibility
 * 
 * For each core color (black, white, alert, warn, success):
 * 1. Check contrast between interactive on-tone and tone
 * 2. Step through color scale to find accessible color
 * 3. If none found, try white, then black
 * 4. Update Brand.json with found values
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { contrastRatio } from '../src/modules/theme/contrastUtil'
import { buildTokenIndex, resolveBraceRef, type JsonLike } from '../src/core/resolvers/tokens'

const AA_THRESHOLD = 4.5
const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

// Helper to resolve a reference to hex by traversing JSON
function resolveRefToHex(ref: string, tokens: JsonLike, brand: JsonLike, mode: 'light' | 'dark', depth = 0): string | null {
  if (depth > 10) return null
  
  const tokenIndex = buildTokenIndex(tokens)
  
  // Build theme accessor for brand references
  const themeAccessor = (path: string): any => {
    const parts = path.split('.').filter(Boolean)
    let node: any = brand
    for (const p of parts) {
      if (!node) break
      let next = (node as any)[p]
      // Check if inside $value
      if (next == null && node && typeof node === 'object' && (node as any)['$value'] && typeof (node as any)['$value'] === 'object') {
        next = (node as any)['$value'][p]
      }
      node = next
    }
    // If result is an object with $value, extract it
    if (node && typeof node === 'object' && '$value' in node) {
      return node.$value
    }
    return node
  }
  
  const resolved = resolveBraceRef(ref, tokenIndex, themeAccessor)
  if (typeof resolved === 'string') {
    // Check if it's already a hex
    if (/^#?[0-9a-f]{6}$/i.test(resolved)) {
      return resolved.startsWith('#') ? resolved.toLowerCase() : `#${resolved.toLowerCase()}`
    }
    // If it's still a reference, resolve further
    if (resolved.startsWith('{') && resolved.endsWith('}')) {
      return resolveRefToHex(resolved, tokens, brand, mode, depth + 1)
    }
  }
  
  return null
}

// Find accessible color by stepping through scale
function findAccessibleColor(
  toneHex: string,
  interactiveHex: string,
  tokens: JsonLike,
  brand: JsonLike,
  mode: 'light' | 'dark'
): string {
  const tokenIndex = buildTokenIndex(tokens)
  
  // Check if current interactive color is accessible
  const currentContrast = contrastRatio(toneHex, interactiveHex)
  if (currentContrast >= AA_THRESHOLD) {
    // Current is accessible, but we need to return a Brand.json reference
    // Find what the current interactive hex maps to
    return findBrandJsonRefForHex(interactiveHex, tokens, brand, mode)
  }
  
  // Find the family and level of the interactive color
  const interactiveFamily = findColorFamilyAndLevel(interactiveHex, tokens)
  
  if (interactiveFamily) {
    // Step through the color scale
    const { family, level } = interactiveFamily
    const normalizedLevel = level === '000' ? '050' : level
    const startIdx = LEVELS.indexOf(normalizedLevel)
    
    if (startIdx !== -1) {
      // Try lighter first (lower index = lighter)
      for (let i = startIdx - 1; i >= 0; i--) {
        const testLevel = LEVELS[i]
        const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
        const testHex = tokenIndex.get(`color/${family}/${normalizedTestLevel}`)
        if (typeof testHex === 'string') {
          const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
          const contrast = contrastRatio(toneHex, hex)
          if (contrast >= AA_THRESHOLD) {
            return `{tokens.color.${family}.${normalizedTestLevel}}`
          }
        }
      }
      
      // Try darker (higher index = darker)
      for (let i = startIdx + 1; i < LEVELS.length; i++) {
        const testLevel = LEVELS[i]
        const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
        const testHex = tokenIndex.get(`color/${family}/${normalizedTestLevel}`)
        if (typeof testHex === 'string') {
          const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
          const contrast = contrastRatio(toneHex, hex)
          if (contrast >= AA_THRESHOLD) {
            return `{tokens.color.${family}.${normalizedTestLevel}}`
          }
        }
      }
    }
  }
  
  // Try white
  const whiteRef = `{brand.themes.${mode}.palettes.core-colors.white}`
  const whiteHex = resolveRefToHex(whiteRef, tokens, brand, mode) || '#ffffff'
  const whiteContrast = contrastRatio(toneHex, whiteHex)
  if (whiteContrast >= AA_THRESHOLD) {
    return whiteRef
  }
  
  // Try black
  const blackRef = `{brand.themes.${mode}.palettes.core-colors.black}`
  const blackHex = resolveRefToHex(blackRef, tokens, brand, mode) || '#000000'
  const blackContrast = contrastRatio(toneHex, blackHex)
  if (blackContrast >= AA_THRESHOLD) {
    return blackRef
  }
  
  // Neither white nor black passes, but return the one with higher contrast
  return whiteContrast >= blackContrast ? whiteRef : blackRef
}

// Find Brand.json reference for a hex color
function findBrandJsonRefForHex(hex: string, tokens: JsonLike, brand: JsonLike, mode: 'light' | 'dark'): string {
  const found = findColorFamilyAndLevel(hex, tokens)
  if (found) {
    const normalizedLevel = found.level === '000' ? '050' : found.level
    return `{tokens.color.${found.family}.${normalizedLevel}}`
  }
  
  // Check if it's white or black
  const normalizedHex = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
  if (normalizedHex === '#ffffff' || normalizedHex === '#fff') {
    return `{brand.themes.${mode}.palettes.core-colors.white}`
  }
  if (normalizedHex === '#000000' || normalizedHex === '#000') {
    return `{brand.themes.${mode}.palettes.core-colors.black}`
  }
  
  // Default to white
  return `{brand.themes.${mode}.palettes.core-colors.white}`
}

// Find color family and level for a hex
function findColorFamilyAndLevel(hex: string, tokens: JsonLike): { family: string; level: string } | null {
  const normalizedHex = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
  const jsonColors: any = (tokens as any)?.tokens?.color || {}
  
  for (const [family, levels] of Object.entries(jsonColors)) {
    if (family === 'translucent') continue
    const familyObj = levels as any
    for (const [level, value] of Object.entries(familyObj)) {
      const tokenValue = (value as any)?.$value || value
      if (typeof tokenValue === 'string') {
        const tokenHex = tokenValue.startsWith('#') ? tokenValue.toLowerCase() : `#${tokenValue.toLowerCase()}`
        if (tokenHex === normalizedHex) {
          return { family, level }
        }
      }
    }
  }
  return null
}

function main() {
  const brandPath = join(process.cwd(), 'src/vars/Brand.json')
  const tokensPath = join(process.cwd(), 'src/vars/Tokens.json')
  
  const brandJson = JSON.parse(readFileSync(brandPath, 'utf-8'))
  const tokensJson = JSON.parse(readFileSync(tokensPath, 'utf-8'))
  
  const coreColors = ['black', 'white', 'alert', 'warning', 'success']
  const modes: Array<'light' | 'dark'> = ['light', 'dark']
  
  for (const mode of modes) {
    const coreColorsPath = brandJson.brand?.themes?.[mode]?.palettes?.['core-colors']?.$value
    if (!coreColorsPath) continue
    
    for (const colorName of coreColors) {
      const colorDef = coreColorsPath[colorName]
      if (!colorDef) continue
      
      // Get tone hex (the background color of the core color)
      const toneRef = colorDef.tone?.$value
      if (!toneRef) {
        console.log(`Skipping ${mode} ${colorName}: no tone`)
        continue
      }
      const toneHex = resolveRefToHex(toneRef, tokensJson, brandJson, mode)
      if (!toneHex) {
        console.log(`Skipping ${mode} ${colorName}: could not resolve tone ${toneRef}`)
        continue
      }
      
      // Get the interactive tone (the color that will be displayed on the tone background)
      // Try direct path first
      let interactiveToneHex: string | null = null
      try {
        const interactiveTonePath = brandJson.brand?.themes?.[mode]?.palettes?.['core-colors']?.$value?.interactive?.default?.tone?.$value
        if (interactiveTonePath) {
          interactiveToneHex = resolveRefToHex(interactiveTonePath, tokensJson, brandJson, mode)
        }
      } catch (e) {
        // Fallback to reference resolution
      }
      
      if (!interactiveToneHex) {
        const interactiveToneRef = `{brand.themes.${mode}.palettes.core-colors.interactive.default.tone}`
        interactiveToneHex = resolveRefToHex(interactiveToneRef, tokensJson, brandJson, mode)
      }
      
      if (!interactiveToneHex) {
        console.log(`Skipping ${mode} ${colorName}: could not resolve interactive tone`)
        continue
      }
      
      // Check contrast between tone and interactive tone
      const contrast = contrastRatio(toneHex, interactiveToneHex)
      console.log(`${mode} ${colorName}: tone=${toneHex}, interactive tone=${interactiveToneHex}, contrast=${contrast.toFixed(2)}`)
      
      // Find accessible on-tone color (the color to use ON the interactive tone when displayed on the tone background)
      // We need to find a color that has good contrast with the tone background
      const accessibleRef = findAccessibleColor(toneHex, interactiveToneHex, tokensJson, brandJson, mode)
      
      // Get current interactive value
      const currentInteractiveRef = colorDef.interactive?.$value
      
      // Update Brand.json
      if (accessibleRef && accessibleRef !== currentInteractiveRef) {
        console.log(`  Updating ${mode} ${colorName} interactive: ${currentInteractiveRef} -> ${accessibleRef}`)
        colorDef.interactive.$value = accessibleRef
      } else {
        console.log(`  No update needed for ${mode} ${colorName}`)
      }
    }
  }
  
  // Write updated Brand.json
  writeFileSync(brandPath, JSON.stringify(brandJson, null, 2) + '\n', 'utf-8')
  console.log('Brand.json updated successfully!')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }

