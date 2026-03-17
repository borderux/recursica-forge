import tokensImport from '../../../recursica_tokens.json'

export interface FontEntry {
    id: string // e.g. "primary", "secondary"
    family: string // e.g. "Lexend"
    url?: string // e.g. "https://fonts.googleapis.com/css2?..."
}

const STORAGE_KEY = 'rf:fonts'

export function getStoredFonts(): FontEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (err) {
        console.warn('[fontStore] Failed to read rf:fonts from localStorage', err)
    }

    // Fallback to recursica_tokens.json defaults
    return getDefaultFonts()
}

export function saveStoredFonts(fonts: FontEntry[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts))
    } catch (err) {
        console.warn('[fontStore] Failed to save rf:fonts to localStorage', err)
    }
}

export function clearStoredFonts(): void {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
        console.warn('[fontStore] Failed to clear rf:fonts from localStorage', err)
    }
}

export function getDefaultFonts(): FontEntry[] {
    const defaultFonts: FontEntry[] = []
    try {
        const fontRoot = (tokensImport as any)?.tokens?.font || (tokensImport as any)?.font || {}
        const typefaces = fontRoot.typefaces || fontRoot.typeface || {}

        // Iterate in the defined order (or keys order)
        const ORDER = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary']

        for (const key of ORDER) {
            const def = typefaces[key]
            if (def) {
                let family = ''
                const rawValue = def.$value
                if (Array.isArray(rawValue) && rawValue.length > 0) {
                    family = typeof rawValue[0] === 'string' ? rawValue[0].trim().replace(/^["']|["']$/g, '') : ''
                } else if (typeof rawValue === 'string') {
                    family = rawValue.trim().replace(/^["']|["']$/g, '')
                }

                const url = def.$extensions?.['com.google.fonts']?.url

                if (family) {
                    defaultFonts.push({
                        id: key,
                        family,
                        url
                    })
                }
            }
        }

        // Capture any non-standard keys as well
        const standardKeys = new Set(ORDER)
        for (const key of Object.keys(typefaces).filter(k => !k.startsWith('$'))) {
            if (!standardKeys.has(key)) {
                const def = typefaces[key]
                if (def) {
                    let family = ''
                    const rawValue = def.$value
                    if (Array.isArray(rawValue) && rawValue.length > 0) {
                        family = typeof rawValue[0] === 'string' ? rawValue[0].trim().replace(/^["']|["']$/g, '') : ''
                    } else if (typeof rawValue === 'string') {
                        family = rawValue.trim().replace(/^["']|["']$/g, '')
                    }

                    const url = def.$extensions?.['com.google.fonts']?.url

                    if (family) {
                        defaultFonts.push({
                            id: key,
                            family,
                            url
                        })
                    }
                }
            }
        }
    } catch (err) {
        console.warn('[fontStore] Failed to parse default fonts from recursica_tokens.json', err)
    }

    return defaultFonts
}
