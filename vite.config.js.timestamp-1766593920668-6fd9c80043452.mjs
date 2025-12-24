// vite.config.js
import { defineConfig } from "file:///Users/leanna/Documents/GitHub/recursica-forge/node_modules/vitest/dist/config.js";
import react from "file:///Users/leanna/Documents/GitHub/recursica-forge/node_modules/@vitejs/plugin-react/dist/index.js";
import { vanillaExtractPlugin } from "file:///Users/leanna/Documents/GitHub/recursica-forge/node_modules/@vanilla-extract/vite-plugin/dist/vanilla-extract-vite-plugin.cjs.js";

// vite-plugins/watch-toolbar-icons.ts
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
function kebabToPascal(kebab) {
  return kebab.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
function extractIconsFromConfig(config, iconSet = /* @__PURE__ */ new Set()) {
  if (typeof config !== "object" || config === null) {
    return iconSet;
  }
  if (typeof config.icon === "string" && config.icon) {
    iconSet.add(config.icon);
  }
  for (const value of Object.values(config)) {
    if (typeof value === "object" && value !== null) {
      extractIconsFromConfig(value, iconSet);
    }
  }
  return iconSet;
}
function getIconNamesFromToolbarConfigs(configsDir) {
  const iconSet = /* @__PURE__ */ new Set();
  try {
    const files = readdirSync(configsDir);
    const configFiles = files.filter((f) => f.endsWith(".toolbar.json"));
    for (const file of configFiles) {
      const filePath = join(configsDir, file);
      try {
        const content = readFileSync(filePath, "utf-8");
        const config = JSON.parse(content);
        extractIconsFromConfig(config, iconSet);
      } catch (error) {
        console.warn(`\u26A0\uFE0F  Error reading ${file}:`, error);
      }
    }
  } catch (error) {
    console.error("Error reading toolbar configs directory:", error);
  }
  return Array.from(iconSet);
}
function parseIconLibrary(iconLibraryPath) {
  try {
    const content = readFileSync(iconLibraryPath, "utf-8");
    const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@phosphor-icons\/react['"]/);
    const importedIcons = importMatch ? importMatch[1].split(",").map((i) => i.trim()).filter(Boolean) : [];
    const mapMatch = content.match(/const phosphorIconMap[^=]*=\s*\{([^}]+)\}/s);
    const mappedNames = /* @__PURE__ */ new Set();
    if (mapMatch) {
      const mapContent = mapMatch[1];
      const entryRegex = /['"]([^'"]+)['"]\s*:/g;
      let match;
      while ((match = entryRegex.exec(mapContent)) !== null) {
        mappedNames.add(match[1]);
      }
    }
    return { importedIcons, mappedNames, content };
  } catch (error) {
    console.error("Error reading iconLibrary.ts:", error);
    return { importedIcons: [], mappedNames: /* @__PURE__ */ new Set(), content: "" };
  }
}
function addMissingIcons(root) {
  const configsDir = join(root, "src/modules/toolbar/configs");
  const iconLibraryPath = join(root, "src/modules/components/iconLibrary.ts");
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
    } else {
      missingIcons.push({ iconName, componentName, needsImport: false });
    }
  }
  if (missingIcons.length === 0) {
    return;
  }
  console.log(`
\u{1F4E6} Found ${missingIcons.length} missing icon(s) from toolbar configs:`);
  missingIcons.forEach(({ iconName, componentName }) => {
    console.log(`  - ${iconName} (${componentName})`);
  });
  let updatedContent = content;
  const iconsNeedingImport = missingIcons.filter((i) => i.needsImport);
  if (iconsNeedingImport.length > 0) {
    const importMatch = updatedContent.match(/(import\s*\{)([^}]+)(\}\s*from\s*['"]@phosphor-icons\/react['"])/s);
    if (importMatch) {
      const existingImports = importMatch[2].split(",").map((i) => i.trim()).filter(Boolean);
      const newImports = [...existingImports];
      iconsNeedingImport.forEach(({ componentName }) => {
        if (!newImports.includes(componentName)) {
          newImports.push(componentName);
        }
      });
      newImports.sort();
      const formattedImports = newImports.map((imp, idx) => (idx === 0 ? "  " : "  ") + imp).join(",\n");
      updatedContent = updatedContent.replace(
        importMatch[0],
        `${importMatch[1]}
${formattedImports},
${importMatch[3]}`
      );
    }
  }
  const mapRegex = /(const phosphorIconMap[^=]*=\s*\{)([\s\S]*?)(\n\})/s;
  const mapMatch = updatedContent.match(mapRegex);
  if (mapMatch) {
    const mapContent = mapMatch[2];
    const lines = mapContent.split("\n");
    let lastEntryIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line && !line.startsWith("//") && (line.includes("'") || line.includes('"'))) {
        lastEntryIndex = i;
        break;
      }
    }
    const newEntries = missingIcons.map(({ iconName, componentName }) => {
      return `  '${iconName}': ${componentName},`;
    }).join("\n");
    if (lastEntryIndex >= 0) {
      const mapStartPos = updatedContent.indexOf(mapMatch[0]);
      const mapBodyStart = mapStartPos + mapMatch[1].length;
      const mapBodyEnd = mapBodyStart + mapContent.length;
      const insertionPoint = mapBodyEnd;
      updatedContent = updatedContent.substring(0, insertionPoint) + "\n" + newEntries + updatedContent.substring(insertionPoint);
    } else {
      const insertionPoint = updatedContent.indexOf(mapMatch[0]) + mapMatch[1].length;
      updatedContent = updatedContent.substring(0, insertionPoint) + "\n" + newEntries + updatedContent.substring(insertionPoint);
    }
  }
  writeFileSync(iconLibraryPath, updatedContent, "utf-8");
  console.log(`\u2705 Updated iconLibrary.ts with ${missingIcons.length} new icon(s)
`);
}
function watchToolbarIcons() {
  return {
    name: "watch-toolbar-icons",
    buildStart() {
      const root = process.cwd();
      addMissingIcons(root);
    },
    configureServer(server) {
      const configsDir = join(process.cwd(), "src/modules/toolbar/configs");
      addMissingIcons(process.cwd());
      server.watcher.add(configsDir);
      server.watcher.on("change", (file) => {
        if (file.endsWith(".toolbar.json")) {
          console.log(`
\u{1F4DD} Toolbar config changed: ${file}`);
          setTimeout(() => {
            addMissingIcons(process.cwd());
          }, 100);
        }
      });
    }
  };
}

