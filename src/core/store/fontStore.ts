import tokensImport from '../../../recursica_tokens.json'
import brandImport from '../../../recursica_brand.json'

export interface FontEntry {
    id: string // sequence role: e.g. "primary", "secondary"
    family: string // e.g. "Lexend"
    url?: string // e.g. "https://fonts.googleapis.com/css2?..."
    category?: 'sans-serif' | 'serif' | 'monospace' // generic fallback
    slug?: string  // token key for the named entry, e.g. "lexend"
}

const STORAGE_KEY = 'rf:fonts'

/**
 * Convert a font family name to a safe DTCG token key.
 * e.g. "Playwrite NZ Guides" → "playwrite-nz-guides"
 */
export function fontFamilyToSlug(family: string): string {
    return family
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function getStoredFonts(): FontEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const fonts: FontEntry[] = JSON.parse(stored)
            // Migration: strip any stale fallback suffixes from family values
            let dirty = false
            fonts.forEach(f => {
                if (f.family && f.family.includes(',')) {
                    f.family = f.family.split(',')[0].trim()
                    dirty = true
                }
                // Ensure slug is set
                if (!f.slug) {
                    f.slug = fontFamilyToSlug(f.family)
                    dirty = true
                }
            })
            if (dirty) localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts))
            return fonts
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

        const ORDER = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary']

        // Font level aliases live at brand.fonts (brand.json owns the primary/secondary/tertiary sequencing).
        // Fall back through old locations for backward compat.
        const brandRoot = (brandImport as any)?.brand || brandImport
        const sequenceGroup: any = brandRoot?.fonts || brandRoot?.font?.levels || fontRoot.levels || typefaces['levels'] || {}

        // Resolve sequence aliases in ORDER
        for (const seqKey of ORDER) {
            // Try new structure (font.levels.primary), then legacy (typefaces.primary)
            const def = sequenceGroup[seqKey] || typefaces[seqKey]
            if (!def) continue

            const rawValue = def.$value
            let slug = ''
            let namedEntry: any = null

            if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
                // New structure: alias referencing named entry e.g. {tokens.font.typefaces.lexend}
                const refMatch = rawValue.match(/\{tokens\.font\.typefaces\.([^}]+)\}/)
                if (refMatch) {
                    slug = refMatch[1]
                    namedEntry = typefaces[slug]
                }
            } else {
                // Legacy: value is the font stack directly on the sequence entry
                let family = ''
                if (Array.isArray(rawValue) && rawValue.length > 0) {
                    family = typeof rawValue[0] === 'string' ? rawValue[0].trim().replace(/^["']|["']$/g, '') : ''
                } else if (typeof rawValue === 'string') {
                    family = rawValue.trim().replace(/^["']|["']$/g, '').split(',')[0].trim()
                }
                if (family) {
                    slug = fontFamilyToSlug(family)
                    namedEntry = def // legacy: data is on the sequence entry itself
                }
            }

            if (!namedEntry) continue

            // Extract family from named entry (or legacy sequence entry)
            const entryValue = namedEntry.$value
            let family = ''
            if (Array.isArray(entryValue) && entryValue.length > 0) {
                family = typeof entryValue[0] === 'string' ? entryValue[0].trim().replace(/^["']|["']$/g, '').split(',')[0].trim() : ''
            } else if (typeof entryValue === 'string') {
                family = entryValue.trim().replace(/^["']|["']$/g, '').split(',')[0].trim()
            }

            const url = namedEntry.$extensions?.['com.google.fonts']?.url

            if (family) {
                defaultFonts.push({ id: seqKey, family, url, slug: slug || fontFamilyToSlug(family) })
            }
        }
    } catch (err) {
        console.warn('[fontStore] Failed to parse default fonts from recursica_tokens.json', err)
    }

    return defaultFonts
}

