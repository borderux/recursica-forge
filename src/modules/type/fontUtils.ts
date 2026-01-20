/**
 * Utility functions for handling custom fonts
 */

/**
 * Cache mapping user-friendly font names to actual CSS font-family names
 * Updated when fonts are loaded from Google Fonts, npm, or git
 */
const fontFamilyNameCache = new Map<string, string>()

/**
 * Map of font names to their Google Fonts URLs from token extensions
 * Used to load fonts with the exact URL specified in Tokens.json
 */
const fontUrlMap = new Map<string, string>()

/**
 * Common serif fonts from Google Fonts
 * Most Google Fonts are sans-serif, so we only list serif ones
 */
const SERIF_FONTS = new Set([
  'merriweather', 'lora', 'playfair display', 'crimson text', 'crimson pro',
  'libre baskerville', 'eb garamond', 'source serif pro', 'pt serif',
  'cormorant garamond', 'vollkorn', 'bree serif', 'droid serif',
  'arvo', 'bitter', 'cinzel', 'della respira', 'gentium book basic',
  'libre caslon text', 'linden hill', 'neuton', 'old standard tt',
  'rokkitt', 'sanchez', 'taviraj', 'trirong', 'vollkorn sc'
])

/**
 * Determines if a font is serif or sans-serif
 * @param fontName - The font name
 * @returns 'serif' or 'sans-serif'
 */
function getFontFallback(fontName: string): 'serif' | 'sans-serif' {
  const normalized = fontName.toLowerCase().trim()
  return SERIF_FONTS.has(normalized) ? 'serif' : 'sans-serif'
}

/**
 * Ensures preconnect links for Google Fonts are in the document
 * Should be called before loading any Google Fonts
 */
export function ensureGoogleFontsPreconnect(): void {
  if (typeof document === 'undefined') return
  
  // Check if preconnect links already exist
  const existingPreconnect1 = document.querySelector('link[rel="preconnect"][href="https://fonts.googleapis.com"]')
  const existingPreconnect2 = document.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]')
  
  if (!existingPreconnect1) {
    const preconnect1 = document.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(preconnect1)
  }
  
  if (!existingPreconnect2) {
    const preconnect2 = document.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect2)
  }
}

/**
 * Gets the cached actual font-family name for a font
 * @param fontName - The user-friendly font name
 * @returns The actual font-family name to use in CSS, or the original name if not cached
 */
export function getCachedFontFamilyName(fontName: string): string {
  if (!fontName || !fontName.trim()) return fontName
  const trimmed = fontName.trim()
  const cached = fontFamilyNameCache.get(trimmed)
  if (cached) return cached
  // If not cached, return just the font name with quotes if it has spaces
  return trimmed.includes(' ') ? `"${trimmed}"` : trimmed
}

/**
 * Extracts the actual font-family name from loaded CSS
 * Parses @font-face rules to find the font-family value
 * @param fontName - The user-friendly font name (e.g., "Poppins")
 * @returns The actual font-family name from CSS, or the original name if not found
 */
function extractFontFamilyFromCSS(fontName: string): string {
  try {
    // Check all stylesheets for @font-face rules matching this font
    const sheets = Array.from(document.styleSheets)
    
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || [])
        for (const rule of rules) {
          if (rule instanceof CSSFontFaceRule) {
            const fontFamily = rule.style.fontFamily
            if (!fontFamily) continue
            
            // Google Fonts uses names like "gf_Poppins variant6" or similar patterns
            // npm/git fonts may use the font name directly or with variations
            // Check if this rule is related to our font name
            const normalizedRuleName = fontFamily.toLowerCase().replace(/\s+/g, '')
            const fontNameLower = fontName.toLowerCase()
            const fontNameNoSpaces = fontNameLower.replace(/\s+/g, '')
            
            // Match if:
            // 1. The font-family contains our font name (normalized)
            // 2. Google Fonts pattern (gf_ prefix)
            // 3. Exact match (for npm/git fonts that use the exact name)
            if (normalizedRuleName.includes(fontNameNoSpaces) || 
                normalizedRuleName === fontNameNoSpaces ||
                (fontFamily.includes('gf_') && normalizedRuleName.includes(fontNameNoSpaces.replace(/\s+/g, '_'))) ||
                fontFamily.toLowerCase() === fontNameLower) {
              // Return the exact font-family value from the @font-face rule
              // This includes the full value like "gf_Poppins variant6", Tofu
              // Remove outer quotes if present, but preserve the internal structure
              let result = fontFamily.trim()
              // If it starts and ends with quotes, remove them (we'll add them back if needed)
              if ((result.startsWith('"') && result.endsWith('"')) || 
                  (result.startsWith("'") && result.endsWith("'"))) {
                result = result.slice(1, -1)
              }
              // Return the full font-family value as it appears in the @font-face rule
              return result
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets may throw errors, skip them
        continue
      }
    }
  } catch (e) {
    console.warn('Failed to extract font-family from CSS:', e)
  }
  
  // Fallback: return the original name with quotes if it contains spaces
  return fontName.includes(' ') ? `"${fontName}"` : fontName
}

