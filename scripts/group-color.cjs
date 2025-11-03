const fs = require('fs');
const path = '/Users/aaronmartlage/Documents/recursica-forge/recursica-forge/src/vars/Brand.json';

function groupColor(shade) {
  if (!shade || typeof shade !== 'object') return shade;
  const hasTone = Object.prototype.hasOwnProperty.call(shade, 'tone');
  const hasOnTone = Object.prototype.hasOwnProperty.call(shade, 'on-tone');
  if (!hasTone && !hasOnTone) return shade;

  const toneVal = hasTone && shade['tone'] && shade['tone'].$value;
  const onToneVal = hasOnTone && shade['on-tone'] && shade['on-tone'].$value;

  const colorValue = {};
  if (hasTone && toneVal !== undefined) colorValue['tone'] = toneVal;
  if (hasOnTone && onToneVal !== undefined) colorValue['on-tone'] = onToneVal;

  const newShade = {};
  let colorInserted = false;
  const insertColor = () => {
    if (colorInserted) return;
    newShade['color'] = { $type: 'color', $value: colorValue };
    colorInserted = true;
  };

  for (const [k, v] of Object.entries(shade)) {
    if (k === 'tone' || k === 'on-tone') continue; // will be grouped
    if (k === 'text' && !colorInserted) insertColor();
    newShade[k] = v;
  }
  if (!colorInserted) insertColor();
  return newShade;
}

function transform(brand) {
  for (const themeMode of ['light', 'dark']) {
    const theme = brand[themeMode];
    if (!theme || typeof theme !== 'object') continue;
    const palettes = theme.palette;
    if (!palettes || typeof palettes !== 'object') continue;

    for (const [paletteName, paletteValue] of Object.entries(palettes)) {
      if (!paletteValue || typeof paletteValue !== 'object' || ('$type' in paletteValue)) continue;
      for (const [shadeKey, shadeVal] of Object.entries(paletteValue)) {
        if (!shadeVal || typeof shadeVal !== 'object') continue;
        palettes[paletteName][shadeKey] = groupColor(shadeVal);
      }
    }
  }
}

(function main() {
  const raw = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(raw);
  if (!data.brand) throw new Error('No brand key found');
  transform(data.brand);
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Grouped color in palettes.');
})();
