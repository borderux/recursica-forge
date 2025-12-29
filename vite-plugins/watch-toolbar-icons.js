/**
 * Vite plugin to watch toolbar config JSON files and automatically
 * add missing icons to iconLibrary.ts
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
/**
 * Convert kebab-case to PascalCase
 */
function kebabToPascal(kebab) {
    return kebab
        .split('-')
        .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
        .join('');
}
/**
 * Recursively extract all icon names from a toolbar config object
 */
function extractIconsFromConfig(config, iconSet) {
    if (iconSet === void 0) { iconSet = new Set(); }
    if (typeof config !== 'object' || config === null) {
        return iconSet;
    }
    // Check if this object has an "icon" property
    if (typeof config.icon === 'string' && config.icon) {
        iconSet.add(config.icon);
    }
    // Recursively check all properties
    for (var _i = 0, _a = Object.values(config); _i < _a.length; _i++) {
        var value = _a[_i];
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
    var iconSet = new Set();
    try {
        var files = readdirSync(configsDir);
        var configFiles = files.filter(function (f) { return f.endsWith('.toolbar.json'); });
        for (var _i = 0, configFiles_1 = configFiles; _i < configFiles_1.length; _i++) {
            var file = configFiles_1[_i];
            var filePath = join(configsDir, file);
            try {
                var content = readFileSync(filePath, 'utf-8');
                var config = JSON.parse(content);
                extractIconsFromConfig(config, iconSet);
            }
            catch (error) {
                console.warn("\u26A0\uFE0F  Error reading ".concat(file, ":"), error);
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
        var content = readFileSync(iconLibraryPath, 'utf-8');
        // Extract imports
        var importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@phosphor-icons\/react['"]/);
        var importedIcons = importMatch
            ? importMatch[1]
                .split(',')
                .map(function (i) { return i.trim(); })
                .filter(Boolean)
            : [];
        // Extract mapped icon names
        var mapMatch = content.match(/const phosphorIconMap[^=]*=\s*\{([^}]+)\}/s);
        var mappedNames = new Set();
        if (mapMatch) {
            var mapContent = mapMatch[1];
            var entryRegex = /['"]([^'"]+)['"]\s*:/g;
            var match = void 0;
            while ((match = entryRegex.exec(mapContent)) !== null) {
                mappedNames.add(match[1]);
            }
        }
        return { importedIcons: importedIcons, mappedNames: mappedNames, content: content };
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
    var configsDir = join(root, 'src/modules/toolbar/configs');
    var iconLibraryPath = join(root, 'src/modules/components/iconLibrary.ts');
    var iconNames = getIconNamesFromToolbarConfigs(configsDir);
    var _a = parseIconLibrary(iconLibraryPath), importedIcons = _a.importedIcons, mappedNames = _a.mappedNames, content = _a.content;
    var missingIcons = [];
    for (var _i = 0, iconNames_1 = iconNames; _i < iconNames_1.length; _i++) {
        var iconName = iconNames_1[_i];
        if (mappedNames.has(iconName)) {
            continue;
        }
        var componentName = kebabToPascal(iconName);
        if (!importedIcons.includes(componentName)) {
            missingIcons.push({ iconName: iconName, componentName: componentName, needsImport: true });
        }
        else {
            missingIcons.push({ iconName: iconName, componentName: componentName, needsImport: false });
        }
    }
    if (missingIcons.length === 0) {
        return; // All icons already present
    }
    console.log("\n\uD83D\uDCE6 Found ".concat(missingIcons.length, " missing icon(s) from toolbar configs:"));
    missingIcons.forEach(function (_a) {
        var iconName = _a.iconName, componentName = _a.componentName;
        console.log("  - ".concat(iconName, " (").concat(componentName, ")"));
    });
    var updatedContent = content;
    // Add missing imports
    var iconsNeedingImport = missingIcons.filter(function (i) { return i.needsImport; });
    if (iconsNeedingImport.length > 0) {
        var importMatch = updatedContent.match(/(import\s*\{)([^}]+)(\}\s*from\s*['"]@phosphor-icons\/react['"])/s);
        if (importMatch) {
            var existingImports = importMatch[2]
                .split(',')
                .map(function (i) { return i.trim(); })
                .filter(Boolean);
            var newImports_1 = __spreadArray([], existingImports, true);
            iconsNeedingImport.forEach(function (_a) {
                var componentName = _a.componentName;
                if (!newImports_1.includes(componentName)) {
                    newImports_1.push(componentName);
                }
            });
            newImports_1.sort();
            var formattedImports = newImports_1
                .map(function (imp, idx) { return (idx === 0 ? '  ' : '  ') + imp; })
                .join(',\n');
            updatedContent = updatedContent.replace(importMatch[0], "".concat(importMatch[1], "\n").concat(formattedImports, ",\n").concat(importMatch[3]));
        }
    }
    // Add missing map entries
    var mapRegex = /(const phosphorIconMap[^=]*=\s*\{)([\s\S]*?)(\n\})/s;
    var mapMatch = updatedContent.match(mapRegex);
    if (mapMatch) {
        var mapContent = mapMatch[2];
        var lines = mapContent.split('\n');
        var lastEntryIndex = -1;
        for (var i = lines.length - 1; i >= 0; i--) {
            var line = lines[i].trim();
            if (line && !line.startsWith('//') && (line.includes("'") || line.includes('"'))) {
                lastEntryIndex = i;
                break;
            }
        }
        var newEntries = missingIcons.map(function (_a) {
            var iconName = _a.iconName, componentName = _a.componentName;
            return "  '".concat(iconName, "': ").concat(componentName, ",");
        }).join('\n');
        if (lastEntryIndex >= 0) {
            var mapStartPos = updatedContent.indexOf(mapMatch[0]);
            var mapBodyStart = mapStartPos + mapMatch[1].length;
            var mapBodyEnd = mapBodyStart + mapContent.length;
            var insertionPoint = mapBodyEnd;
            updatedContent =
                updatedContent.substring(0, insertionPoint) +
                    '\n' + newEntries +
                    updatedContent.substring(insertionPoint);
        }
        else {
            var insertionPoint = updatedContent.indexOf(mapMatch[0]) + mapMatch[1].length;
            updatedContent =
                updatedContent.substring(0, insertionPoint) +
                    '\n' + newEntries +
                    updatedContent.substring(insertionPoint);
        }
    }
    writeFileSync(iconLibraryPath, updatedContent, 'utf-8');
    console.log("\u2705 Updated iconLibrary.ts with ".concat(missingIcons.length, " new icon(s)\n"));
}
export function watchToolbarIcons() {
    return {
        name: 'watch-toolbar-icons',
        buildStart: function () {
            // Run on build start
            var root = process.cwd();
            addMissingIcons(root);
        },
        configureServer: function (server) {
            // Watch toolbar config files
            var configsDir = join(process.cwd(), 'src/modules/toolbar/configs');
            // Run once on server start
            addMissingIcons(process.cwd());
            // Watch for changes
            server.watcher.add(configsDir);
            server.watcher.on('change', function (file) {
                if (file.endsWith('.toolbar.json')) {
                    console.log("\n\uD83D\uDCDD Toolbar config changed: ".concat(file));
                    setTimeout(function () {
                        addMissingIcons(process.cwd());
                    }, 100);
                }
            });
        },
    };
}
