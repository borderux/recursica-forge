import re

with open('src/modules/tokens/font/FontFamiliesTokens.tsx', 'r') as f:
    content = f.read()

# 1. Add import for fontStore
if 'from \'../../../core/store/fontStore\'' not in content:
    content = content.replace("import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'", 
    "import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'\nimport { getStoredFonts, saveStoredFonts, FontEntry } from '../../../core/store/fontStore'")

# 2. Replace getCurrentFontCount
content = re.sub(
    r'// Get current font count.*?const getCurrentFontCount = \(\): number => \{.*?return 0\n\s*\}\n\}',
    r'''// Get current font count to determine available sequences
const getCurrentFontCount = (): number => {
  return getStoredFonts().length
}''',
    content, flags=re.DOTALL
)

# 3. Replace getExistingFonts
content = re.sub(
    r'// Get list of existing font families.*?const getExistingFonts = \(\): string\[\] => \{.*?return existing\n\}',
    r'''// Get list of existing font families to prevent duplicates
const getExistingFonts = (): string[] => {
  return getStoredFonts().map(f => f.family)
}''',
    content, flags=re.DOTALL
)

# 4. Replace buildRows
content = re.sub(
    r'  const buildRows = \(\): FamilyRow\[\] => \{.*?return rows\n  \}',
    r'''  const buildRows = (): FamilyRow[] => {
    return getStoredFonts().map((f, index) => ({
      name: `font/typeface/${f.id}`,
      value: f.family,
      position: index
    }))
  }''',
    content, flags=re.DOTALL
)

# 5. Fix GoogleFontsModalWrapper onAdd
content = re.sub(
    r'          const overrides = readOverrides\(\).*?writeOverrides\(updated\)\n\n          // Update tokens in store and trigger typography recompute',
    r'''          const fonts = getStoredFonts()
          const newName = ORDER[fonts.length] || `custom-${fonts.length + 1}`
          fonts.push({ id: newName, family: fontName, url: selectedUrl })
          saveStoredFonts(fonts)

          // Update tokens in store and trigger typography recompute''',
    content, flags=re.DOTALL
)

# 6. Simplify the useEffect that syncs store tokens with overrides
sync_effect_match = re.search(r'  // Update rows when tokensJson changes\n  useEffect\(\(\) => \{\n    const newRows = buildRows\(\)\n    setRows\(newRows\)\n\n    // Sync store tokens.*?  \}, \[tokensJson\]\)', content, re.DOTALL)
if sync_effect_match:
    content = content.replace(sync_effect_match.group(0), '''  // Update rows when tokensJson changes
  useEffect(() => {
    const newRows = buildRows()
    setRows(newRows)
  }, [tokensJson])''')

# 7. Simplified tokenOverridesChanged handler
handler_match = re.search(r'  useEffect\(\(\) => \{\n    const handler = \(ev: Event\) => \{.*?    return \(\) => window\.removeEventListener\(\'tokenOverridesChanged\', handler\)\n  \}, \[tokensJson\]\)', content, re.DOTALL)

new_handler = '''  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, reset } = detail
      if (all && typeof all === 'object') {
        if (reset) {
          setRows(buildRows())
        } else if (!detail.skipRebuild) {
          setRows(buildRows())
        }
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [tokensJson])'''
if handler_match:
    content = content.replace(handler_match.group(0), new_handler)

# 8. Simplify handleDrop
handle_drop_match = re.search(r'  const handleDrop = \(e: React\.DragEvent, dropIndex: number\) => \{.*?\n  \}', content, re.DOTALL)
new_handle_drop = '''  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const fonts = getStoredFonts()
    const newFonts = [...fonts]
    const [draggedFont] = newFonts.splice(draggedIndex, 1)
    newFonts.splice(dropIndex, 0, draggedFont)

    const updatedFonts = newFonts.map((f, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      if (f.id !== sequentialName) {
        removeCssVar(`--tokens-font-typeface-${f.id}`)
        removeCssVar(`--recursica-tokens-font-typefaces-${f.id}`)
        removeCssVar(`--recursica-tokens-font-families-${f.id}`)
      }
      return { ...f, id: sequentialName }
    })

    saveStoredFonts(updatedFonts)
    setRows(buildRows())
    setDraggedIndex(null)

    setTimeout(() => {
      try {
        const store = getVarsStore()
        const typographyPrefixes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle', 'subtitle-small', 'body', 'body-small', 'caption', 'overline']
        typographyPrefixes.forEach((prefix) => {
          const cssVar = `--recursica-brand-typography-${prefix}-font-family`
          if (typeof document !== 'undefined') {
            document.documentElement.style.removeProperty(cssVar)
          }
        })
        store.recomputeAndApplyAll()
      } catch { }
    }, 0)

    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { skipRebuild: true } }))
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: {} }))
    } catch { }
  }'''
if handle_drop_match:
    content = content.replace(handle_drop_match.group(0), new_handle_drop)

# 9. Simplify handleDelete
handle_delete_match = re.search(r'  const handleDelete = \(index: number\) => \{.*?(?=\n  const handleModalSave)', content, re.DOTALL)
new_handle_delete = '''  const handleDelete = (index: number) => {
    if (index === 0) return
    if (rows.length <= 1) return

    const fonts = getStoredFonts()
    const rowsToKeep = fonts.filter((_, idx) => idx !== index)
    
    const updatedFonts = rowsToKeep.map((f, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      if (f.id !== sequentialName) {
        removeCssVar(`--tokens-font-typeface-${f.id}`)
        removeCssVar(`--recursica-tokens-font-typefaces-${f.id}`)
        removeCssVar(`--recursica-tokens-font-families-${f.id}`)
      }
      return { ...f, id: sequentialName }
    })
    
    if (index < fonts.length) {
      const deletedKey = fonts[index].id
      removeCssVar(`--tokens-font-typeface-${deletedKey}`)
      removeCssVar(`--recursica-tokens-font-typefaces-${deletedKey}`)
      removeCssVar(`--recursica-tokens-font-families-${deletedKey}`)
    }

    saveStoredFonts(updatedFonts)
    setRows(updatedFonts.map((f, i) => ({ name: `font/typeface/${f.id}`, value: f.family, position: i })))

    setTimeout(() => {
      try {
        const store = getVarsStore()
        const typographyPrefixes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle', 'subtitle-small', 'body', 'body-small', 'caption', 'overline']
        typographyPrefixes.forEach((prefix) => {
          const cssVar = `--recursica-brand-typography-${prefix}-font-family`
          if (typeof document !== 'undefined') {
            document.documentElement.style.removeProperty(cssVar)
          }
        })
        store.recomputeAndApplyAll()
      } catch { }
    }, 0)

    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { skipRebuild: true } }))
    } catch { }
  }'''
if handle_delete_match:
    content = content.replace(handle_delete_match.group(0), new_handle_delete)

with open('src/modules/tokens/font/FontFamiliesTokens.tsx', 'w') as f:
    f.write(content)

print("Done")
