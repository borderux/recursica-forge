const fs = require('fs');
const path = '/Users/aaronmartlage/Documents/recursica-forge/recursica-forge/src/vars/Brand.json';

function isNumericShadeKey(key) {
  return /^\d{3,4}$/.test(key);
}

function sortPaletteObject(paletteObj) {
  if (!paletteObj || typeof paletteObj !== 'object') return paletteObj;
  const numericEntries = [];
  const nonNumericEntries = [];

  for (const [key, value] of Object.entries(paletteObj)) {
    if (isNumericShadeKey(key)) {
      const numericKey = parseInt(key, 10);
      numericEntries.push({ key, value, numericKey });
    } else {
      nonNumericEntries.push({ key, value });
    }
  }

  numericEntries.sort((a, b) => a.numericKey - b.numericKey);

  const result = {};
  for (const entry of numericEntries) {
    result[entry.key] = entry.value;
  }

  // Place `default` immediately after numeric keys if present
  const defaultEntryIndex = nonNumericEntries.findIndex(e => e.key === 'default');
  if (defaultEntryIndex !== -1) {
    result['default'] = nonNumericEntries[defaultEntryIndex].value;
    nonNumericEntries.splice(defaultEntryIndex, 1);
  }

  // Append the rest of non-numeric entries in their original order
  for (const entry of nonNumericEntries) {
    result[entry.key] = entry.value;
  }

  return result;
}

function resequenceBrandPalettes(brand) {
  if (!brand || typeof brand !== 'object') return brand;
  for (const themeMode of ['light', 'dark']) {
    const theme = brand[themeMode];
    if (!theme || typeof theme !== 'object') continue;
    const palettes = theme.palette;
    if (!palettes || typeof palettes !== 'object') continue;

    for (const [paletteName, paletteValue] of Object.entries(palettes)) {
      // Only sort nested palette objects (e.g., palette-1, palette-2, neutral)
      // Skip direct color entries like black/white/alert/success/warning which contain $type
      if (
        paletteValue &&
        typeof paletteValue === 'object' &&
        !('$type' in paletteValue)
      ) {
        palettes[paletteName] = sortPaletteObject(paletteValue);
      }
    }
  }
}

(function main() {
  const raw = fs.readFileSync(path, 'utf8');
  const json = JSON.parse(raw);
  if (!json.brand) {
    throw new Error('No brand key found in Brand.json');
  }
  resequenceBrandPalettes(json.brand);
  const output = JSON.stringify(json, null, 2) + '\n';
  fs.writeFileSync(path, output, 'utf8');
  console.log('Resequenced palettes in', path);
})();