/**
 * Gets the actual font-family name for a font, checking loaded CSS
 * Updates the cache with the found name
 * @param fontName - The user-friendly font name
 * @returns Promise that resolves with the actual font-family name to use in CSS
 */
export async function getActualFontFamilyName(fontName: string): Promise<string> {
  if (!fontName || !fontName.trim()) return fontName
  
  const trimmedName = fontName.trim()
  
  // Check cache first
  if (fontFamilyNameCache.has(trimmedName)) {
    return fontFamilyNameCache.get(trimmedName)!
  }
  
  // Wait a bit for CSS to load if it was just added
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Try to extract from CSS
  const actualName = extractFontFamilyFromCSS(trimmedName)
  
  // Cache the result if we found a Google Fonts format (gf_ prefix)
  if (actualName !== trimmedName && actualName.includes('gf_')) {
    fontFamilyNameCache.set(trimmedName, actualName)
    return actualName
  }
  
  // If we found the font but it's not in Google Fonts format, check if it's from Google Fonts CSS API
  if (actualName === trimmedName || actualName.toLowerCase() === trimmedName.toLowerCase()) {
    // Check if this font was loaded from Google Fonts by looking for the stylesheet link
    // Try multiple encodings: URL encoded (%20), plus sign (+), and spaces
    const encodedName = encodeURIComponent(trimmedName)
    const plusEncodedName = trimmedName.replace(/\s+/g, '+')
    const spaceEncodedName = trimmedName.replace(/\s+/g, ' ')
    const linkId = `gf-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    
    // Check for link with any of these encodings or by ID
    const googleFontsLink = document.querySelector(
      `link[href*="fonts.googleapis.com/css2"][href*="${encodedName}"], ` +
      `link[href*="fonts.googleapis.com/css2"][href*="${plusEncodedName}"], ` +
      `link[href*="fonts.googleapis.com/css2"][href*="${spaceEncodedName}"]`
    ) || document.getElementById(linkId)
    
    if (googleFontsLink) {
      // Try to extract the actual font-family name from the loaded stylesheet
      // This ensures we use the exact name from the @font-face rule
      let fontNameToUse = trimmedName
      try {
        // Wait a bit for stylesheet to be fully parsed
        await new Promise(resolve => setTimeout(resolve, 100))
        const extracted = extractFontFamilyFromCSS(trimmedName)
        if (extracted && extracted !== trimmedName && !extracted.includes('gf_')) {
          // Use the extracted name if it's different and not a Google Fonts internal name
          fontNameToUse = extracted.replace(/^["']|["']$/g, '').split(',')[0].trim() || trimmedName
        }
      } catch {}
      
      // Use simple format: just the font name with quotes if needed
      const googleFontsFormat = fontNameToUse.includes(' ') ? `"${fontNameToUse}"` : fontNameToUse
      fontFamilyNameCache.set(trimmedName, googleFontsFormat)
      if (fontNameToUse !== trimmedName) {
        fontFamilyNameCache.set(fontNameToUse, googleFontsFormat)
      }
      return googleFontsFormat
    }
  }
  
  // For fonts with spaces, wrap in quotes
  const finalName = trimmedName.includes(' ') ? `"${trimmedName}"` : trimmedName
  fontFamilyNameCache.set(trimmedName, finalName)
  return finalName
}

/**
 * Loads a font from an npm package using unpkg.com CDN
 * @param fontName - The name of the font family
 * @param npmPackage - The npm package name (e.g., @fontsource/inter)
 * @returns Promise that resolves with the font family name
 */
export async function loadFontFromNpm(fontName: string, npmPackage: string): Promise<string> {
  try {
    // Try to load the package's CSS file from unpkg
    // Most font packages expose a CSS file at the root
    const cssUrl = `https://unpkg.com/${npmPackage}@latest/index.css`
    
    // Check if link already exists
    const linkId = `npm-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`
    let existingLink = document.getElementById(linkId) as HTMLLinkElement
    
    if (!existingLink) {
      existingLink = document.createElement('link')
      existingLink.id = linkId
      existingLink.rel = 'stylesheet'
      existingLink.href = cssUrl
      
      // Wait for the stylesheet to load, then extract the actual font-family name
      await new Promise<void>((resolve) => {
        existingLink.onload = async () => {
          // Wait a bit for CSS rules to be parsed (reduced delay for faster response)
          await new Promise(resolve => setTimeout(resolve, 100))
          // Extract and cache the actual font-family name
          const actualName = await getActualFontFamilyName(fontName)
          resolve()
        }
        existingLink.onerror = () => {
          console.warn(`Failed to load npm font CSS from ${cssUrl}`)
          // Still cache the original name as fallback
          const fallbackName = fontName.includes(' ') ? `"${fontName}"` : fontName
          fontFamilyNameCache.set(fontName.trim(), fallbackName)
          resolve()
        }
        document.head.appendChild(existingLink)
      })
    } else {
      // Update href in case package was updated
      existingLink.href = cssUrl
      // If already loaded, extract font-family name
      await new Promise(resolve => setTimeout(resolve, 100))
      const actualName = await getActualFontFamilyName(fontName)
    }
    
    return fontName
  } catch (error) {
    console.error('Failed to load font from npm:', error)
    throw new Error(`Failed to load font from npm package: ${npmPackage}`)
  }
}

