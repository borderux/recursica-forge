#!/usr/bin/env node

/**
 * Watch script for propIconMapping.json
 * 
 * Automatically adds missing icons to iconLibrary.ts when propIconMapping.json changes.
 * 
 * Usage: node scripts/watch-icon-mapping.mjs
 */

import { watch } from 'fs'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const PROP_ICON_MAPPING_PATH = join(projectRoot, 'src/modules/components/propIconMapping.json')
const ICON_LIBRARY_PATH = join(projectRoot, 'src/modules/components/iconLibrary.ts')

/**
 * Convert kebab-case to PascalCase
 * e.g., "diamonds-four" -> "DiamondsFour"
 */
function kebabToPascal(kebab) {
  return kebab
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

/**
 * Get all icon names from propIconMapping.json
 */
function getIconNamesFromMapping() {
  try {
    const content = readFileSync(PROP_ICON_MAPPING_PATH, 'utf-8')
    const mapping = JSON.parse(content)
    return Object.values(mapping).filter(Boolean)
  } catch (error) {
    console.error('Error reading propIconMapping.json:', error.message)
    return []
  }
}

/**
 * Parse iconLibrary.ts to get:
 * - List of imported icon components
 * - List of mapped icon names
 */
function parseIconLibrary() {
  try {
    const content = readFileSync(ICON_LIBRARY_PATH, 'utf-8')
    
    // Extract imports
    const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]phosphor-react['"]/)
    const importedIcons = importMatch
      ? importMatch[1]
          .split(',')
          .map(i => i.trim())
          .filter(Boolean)
      : []
    
    // Extract mapped icon names from the map
    const mapMatch = content.match(/const phosphorIconMap[^=]*=\s*\{([^}]+)\}/s)
    const mappedNames = new Set()
    if (mapMatch) {
      const mapContent = mapMatch[1]
      // Match entries like 'icon-name': ComponentName
      const entryRegex = /['"]([^'"]+)['"]\s*:/g
      let match
      while ((match = entryRegex.exec(mapContent)) !== null) {
        mappedNames.add(match[1])
      }
    }
    
    return { importedIcons, mappedNames, content }
  } catch (error) {
    console.error('Error reading iconLibrary.ts:', error.message)
    return { importedIcons: [], mappedNames: new Set(), content: '' }
  }
}

/**
 * Add missing icons to iconLibrary.ts
 */
function addMissingIcons() {
  const iconNames = getIconNamesFromMapping()
  const { importedIcons, mappedNames, content } = parseIconLibrary()
  
  const missingIcons = []
  
  for (const iconName of iconNames) {
    // Check if icon is already mapped
    if (mappedNames.has(iconName)) {
      continue
    }
    
    const componentName = kebabToPascal(iconName)
    
    // Check if component is already imported
    if (!importedIcons.includes(componentName)) {
      missingIcons.push({ iconName, componentName, needsImport: true })
    } else {
      // Component is imported but not mapped - just add to map
      missingIcons.push({ iconName, componentName, needsImport: false })
    }
  }
  
  if (missingIcons.length === 0) {
    console.log('✓ All icons are already in iconLibrary.ts')
    return
  }
  
  console.log(`\n📦 Found ${missingIcons.length} missing icon(s):`)
  missingIcons.forEach(({ iconName, componentName }) => {
    console.log(`  - ${iconName} (${componentName})`)
  })
  
  // Update the file
  let updatedContent = content
  
  // Add missing imports
  const iconsNeedingImport = missingIcons.filter(i => i.needsImport)
  if (iconsNeedingImport.length > 0) {
    const importMatch = updatedContent.match(/(import\s*\{)([^}]+)(\}\s*from\s*['"]phosphor-react['"])/s)
    if (importMatch) {
      const existingImports = importMatch[2]
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)
      
      const newImports = [...existingImports]
      iconsNeedingImport.forEach(({ componentName }) => {
        if (!newImports.includes(componentName)) {
          newImports.push(componentName)
        }
      })
      
      // Sort imports alphabetically for consistency
      newImports.sort()
      
      // Format imports nicely (one per line with proper indentation)
      const formattedImports = newImports
        .map((imp, idx) => (idx === 0 ? '  ' : '  ') + imp)
        .join(',\n')
      
      updatedContent = updatedContent.replace(
        importMatch[0],
        `${importMatch[1]}\n${formattedImports},\n${importMatch[3]}`
      )
    }
  }
  
  // Add missing map entries - find the last entry before the closing brace
  const mapRegex = /(const phosphorIconMap[^=]*=\s*\{)([\s\S]*?)(\n\})/s
  const mapMatch = updatedContent.match(mapRegex)
  
  if (mapMatch) {
    const mapContent = mapMatch[2]
    
    // Find the last non-empty, non-comment line
    const lines = mapContent.split('\n')
    let lastEntryIndex = -1
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line && !line.startsWith('//') && (line.includes("'") || line.includes('"'))) {
        lastEntryIndex = i
        break
      }
    }
    
    // Build new entries
    const newEntries = missingIcons.map(({ iconName, componentName }) => {
      return `  '${iconName}': ${componentName},`
    }).join('\n')
    
    // Insert new entries after the last entry
    if (lastEntryIndex >= 0) {
      const beforeMap = updatedContent.substring(0, updatedContent.indexOf(mapMatch[0]))
      const mapStart = mapMatch[1]
      const mapBody = mapContent
      const mapEnd = mapMatch[3]
      
      // Find the position in the original content
      const mapStartPos = updatedContent.indexOf(mapMatch[0])
      const mapBodyStart = mapStartPos + mapMatch[1].length
      const mapBodyEnd = mapBodyStart + mapContent.length
      
      // Insert new entries
      const insertionPoint = mapBodyEnd
      updatedContent = 
        updatedContent.substring(0, insertionPoint) +
        '\n' + newEntries +
        updatedContent.substring(insertionPoint)
    } else {
      // No existing entries, add after opening brace
      const insertionPoint = updatedContent.indexOf(mapMatch[0]) + mapMatch[1].length
      updatedContent = 
        updatedContent.substring(0, insertionPoint) +
        '\n' + newEntries +
        updatedContent.substring(insertionPoint)
    }
  }
  
  // Write updated file
  writeFileSync(ICON_LIBRARY_PATH, updatedContent, 'utf-8')
  console.log(`\n✅ Updated iconLibrary.ts with ${missingIcons.length} new icon(s)`)
  console.log('   Please verify the changes and restart your dev server if needed.\n')
}

/**
 * Main watch function
 */
function watchIconMapping() {
  console.log('👀 Watching propIconMapping.json for changes...')
  console.log('   Press Ctrl+C to stop\n')
  
  // Run once on startup
  addMissingIcons()
  
  // Watch for changes
  watch(PROP_ICON_MAPPING_PATH, (eventType) => {
    if (eventType === 'change') {
      console.log('\n📝 propIconMapping.json changed, checking for missing icons...')
      // Small delay to ensure file is fully written
      setTimeout(() => {
        addMissingIcons()
      }, 100)
    }
  })
}

// Start watching
watchIconMapping()