// vite.config.js
var vite_config_default = defineConfig({
  plugins: [react(), vanillaExtractPlugin(), watchToolbarIcons()],
  optimizeDeps: {
    // Exclude phosphor-react from pre-bundling to avoid timeout issues
    // Individual icon imports will still work fine
    exclude: ["phosphor-react"]
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    coverage: {
      provider: "v8"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAidml0ZS1wbHVnaW5zL3dhdGNoLXRvb2xiYXItaWNvbnMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGVhbm5hL0RvY3VtZW50cy9HaXRIdWIvcmVjdXJzaWNhLWZvcmdlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbGVhbm5hL0RvY3VtZW50cy9HaXRIdWIvcmVjdXJzaWNhLWZvcmdlL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9sZWFubmEvRG9jdW1lbnRzL0dpdEh1Yi9yZWN1cnNpY2EtZm9yZ2Uvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyB2YW5pbGxhRXh0cmFjdFBsdWdpbiB9IGZyb20gJ0B2YW5pbGxhLWV4dHJhY3Qvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHsgd2F0Y2hUb29sYmFySWNvbnMgfSBmcm9tICcuL3ZpdGUtcGx1Z2lucy93YXRjaC10b29sYmFyLWljb25zJztcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCB2YW5pbGxhRXh0cmFjdFBsdWdpbigpLCB3YXRjaFRvb2xiYXJJY29ucygpXSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgICAgLy8gRXhjbHVkZSBwaG9zcGhvci1yZWFjdCBmcm9tIHByZS1idW5kbGluZyB0byBhdm9pZCB0aW1lb3V0IGlzc3Vlc1xuICAgICAgICAvLyBJbmRpdmlkdWFsIGljb24gaW1wb3J0cyB3aWxsIHN0aWxsIHdvcmsgZmluZVxuICAgICAgICBleGNsdWRlOiBbJ3Bob3NwaG9yLXJlYWN0J10sXG4gICAgfSxcbiAgICB0ZXN0OiB7XG4gICAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgICAgICBzZXR1cEZpbGVzOiBbJy4vdml0ZXN0LnNldHVwLnRzJ10sXG4gICAgICAgIGdsb2JhbHM6IHRydWUsXG4gICAgICAgIGNvdmVyYWdlOiB7XG4gICAgICAgICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgICAgfSxcbiAgICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9sZWFubmEvRG9jdW1lbnRzL0dpdEh1Yi9yZWN1cnNpY2EtZm9yZ2Uvdml0ZS1wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbGVhbm5hL0RvY3VtZW50cy9HaXRIdWIvcmVjdXJzaWNhLWZvcmdlL3ZpdGUtcGx1Z2lucy93YXRjaC10b29sYmFyLWljb25zLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9sZWFubmEvRG9jdW1lbnRzL0dpdEh1Yi9yZWN1cnNpY2EtZm9yZ2Uvdml0ZS1wbHVnaW5zL3dhdGNoLXRvb2xiYXItaWNvbnMudHNcIjsvKipcbiAqIFZpdGUgcGx1Z2luIHRvIHdhdGNoIHRvb2xiYXIgY29uZmlnIEpTT04gZmlsZXMgYW5kIGF1dG9tYXRpY2FsbHlcbiAqIGFkZCBtaXNzaW5nIGljb25zIHRvIGljb25MaWJyYXJ5LnRzXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jLCByZWFkZGlyU3luYyB9IGZyb20gJ2ZzJ1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnXG5cbi8qKlxuICogQ29udmVydCBrZWJhYi1jYXNlIHRvIFBhc2NhbENhc2VcbiAqL1xuZnVuY3Rpb24ga2ViYWJUb1Bhc2NhbChrZWJhYjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGtlYmFiXG4gICAgLnNwbGl0KCctJylcbiAgICAubWFwKHdvcmQgPT4gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSkpXG4gICAgLmpvaW4oJycpXG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgZXh0cmFjdCBhbGwgaWNvbiBuYW1lcyBmcm9tIGEgdG9vbGJhciBjb25maWcgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RJY29uc0Zyb21Db25maWcoY29uZmlnOiBhbnksIGljb25TZXQ6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpKTogU2V0PHN0cmluZz4ge1xuICBpZiAodHlwZW9mIGNvbmZpZyAhPT0gJ29iamVjdCcgfHwgY29uZmlnID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGljb25TZXRcbiAgfVxuICBcbiAgLy8gQ2hlY2sgaWYgdGhpcyBvYmplY3QgaGFzIGFuIFwiaWNvblwiIHByb3BlcnR5XG4gIGlmICh0eXBlb2YgY29uZmlnLmljb24gPT09ICdzdHJpbmcnICYmIGNvbmZpZy5pY29uKSB7XG4gICAgaWNvblNldC5hZGQoY29uZmlnLmljb24pXG4gIH1cbiAgXG4gIC8vIFJlY3Vyc2l2ZWx5IGNoZWNrIGFsbCBwcm9wZXJ0aWVzXG4gIGZvciAoY29uc3QgdmFsdWUgb2YgT2JqZWN0LnZhbHVlcyhjb25maWcpKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgIGV4dHJhY3RJY29uc0Zyb21Db25maWcodmFsdWUsIGljb25TZXQpXG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gaWNvblNldFxufVxuXG4vKipcbiAqIEdldCBhbGwgaWNvbiBuYW1lcyBmcm9tIGFsbCB0b29sYmFyIGNvbmZpZyBmaWxlc1xuICovXG5mdW5jdGlvbiBnZXRJY29uTmFtZXNGcm9tVG9vbGJhckNvbmZpZ3MoY29uZmlnc0Rpcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBpY29uU2V0ID0gbmV3IFNldDxzdHJpbmc+KClcbiAgXG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZXMgPSByZWFkZGlyU3luYyhjb25maWdzRGlyKVxuICAgIGNvbnN0IGNvbmZpZ0ZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gZi5lbmRzV2l0aCgnLnRvb2xiYXIuanNvbicpKVxuICAgIFxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBjb25maWdGaWxlcykge1xuICAgICAgY29uc3QgZmlsZVBhdGggPSBqb2luKGNvbmZpZ3NEaXIsIGZpbGUpXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmLTgnKVxuICAgICAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKGNvbnRlbnQpXG4gICAgICAgIGV4dHJhY3RJY29uc0Zyb21Db25maWcoY29uZmlnLCBpY29uU2V0KVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBcdTI2QTBcdUZFMEYgIEVycm9yIHJlYWRpbmcgJHtmaWxlfTpgLCBlcnJvcilcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVhZGluZyB0b29sYmFyIGNvbmZpZ3MgZGlyZWN0b3J5OicsIGVycm9yKVxuICB9XG4gIFxuICByZXR1cm4gQXJyYXkuZnJvbShpY29uU2V0KVxufVxuXG4vKipcbiAqIFBhcnNlIGljb25MaWJyYXJ5LnRzIHRvIGdldCBpbXBvcnRlZCBpY29ucyBhbmQgbWFwcGVkIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSWNvbkxpYnJhcnkoaWNvbkxpYnJhcnlQYXRoOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGljb25MaWJyYXJ5UGF0aCwgJ3V0Zi04JylcbiAgICBcbiAgICAvLyBFeHRyYWN0IGltcG9ydHNcbiAgICBjb25zdCBpbXBvcnRNYXRjaCA9IGNvbnRlbnQubWF0Y2goL2ltcG9ydFxccypcXHsoW159XSspXFx9XFxzKmZyb21cXHMqWydcIl1AcGhvc3Bob3ItaWNvbnNcXC9yZWFjdFsnXCJdLylcbiAgICBjb25zdCBpbXBvcnRlZEljb25zID0gaW1wb3J0TWF0Y2hcbiAgICAgID8gaW1wb3J0TWF0Y2hbMV1cbiAgICAgICAgICAuc3BsaXQoJywnKVxuICAgICAgICAgIC5tYXAoaSA9PiBpLnRyaW0oKSlcbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICA6IFtdXG4gICAgXG4gICAgLy8gRXh0cmFjdCBtYXBwZWQgaWNvbiBuYW1lc1xuICAgIGNvbnN0IG1hcE1hdGNoID0gY29udGVudC5tYXRjaCgvY29uc3QgcGhvc3Bob3JJY29uTWFwW149XSo9XFxzKlxceyhbXn1dKylcXH0vcylcbiAgICBjb25zdCBtYXBwZWROYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgaWYgKG1hcE1hdGNoKSB7XG4gICAgICBjb25zdCBtYXBDb250ZW50ID0gbWFwTWF0Y2hbMV1cbiAgICAgIGNvbnN0IGVudHJ5UmVnZXggPSAvWydcIl0oW14nXCJdKylbJ1wiXVxccyo6L2dcbiAgICAgIGxldCBtYXRjaFxuICAgICAgd2hpbGUgKChtYXRjaCA9IGVudHJ5UmVnZXguZXhlYyhtYXBDb250ZW50KSkgIT09IG51bGwpIHtcbiAgICAgICAgbWFwcGVkTmFtZXMuYWRkKG1hdGNoWzFdKVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4geyBpbXBvcnRlZEljb25zLCBtYXBwZWROYW1lcywgY29udGVudCB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVhZGluZyBpY29uTGlicmFyeS50czonLCBlcnJvcilcbiAgICByZXR1cm4geyBpbXBvcnRlZEljb25zOiBbXSwgbWFwcGVkTmFtZXM6IG5ldyBTZXQ8c3RyaW5nPigpLCBjb250ZW50OiAnJyB9XG4gIH1cbn1cblxuLyoqXG4gKiBBZGQgbWlzc2luZyBpY29ucyB0byBpY29uTGlicmFyeS50c1xuICovXG5mdW5jdGlvbiBhZGRNaXNzaW5nSWNvbnMocm9vdDogc3RyaW5nKSB7XG4gIGNvbnN0IGNvbmZpZ3NEaXIgPSBqb2luKHJvb3QsICdzcmMvbW9kdWxlcy90b29sYmFyL2NvbmZpZ3MnKVxuICBjb25zdCBpY29uTGlicmFyeVBhdGggPSBqb2luKHJvb3QsICdzcmMvbW9kdWxlcy9jb21wb25lbnRzL2ljb25MaWJyYXJ5LnRzJylcbiAgXG4gIGNvbnN0IGljb25OYW1lcyA9IGdldEljb25OYW1lc0Zyb21Ub29sYmFyQ29uZmlncyhjb25maWdzRGlyKVxuICBjb25zdCB7IGltcG9ydGVkSWNvbnMsIG1hcHBlZE5hbWVzLCBjb250ZW50IH0gPSBwYXJzZUljb25MaWJyYXJ5KGljb25MaWJyYXJ5UGF0aClcbiAgXG4gIGNvbnN0IG1pc3NpbmdJY29uczogQXJyYXk8eyBpY29uTmFtZTogc3RyaW5nOyBjb21wb25lbnROYW1lOiBzdHJpbmc7IG5lZWRzSW1wb3J0OiBib29sZWFuIH0+ID0gW11cbiAgXG4gIGZvciAoY29uc3QgaWNvbk5hbWUgb2YgaWNvbk5hbWVzKSB7XG4gICAgaWYgKG1hcHBlZE5hbWVzLmhhcyhpY29uTmFtZSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBrZWJhYlRvUGFzY2FsKGljb25OYW1lKVxuICAgIFxuICAgIGlmICghaW1wb3J0ZWRJY29ucy5pbmNsdWRlcyhjb21wb25lbnROYW1lKSkge1xuICAgICAgbWlzc2luZ0ljb25zLnB1c2goeyBpY29uTmFtZSwgY29tcG9uZW50TmFtZSwgbmVlZHNJbXBvcnQ6IHRydWUgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgbWlzc2luZ0ljb25zLnB1c2goeyBpY29uTmFtZSwgY29tcG9uZW50TmFtZSwgbmVlZHNJbXBvcnQ6IGZhbHNlIH0pXG4gICAgfVxuICB9XG4gIFxuICBpZiAobWlzc2luZ0ljb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAvLyBBbGwgaWNvbnMgYWxyZWFkeSBwcmVzZW50XG4gIH1cbiAgXG4gIGNvbnNvbGUubG9nKGBcXG5cdUQ4M0RcdURDRTYgRm91bmQgJHttaXNzaW5nSWNvbnMubGVuZ3RofSBtaXNzaW5nIGljb24ocykgZnJvbSB0b29sYmFyIGNvbmZpZ3M6YClcbiAgbWlzc2luZ0ljb25zLmZvckVhY2goKHsgaWNvbk5hbWUsIGNvbXBvbmVudE5hbWUgfSkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGAgIC0gJHtpY29uTmFtZX0gKCR7Y29tcG9uZW50TmFtZX0pYClcbiAgfSlcbiAgXG4gIGxldCB1cGRhdGVkQ29udGVudCA9IGNvbnRlbnRcbiAgXG4gIC8vIEFkZCBtaXNzaW5nIGltcG9ydHNcbiAgY29uc3QgaWNvbnNOZWVkaW5nSW1wb3J0ID0gbWlzc2luZ0ljb25zLmZpbHRlcihpID0+IGkubmVlZHNJbXBvcnQpXG4gIGlmIChpY29uc05lZWRpbmdJbXBvcnQubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGltcG9ydE1hdGNoID0gdXBkYXRlZENvbnRlbnQubWF0Y2goLyhpbXBvcnRcXHMqXFx7KShbXn1dKykoXFx9XFxzKmZyb21cXHMqWydcIl1AcGhvc3Bob3ItaWNvbnNcXC9yZWFjdFsnXCJdKS9zKVxuICAgIGlmIChpbXBvcnRNYXRjaCkge1xuICAgICAgY29uc3QgZXhpc3RpbmdJbXBvcnRzID0gaW1wb3J0TWF0Y2hbMl1cbiAgICAgICAgLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcChpID0+IGkudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICBcbiAgICAgIGNvbnN0IG5ld0ltcG9ydHMgPSBbLi4uZXhpc3RpbmdJbXBvcnRzXVxuICAgICAgaWNvbnNOZWVkaW5nSW1wb3J0LmZvckVhY2goKHsgY29tcG9uZW50TmFtZSB9KSA9PiB7XG4gICAgICAgIGlmICghbmV3SW1wb3J0cy5pbmNsdWRlcyhjb21wb25lbnROYW1lKSkge1xuICAgICAgICAgIG5ld0ltcG9ydHMucHVzaChjb21wb25lbnROYW1lKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgXG4gICAgICBuZXdJbXBvcnRzLnNvcnQoKVxuICAgICAgXG4gICAgICBjb25zdCBmb3JtYXR0ZWRJbXBvcnRzID0gbmV3SW1wb3J0c1xuICAgICAgICAubWFwKChpbXAsIGlkeCkgPT4gKGlkeCA9PT0gMCA/ICcgICcgOiAnICAnKSArIGltcClcbiAgICAgICAgLmpvaW4oJyxcXG4nKVxuICAgICAgXG4gICAgICB1cGRhdGVkQ29udGVudCA9IHVwZGF0ZWRDb250ZW50LnJlcGxhY2UoXG4gICAgICAgIGltcG9ydE1hdGNoWzBdLFxuICAgICAgICBgJHtpbXBvcnRNYXRjaFsxXX1cXG4ke2Zvcm1hdHRlZEltcG9ydHN9LFxcbiR7aW1wb3J0TWF0Y2hbM119YFxuICAgICAgKVxuICAgIH1cbiAgfVxuICBcbiAgLy8gQWRkIG1pc3NpbmcgbWFwIGVudHJpZXNcbiAgY29uc3QgbWFwUmVnZXggPSAvKGNvbnN0IHBob3NwaG9ySWNvbk1hcFtePV0qPVxccypcXHspKFtcXHNcXFNdKj8pKFxcblxcfSkvc1xuICBjb25zdCBtYXBNYXRjaCA9IHVwZGF0ZWRDb250ZW50Lm1hdGNoKG1hcFJlZ2V4KVxuICBcbiAgaWYgKG1hcE1hdGNoKSB7XG4gICAgY29uc3QgbWFwQ29udGVudCA9IG1hcE1hdGNoWzJdXG4gICAgY29uc3QgbGluZXMgPSBtYXBDb250ZW50LnNwbGl0KCdcXG4nKVxuICAgIGxldCBsYXN0RW50cnlJbmRleCA9IC0xXG4gICAgXG4gICAgZm9yIChsZXQgaSA9IGxpbmVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBsaW5lID0gbGluZXNbaV0udHJpbSgpXG4gICAgICBpZiAobGluZSAmJiAhbGluZS5zdGFydHNXaXRoKCcvLycpICYmIChsaW5lLmluY2x1ZGVzKFwiJ1wiKSB8fCBsaW5lLmluY2x1ZGVzKCdcIicpKSkge1xuICAgICAgICBsYXN0RW50cnlJbmRleCA9IGlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29uc3QgbmV3RW50cmllcyA9IG1pc3NpbmdJY29ucy5tYXAoKHsgaWNvbk5hbWUsIGNvbXBvbmVudE5hbWUgfSkgPT4ge1xuICAgICAgcmV0dXJuIGAgICcke2ljb25OYW1lfSc6ICR7Y29tcG9uZW50TmFtZX0sYFxuICAgIH0pLmpvaW4oJ1xcbicpXG4gICAgXG4gICAgaWYgKGxhc3RFbnRyeUluZGV4ID49IDApIHtcbiAgICAgIGNvbnN0IG1hcFN0YXJ0UG9zID0gdXBkYXRlZENvbnRlbnQuaW5kZXhPZihtYXBNYXRjaFswXSlcbiAgICAgIGNvbnN0IG1hcEJvZHlTdGFydCA9IG1hcFN0YXJ0UG9zICsgbWFwTWF0Y2hbMV0ubGVuZ3RoXG4gICAgICBjb25zdCBtYXBCb2R5RW5kID0gbWFwQm9keVN0YXJ0ICsgbWFwQ29udGVudC5sZW5ndGhcbiAgICAgIFxuICAgICAgY29uc3QgaW5zZXJ0aW9uUG9pbnQgPSBtYXBCb2R5RW5kXG4gICAgICB1cGRhdGVkQ29udGVudCA9IFxuICAgICAgICB1cGRhdGVkQ29udGVudC5zdWJzdHJpbmcoMCwgaW5zZXJ0aW9uUG9pbnQpICtcbiAgICAgICAgJ1xcbicgKyBuZXdFbnRyaWVzICtcbiAgICAgICAgdXBkYXRlZENvbnRlbnQuc3Vic3RyaW5nKGluc2VydGlvblBvaW50KVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbnNlcnRpb25Qb2ludCA9IHVwZGF0ZWRDb250ZW50LmluZGV4T2YobWFwTWF0Y2hbMF0pICsgbWFwTWF0Y2hbMV0ubGVuZ3RoXG4gICAgICB1cGRhdGVkQ29udGVudCA9IFxuICAgICAgICB1cGRhdGVkQ29udGVudC5zdWJzdHJpbmcoMCwgaW5zZXJ0aW9uUG9pbnQpICtcbiAgICAgICAgJ1xcbicgKyBuZXdFbnRyaWVzICtcbiAgICAgICAgdXBkYXRlZENvbnRlbnQuc3Vic3RyaW5nKGluc2VydGlvblBvaW50KVxuICAgIH1cbiAgfVxuICBcbiAgd3JpdGVGaWxlU3luYyhpY29uTGlicmFyeVBhdGgsIHVwZGF0ZWRDb250ZW50LCAndXRmLTgnKVxuICBjb25zb2xlLmxvZyhgXHUyNzA1IFVwZGF0ZWQgaWNvbkxpYnJhcnkudHMgd2l0aCAke21pc3NpbmdJY29ucy5sZW5ndGh9IG5ldyBpY29uKHMpXFxuYClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhdGNoVG9vbGJhckljb25zKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3dhdGNoLXRvb2xiYXItaWNvbnMnLFxuICAgIGJ1aWxkU3RhcnQoKSB7XG4gICAgICAvLyBSdW4gb24gYnVpbGQgc3RhcnRcbiAgICAgIGNvbnN0IHJvb3QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICBhZGRNaXNzaW5nSWNvbnMocm9vdClcbiAgICB9LFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIC8vIFdhdGNoIHRvb2xiYXIgY29uZmlnIGZpbGVzXG4gICAgICBjb25zdCBjb25maWdzRGlyID0gam9pbihwcm9jZXNzLmN3ZCgpLCAnc3JjL21vZHVsZXMvdG9vbGJhci9jb25maWdzJylcbiAgICAgIFxuICAgICAgLy8gUnVuIG9uY2Ugb24gc2VydmVyIHN0YXJ0XG4gICAgICBhZGRNaXNzaW5nSWNvbnMocHJvY2Vzcy5jd2QoKSlcbiAgICAgIFxuICAgICAgLy8gV2F0Y2ggZm9yIGNoYW5nZXNcbiAgICAgIHNlcnZlci53YXRjaGVyLmFkZChjb25maWdzRGlyKVxuICAgICAgc2VydmVyLndhdGNoZXIub24oJ2NoYW5nZScsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLmVuZHNXaXRoKCcudG9vbGJhci5qc29uJykpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgXFxuXHVEODNEXHVEQ0REIFRvb2xiYXIgY29uZmlnIGNoYW5nZWQ6ICR7ZmlsZX1gKVxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgYWRkTWlzc2luZ0ljb25zKHByb2Nlc3MuY3dkKCkpXG4gICAgICAgICAgfSwgMTAwKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gIH1cbn1cblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0VCxTQUFTLG9CQUFvQjtBQUN6VixPQUFPLFdBQVc7QUFDbEIsU0FBUyw0QkFBNEI7OztBQ0lyQyxTQUFTLGNBQWMsZUFBZSxtQkFBbUI7QUFDekQsU0FBUyxZQUFZO0FBS3JCLFNBQVMsY0FBYyxPQUF1QjtBQUM1QyxTQUFPLE1BQ0osTUFBTSxHQUFHLEVBQ1QsSUFBSSxVQUFRLEtBQUssT0FBTyxDQUFDLEVBQUUsWUFBWSxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUMsRUFDeEQsS0FBSyxFQUFFO0FBQ1o7QUFLQSxTQUFTLHVCQUF1QixRQUFhLFVBQXVCLG9CQUFJLElBQUksR0FBZ0I7QUFDMUYsTUFBSSxPQUFPLFdBQVcsWUFBWSxXQUFXLE1BQU07QUFDakQsV0FBTztBQUFBLEVBQ1Q7QUFHQSxNQUFJLE9BQU8sT0FBTyxTQUFTLFlBQVksT0FBTyxNQUFNO0FBQ2xELFlBQVEsSUFBSSxPQUFPLElBQUk7QUFBQSxFQUN6QjtBQUdBLGFBQVcsU0FBUyxPQUFPLE9BQU8sTUFBTSxHQUFHO0FBQ3pDLFFBQUksT0FBTyxVQUFVLFlBQVksVUFBVSxNQUFNO0FBQy9DLDZCQUF1QixPQUFPLE9BQU87QUFBQSxJQUN2QztBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQ1Q7QUFLQSxTQUFTLCtCQUErQixZQUE4QjtBQUNwRSxRQUFNLFVBQVUsb0JBQUksSUFBWTtBQUVoQyxNQUFJO0FBQ0YsVUFBTSxRQUFRLFlBQVksVUFBVTtBQUNwQyxVQUFNLGNBQWMsTUFBTSxPQUFPLE9BQUssRUFBRSxTQUFTLGVBQWUsQ0FBQztBQUVqRSxlQUFXLFFBQVEsYUFB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LFdBQVc7QUFFN0MsWUFBTSxpQkFBaUI7QUFDdkIsdUJBQ0UsZUFBZSxVQUFVLEdBQUcsY0FBYyxJQUMxQyxPQUFPLGFBQ1AsZUFBZSxVQUFVLGNBQWM7QUFBQSxJQUMzQyxPQUFPO0FBQ0wsWUFBTSxpQkFBaUIsZUFBZSxRQUFRLFNBQVMsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLEVBQUU7QUFDekUsdUJBQ0UsZUFBZSxVQUFVLEdBQUcsY0FBYyxJQUMxQyxPQUFPLGFBQ1AsZUFBZSxVQUFVLGNBQWM7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFFQSxnQkFBYyxpQkFBaUIsZ0JBQWdCLE9BQU87QUFDdEQsVUFBUSxJQUFJLHNDQUFpQyxhQUFhLE1BQU07QUFBQSxDQUFnQjtBQUNsRjtBQUVPLFNBQVMsb0JBQTRCO0FBQzFDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFFWCxZQUFNLE9BQU8sUUFBUSxJQUFJO0FBQ3pCLHNCQUFnQixJQUFJO0FBQUEsSUFDdEI7QUFBQSxJQUNBLGdCQUFnQixRQUFRO0FBRXRCLFlBQU0sYUFBYSxLQUFLLFFBQVEsSUFBSSxHQUFHLDZCQUE2QjtBQUdwRSxzQkFBZ0IsUUFBUSxJQUFJLENBQUM7QUFHN0IsYUFBTyxRQUFRLElBQUksVUFBVTtBQUM3QixhQUFPLFFBQVEsR0FBRyxVQUFVLENBQUMsU0FBUztBQUNwQyxZQUFJLEtBQUssU0FBUyxlQUFlLEdBQUc7QUFDbEMsa0JBQVEsSUFBSTtBQUFBLG9DQUFnQyxJQUFJLEVBQUU7QUFDbEQscUJBQVcsTUFBTTtBQUNmLDRCQUFnQixRQUFRLElBQUksQ0FBQztBQUFBLFVBQy9CLEdBQUcsR0FBRztBQUFBLFFBQ1I7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUNGOzs7QUQ3T0EsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUyxDQUFDLE1BQU0sR0FBRyxxQkFBcUIsR0FBRyxrQkFBa0IsQ0FBQztBQUFBLEVBQzlELGNBQWM7QUFBQTtBQUFBO0FBQUEsSUFHVixTQUFTLENBQUMsZ0JBQWdCO0FBQUEsRUFDOUI7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNGLGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyxtQkFBbUI7QUFBQSxJQUNoQyxTQUFTO0FBQUEsSUFDVCxVQUFVO0FBQUEsTUFDTixVQUFVO0FBQUEsSUFDZDtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