/**
 * Loads a font from a git repository using jsdelivr.com CDN
 * @param fontName - The name of the font family
 * @param repoUrl - The git repository URL (e.g., https://github.com/user/repo)
 * @param fontPath - Path to font files in the repo (default: fonts)
 * @returns Promise that resolves with the font family name
 */
export async function loadFontFromGit(fontName: string, repoUrl: string, fontPath: string = 'fonts'): Promise<string> {
  try {
    // Parse git URL to extract user/repo
    // Supports: https://github.com/user/repo or https://gitlab.com/user/repo
    const urlMatch = repoUrl.match(/https?:\/\/(?:www\.)?(github|gitlab)\.com\/([\w.-]+)\/([\w.-]+)/)
    if (!urlMatch) {
      throw new Error('Invalid git repository URL')
    }
    
    const [, platform, user, repo] = urlMatch
    
    // Use jsdelivr.com CDN for GitHub/GitLab repos
    // Format: https://cdn.jsdelivr.net/gh/user/repo@latest/path or /npm/package@latest/path
    const cdnUrl = platform === 'github' 
      ? `https://cdn.jsdelivr.net/gh/${user}/${repo}@latest/${fontPath}`
      : `https://cdn.jsdelivr.net/gl/${user}/${repo}@latest/${fontPath}`
    
    // Try to find CSS file first, then fall back to loading font files directly
    // Common patterns: fonts.css, style.css, or individual font files
    const cssUrl = `${cdnUrl}/fonts.css`
    
    const linkId = `git-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`
    let existingLink = document.getElementById(linkId) as HTMLLinkElement
    
    if (!existingLink) {
      existingLink = document.createElement('link')
      existingLink.id = linkId
      existingLink.rel = 'stylesheet'
      existingLink.href = cssUrl
      
      // Wait for the stylesheet to load, then extract the actual font-family name
      await new Promise<void>((resolve) => {
        existingLink.onload = async () => {
          // Wait a bit for CSS rules to be parsed (reduced delay for faster response)
          await new Promise(resolve => setTimeout(resolve, 100))
          // Extract and cache the actual font-family name
          const actualName = await getActualFontFamilyName(fontName)
          resolve()
        }
        existingLink.onerror = () => {
          console.warn(`Could not load CSS from ${cssUrl}. You may need to manually add @font-face rules.`)
          // Still cache the original name as fallback
          const fallbackName = fontName.includes(' ') ? `"${fontName}"` : fontName
          fontFamilyNameCache.set(fontName.trim(), fallbackName)
          resolve()
        }
        document.head.appendChild(existingLink)
      })
    } else {
      // Update href in case package was updated
      existingLink.href = cssUrl
      // If already loaded, extract font-family name
      await new Promise(resolve => setTimeout(resolve, 100))
      const actualName = await getActualFontFamilyName(fontName)
    }
    
    return fontName
  } catch (error) {
    console.error('Failed to load font from git:', error)
    throw new Error(`Failed to load font from git repository: ${repoUrl}`)
  }
}

/**
 * Creates a @font-face CSS rule from a font file and adds it to the document
 * @param fontName - The name of the font family
 * @param fontFile - The font file to use
 * @returns The font family name to use in CSS
 */
