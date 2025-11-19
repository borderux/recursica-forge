/**
 * Utility functions for handling custom fonts
 */

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
      document.head.appendChild(existingLink)
    } else {
      // Update href in case package was updated
      existingLink.href = cssUrl
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
      document.head.appendChild(existingLink)
      
      // If CSS doesn't exist, try to load common font files
      // This is a fallback - ideally repos should have a CSS file
      existingLink.onerror = () => {
        console.warn(`Could not load CSS from ${cssUrl}. You may need to manually add @font-face rules.`)
      }
    } else {
      existingLink.href = cssUrl
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
 */
export async function loadStoredCustomFonts(): Promise<void> {
  const customFonts = getStoredCustomFonts()
  
  for (const font of customFonts) {
    try {
      if (font.source) {
        if (font.source.type === 'npm') {
          await loadFontFromNpm(font.name, font.source.url)
        } else if (font.source.type === 'git') {
          const [repoUrl, fontPath] = font.source.url.split('#')
          await loadFontFromGit(font.name, repoUrl, fontPath || 'fonts')
        }
      }
      // File-based fonts are already loaded via @font-face rules
    } catch (error) {
      console.warn(`Failed to load custom font ${font.name}:`, error)
    }
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

