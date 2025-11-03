const fs = require('fs');
const path = '/Users/aaronmartlage/Documents/recursica-forge/recursica-forge/src/vars/Brand.json';

function groupTextOpacity(shade) {
  if (!shade || typeof shade !== 'object') return shade;
  const hasHigh = Object.prototype.hasOwnProperty.call(shade, 'high-emphasis');
  const hasLow = Object.prototype.hasOwnProperty.call(shade, 'low-emphasis');
  if (!hasHigh && !hasLow) return shade;

  const highVal = hasHigh && shade['high-emphasis'] && shade['high-emphasis'].$value;
  const lowVal = hasLow && shade['low-emphasis'] && shade['low-emphasis'].$value;

  const newShade = {};
  let textInserted = false;

  // Build $value object for text, including only present values
  const textValue = {};
  if (hasHigh && highVal !== undefined) textValue['high-emphasis'] = highVal;
  if (hasLow && lowVal !== undefined) textValue['low-emphasis'] = lowVal;

  const insertText = () => {
    if (textInserted) return;
    newShade['text'] = { $type: 'opacity', $value: textValue };
    textInserted = true;
  };

  for (const [k, v] of Object.entries(shade)) {
    if (k === 'high-emphasis' || k === 'low-emphasis') {
      // Skip these; they will be grouped under text
      continue;
    }
    newShade[k] = v;
    // Prefer to insert text after on-tone if present
    if (k === 'on-tone' && !textInserted) {
      insertText();
    }
  }
  // If we didn't find on-tone, append text at the end
  if (!textInserted) insertText();
  return newShade;
}

function transformPalettes(brand) {
  for (const themeMode of ['light', 'dark']) {
    const theme = brand[themeMode];
    if (!theme || typeof theme !== 'object') continue;
    const palettes = theme.palette;
    if (!palettes || typeof palettes !== 'object') continue;

    for (const [paletteName, paletteValue] of Object.entries(palettes)) {
      if (!paletteValue || typeof paletteValue !== 'object' || ('$type' in paletteValue)) continue;
      for (const [shadeKey, shadeVal] of Object.entries(paletteValue)) {
        if (!shadeVal || typeof shadeVal !== 'object') continue;
        palettes[paletteName][shadeKey] = groupTextOpacity(shadeVal);
      }
    }
  }
}

(function main() {
  const raw = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(raw);
  if (!data.brand) throw new Error('No brand key found');
  transformPalettes(data.brand);
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Grouped text opacity in palettes.');
})();