export function createFontFaceFromFile(fontName: string, fontFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const fontData = e.target?.result as ArrayBuffer
      if (!fontData) {
        reject(new Error('Failed to read font file'))
        return
      }

      // Convert ArrayBuffer to base64
      const base64 = btoa(
        new Uint8Array(fontData)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // Determine font format from file extension
      const fileName = fontFile.name.toLowerCase()
      let format = 'truetype' // default
      if (fileName.endsWith('.woff')) format = 'woff'
      else if (fileName.endsWith('.woff2')) format = 'woff2'
      else if (fileName.endsWith('.otf')) format = 'opentype'
      else if (fileName.endsWith('.eot')) format = 'embedded-opentype'

      // Create @font-face rule
      const fontFaceId = `custom-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`
      const fontFaceRule = `
@font-face {
  font-family: '${fontName}';
  src: url(data:font/${format};base64,${base64}) format('${format}');
  font-display: swap;
}`

      // Remove existing @font-face for this font if it exists
      const existingStyle = document.getElementById(fontFaceId)
      if (existingStyle) {
        existingStyle.remove()
      }

      // Add new @font-face rule
      const style = document.createElement('style')
      style.id = fontFaceId
      style.textContent = fontFaceRule
      document.head.appendChild(style)

      resolve(fontName)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read font file'))
    }

    reader.readAsArrayBuffer(fontFile)
  })
}

/**
 * Stores custom font information in localStorage
 */
export function storeCustomFont(
  fontName: string, 
  fontFile?: File, 
  fontSource?: { type: 'npm' | 'git'; url: string }
): void {
  try {
    const customFonts = JSON.parse(localStorage.getItem('custom-fonts') || '[]') as Array<{
      name: string
      fileName?: string
      source?: { type: 'npm' | 'git'; url: string }
      addedAt: number
    }>
    
    // Check if font already exists
    const existingIndex = customFonts.findIndex(f => f.name === fontName)
    const fontData = {
      name: fontName,
      fileName: fontFile?.name,
      source: fontSource,
      addedAt: Date.now(),
    }

    if (existingIndex >= 0) {
      customFonts[existingIndex] = fontData
    } else {
      customFonts.push(fontData)
    }

    localStorage.setItem('custom-fonts', JSON.stringify(customFonts))
  } catch (e) {
    console.warn('Failed to store custom font:', e)
  }
}

/**
 * Gets all stored custom fonts
 */
export function getStoredCustomFonts(): Array<{ 
  name: string
  fileName?: string
  source?: { type: 'npm' | 'git'; url: string }
  addedAt: number 
}> {
  try {
    return JSON.parse(localStorage.getItem('custom-fonts') || '[]')
  } catch {
    return []
  }
}

/**
 * Loads all stored custom fonts (including npm/git sources)
 * Extracts and caches font-family names from @font-face rules
 */
export async function loadStoredCustomFonts(): Promise<void> {
  const customFonts = getStoredCustomFonts()
  
  for (const font of customFonts) {
    try {
      if (font.source) {
        if (font.source.type === 'npm') {
          await loadFontFromNpm(font.name, font.source.url)
          // Font-family name extraction and caching happens inside loadFontFromNpm
        } else if (font.source.type === 'git') {
          const [repoUrl, fontPath] = font.source.url.split('#')
          await loadFontFromGit(font.name, repoUrl, fontPath || 'fonts')
          // Font-family name extraction and caching happens inside loadFontFromGit
        }
      }
      // File-based fonts are already loaded via @font-face rules
      // For file-based fonts, extract font-family name if not already cached
      if (!font.source) {
        await new Promise(resolve => setTimeout(resolve, 100))
        await getActualFontFamilyName(font.name)
      }
    } catch (error) {
      console.warn(`Failed to load custom font ${font.name}:`, error)
    }
  }
}

/**
 * Loads a font based on its name - checks for npm/git sources first, then loads as web font
 * @param fontName - The font family name to load
 */
