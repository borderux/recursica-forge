/**
 * Vite plugin to watch toolbar config JSON files and automatically
 * add missing icons to iconLibrary.ts
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
/**
 * Convert kebab-case to PascalCase
 */
function kebabToPascal(kebab) {
    return kebab
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
/**
 * Recursively extract all icon names from a toolbar config object
 */
function extractIconsFromConfig(config, iconSet = new Set()) {
    if (typeof config !== 'object' || config === null) {
        return iconSet;
    }
    // Check if this object has an "icon" property
    if (typeof config.icon === 'string' && config.icon) {
        iconSet.add(config.icon);
    }
    // Recursively check all properties
    for (const value of Object.values(config)) {
        if (typeof value === 'object' && value !== null) {
            extractIconsFromConfig(value, iconSet);
        }
    }
    return iconSet;
}
/**
 * Get all icon names from all toolbar config files
 */
function getIconNamesFromToolbarConfigs(configsDir) {
    const iconSet = new Set();
    try {
        const files = readdirSync(configsDir);
        const configFiles = files.filter(f => f.endsWith('.toolbar.json'));
        for (const file of configFiles) {
            const filePath = join(configsDir, file);
            try {
                const content = readFileSync(filePath, 'utf-8');
                const config = JSON.parse(content);
                extractIconsFromConfig(config, iconSet);
            }
            catch (error) {
                console.warn(`⚠️  Error reading ${file}:`, error);
            }
        }
    }
    catch (error) {
        console.error('Error reading toolbar configs directory:', error);
    }
    return Array.from(iconSet);
}
/**
 * Parse iconLibrary.ts to get imported icons and mapped names
 */
function parseIconLibrary(iconLibraryPath) {
    try {
        const content = readFileSync(iconLibraryPath, 'utf-8');
        // Extract imports
        const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@phosphor-icons\/react['"]/);
        const importedIcons = importMatch
            ? importMatch[1]
                .split(',')
                .map(i => i.trim())
                .filter(Boolean)
            : [];
        // Extract mapped icon names
        const mapMatch = content.match(/const phosphorIconMap[^=]*=\s*\{([^}]+)\}/s);
        const mappedNames = new Set();
        if (mapMatch) {
            const mapContent = mapMatch[1];
            const entryRegex = /['"]([^'"]+)['"]\s*:/g;
            let match;
            while ((match = entryRegex.exec(mapContent)) !== null) {
                mappedNames.add(match[1]);
            }
        }
        return { importedIcons, mappedNames, content };
    }
    catch (error) {
        console.error('Error reading iconLibrary.ts:', error);
        return { importedIcons: [], mappedNames: new Set(), content: '' };
    }
}
/**
 * Add missing icons to iconLibrary.ts
 */
function addMissingIcons(root) {
    const configsDir = join(root, 'src/modules/toolbar/configs');
    const iconLibraryPath = join(root, 'src/modules/components/iconLibrary.ts');
    const iconNames = getIconNamesFromToolbarConfigs(configsDir);
    const { importedIcons, mappedNames, content } = parseIconLibrary(iconLibraryPath);
    const missingIcons = [];
    for (const iconName of iconNames) {
        if (mappedNames.has(iconName)) {
            continue;
        }
        const componentName = kebabToPascal(iconName);
        if (!importedIcons.includes(componentName)) {
            missingIcons.push({ iconName, componentName, needsImport: true });
        }
        else {
            missingIcons.push({ iconName, componentName, needsImport: false });
        }
    }
    if (missingIcons.length === 0) {
        return; // All icons already present
    }
    console.log(`\n📦 Found ${missingIcons.length} missing icon(s) from toolbar configs:`);
    missingIcons.forEach(({ iconName, componentName }) => {
        console.log(`  - ${iconName} (${componentName})`);
    });
    let updatedContent = content;
    // Add missing imports
    const iconsNeedingImport = missingIcons.filter(i => i.needsImport);
    if (iconsNeedingImport.length > 0) {
        const importMatch = updatedContent.match(/(import\s*\{)([^}]+)(\}\s*from\s*['"]@phosphor-icons\/react['"])/s);
        if (importMatch) {
            const existingImports = importMatch[2]
                .split(',')
                .map(i => i.trim())
                .filter(Boolean);
            const newImports = [...existingImports];
            iconsNeedingImport.forEach(({ componentName }) => {
                if (!newImports.includes(componentName)) {
                    newImports.push(componentName);
                }
            });
            newImports.sort();
            const formattedImports = newImports
                .map((imp, idx) => (idx === 0 ? '  ' : '  ') + imp)
                .join(',\n');
            updatedContent = updatedContent.replace(importMatch[0], `${importMatch[1]}\n${formattedImports},\n${importMatch[3]}`);
        }
    }
    // Add missing map entries
    const mapRegex = /(const phosphorIconMap[^=]*=\s*\{)([\s\S]*?)(\n\})/s;
    const mapMatch = updatedContent.match(mapRegex);
    if (mapMatch) {
        const mapContent = mapMatch[2];
        const lines = mapContent.split('\n');
        let lastEntryIndex = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line && !line.startsWith('//') && (line.includes("'") || line.includes('"'))) {
                lastEntryIndex = i;
                break;
            }
        }
        const newEntries = missingIcons.map(({ iconName, componentName }) => {
            return `  '${iconName}': ${componentName},`;
        }).join('\n');
        if (lastEntryIndex >= 0) {
            const mapStartPos = updatedContent.indexOf(mapMatch[0]);
            const mapBodyStart = mapStartPos + mapMatch[1].length;
            const mapBodyEnd = mapBodyStart + mapContent.length;
            const insertionPoint = mapBodyEnd;
            updatedContent =
                updatedContent.substring(0, insertionPoint) +
                    '\n' + newEntries +
                    updatedContent.substring(insertionPoint);
        }
        else {
            const insertionPoint = updatedContent.indexOf(mapMatch[0]) + mapMatch[1].length;
            updatedContent =
                updatedContent.substring(0, insertionPoint) +
                    '\n' + newEntries +
                    updatedContent.substring(insertionPoint);
        }
    }
    writeFileSync(iconLibraryPath, updatedContent, 'utf-8');
    console.log(`✅ Updated iconLibrary.ts with ${missingIcons.length} new icon(s)\n`);
}
export function watchToolbarIcons() {
    return {
        name: 'watch-toolbar-icons',
        buildStart() {
            // Run on build start
            const root = process.cwd();
            addMissingIcons(root);
        },
        configureServer(server) {
            // Watch toolbar config files
            const configsDir = join(process.cwd(), 'src/modules/toolbar/configs');
            // Run once on server start
            addMissingIcons(process.cwd());
            // Watch for changes
            server.watcher.add(configsDir);
            server.watcher.on('change', (file) => {
                if (file.endsWith('.toolbar.json')) {
                    console.log(`\n📝 Toolbar config changed: ${file}`);
                    setTimeout(() => {
                        addMissingIcons(process.cwd());
                    }, 100);
                }
            });
        },
    };
}
