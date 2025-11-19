/**
 * Utility functions for handling custom fonts
 */

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
export function storeCustomFont(fontName: string, fontFile?: File): void {
  try {
    const customFonts = JSON.parse(localStorage.getItem('custom-fonts') || '[]') as Array<{
      name: string
      fileName?: string
      addedAt: number
    }>
    
    // Check if font already exists
    const existingIndex = customFonts.findIndex(f => f.name === fontName)
    const fontData = {
      name: fontName,
      fileName: fontFile?.name,
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
export function getStoredCustomFonts(): Array<{ name: string; fileName?: string; addedAt: number }> {
  try {
    return JSON.parse(localStorage.getItem('custom-fonts') || '[]')
  } catch {
    return []
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