export async function ensureFontLoaded(fontName: string): Promise<void> {
  if (!fontName || !fontName.trim()) return
  
  const trimmedName = fontName.trim()
  
  // Check if this is a custom font with npm/git source
  const customFonts = getStoredCustomFonts()
  const customFont = customFonts.find(f => f.name === trimmedName)
  
  if (customFont?.source) {
    // Load from npm or git
    try {
      if (customFont.source.type === 'npm') {
        await loadFontFromNpm(trimmedName, customFont.source.url)
        return
      } else if (customFont.source.type === 'git') {
        const [repoUrl, fontPath] = customFont.source.url.split('#')
        await loadFontFromGit(trimmedName, repoUrl, fontPath || 'fonts')
        return
      }
    } catch (error) {
      console.warn(`Failed to load custom font ${trimmedName}:`, error)
      // Fall through to web font loading
    }
  }
  
  // Load as web font (Google Fonts) if not a custom font or if custom font loading failed
  try {
    // Ensure preconnect links are in place for performance
    ensureGoogleFontsPreconnect()
    
    const id = `gf-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    const existingLink = document.getElementById(id) as HTMLLinkElement | null
    if (existingLink) {
      // Font already loaded, just return (no events, no recomputes)
      return
    }
    
    // Check if there's a custom URL for this font from token extensions
    const customUrl = fontUrlMap.get(trimmedName)
    const href = customUrl || `https://fonts.googleapis.com/css2?family=${encodeURIComponent(trimmedName).replace(/%20/g, '+')}:wght@100..900&display=swap`
    
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    
    // Just append the link - no events, no waiting, no recomputes
    // Font will load and apply automatically when ready
    
    document.head.appendChild(link)
  } catch (error) {
    console.warn(`Failed to load web font ${trimmedName}:`, error)
  }
}

/**
 * Loads fonts from font family token values
 * Checks token overrides and tokens.json for font family values
 */
export async function loadFontsFromTokens(): Promise<void> {
  try {
    const fontNames = new Set<string>()
    
    // Clear and rebuild font URL map from tokens
    fontUrlMap.clear()
    
    // Read from token overrides (these take precedence)
    try {
      const overrides = JSON.parse(localStorage.getItem('token-overrides') || '{}') || {}
      Object.entries(overrides).forEach(([name, value]) => {
        if (typeof name === 'string' && (name.startsWith('font/family/') || name.startsWith('font/typeface/'))) {
          let fontValue = String(value || '').trim()
          // Strip any quotes that might have been stored
          fontValue = fontValue.replace(/^["']|["']$/g, '')
          if (fontValue) {
            fontNames.add(fontValue)
          }
        }
      })
    } catch {}
    
    // Read from tokens.json via varsStore
    try {
      if (typeof window !== 'undefined') {
        const { getVarsStore } = await import('../../core/store/varsStore')
        const store = getVarsStore()
        const state = store.getState()
        const tokens = state.tokens as any
        const fontRoot = tokens?.tokens?.font || tokens?.font || {}
        
        // Collect from font.family
        Object.values(fontRoot.family || {}).forEach((rec: any) => {
          const val = String(rec?.$value || '').trim()
          if (val) fontNames.add(val)
        })
        
        // Collect from font.typeface (singular) and font.typefaces (plural) and extract URLs from extensions
        const typefaces = fontRoot.typefaces || fontRoot.typeface || {}
        Object.entries(typefaces).forEach(([key, rec]: [string, any]) => {
          const val = String(rec?.$value || '').trim()
          if (val) {
            fontNames.add(val)
            // Check if there's a Google Fonts URL in extensions
            const url = rec?.$extensions?.com?.google?.fonts?.url
            if (url && typeof url === 'string' && url.includes('fonts.googleapis.com')) {
              // Store the URL mapping for this font name
              fontUrlMap.set(val, url)
              // Pre-cache the font name with proper format so CSS variables can use it immediately
              const cleanVal = val.replace(/^["']|["']$/g, '')
              const fontFormat = cleanVal.includes(' ') ? `"${cleanVal}"` : cleanVal
              if (!fontFamilyNameCache.has(cleanVal)) {
                fontFamilyNameCache.set(cleanVal, fontFormat)
              }
            }
          }
        })
      }
    } catch {}
    
    // Load all fonts (ensureFontLoaded will check fontUrlMap for custom URLs)
    await Promise.all(Array.from(fontNames).map(name => ensureFontLoaded(name)))
  } catch (error) {
    console.warn('Failed to load fonts from tokens:', error)
  }
}

/**
 * Removes all custom fonts and their @font-face rules
 */
export function clearCustomFonts(): void {
  try {
    // Get all custom fonts
    const customFonts = getStoredCustomFonts()
    
    // Remove @font-face rules for each custom font
    customFonts.forEach((font) => {
      const fontFaceId = `custom-font-${font.name.replace(/\s+/g, '-').toLowerCase()}`
      const existingStyle = document.getElementById(fontFaceId)
      if (existingStyle) {
        existingStyle.remove()
      }
    })
    
    // Clear localStorage
    localStorage.removeItem('custom-fonts')
  } catch (e) {
    console.warn('Failed to clear custom fonts:', e)
  }
}

