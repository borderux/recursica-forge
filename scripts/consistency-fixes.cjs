const fs = require('fs');
const path = '/Users/aaronmartlage/Documents/recursica-forge/recursica-forge/src/vars/Brand.json';

function updateThemeRefs(str) {
  if (typeof str !== 'string') return str;
  // Update tone/on-tone to color.tone/color.on-tone
  str = str.replaceAll(/\{theme\.(light|dark)\.palettes\.[^}]*?\.(tone|on-tone)\}/g, (m) => {
    return m.replace(/\.(tone|on-tone)\}/, '.color.$1}');
  });
  // Update high/low-emphasis to text.high/low-emphasis (only within theme refs)
  str = str.replaceAll(/\{theme\.(light|dark)\.palettes\.[^}]*?\.(high-emphasis|low-emphasis)\}/g, (m) => {
    return m.replace(/\.(high-emphasis|low-emphasis)\}/, '.text.$1}');
  });
  return str;
}

function deepMap(value) {
  if (typeof value === 'string') return updateThemeRefs(value);
  if (Array.isArray(value)) return value.map(deepMap);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepMap(v);
    return out;
  }
  return value;
}

function expandPalettesColorMap(palettes) {
  if (!palettes || typeof palettes !== 'object') return;
  if (palettes.$type === 'color' && palettes.$value && typeof palettes.$value === 'object') {
    const colors = palettes.$value;
    delete palettes.$type;
    delete palettes.$value;
    for (const [name, token] of Object.entries(colors)) {
      palettes[name] = { $type: 'color', $value: token };
    }
  }
}

function normalizeDefaultToHue(mode, paletteName, paletteObj) {
  if (!paletteObj || typeof paletteObj !== 'object') return;
  const def = paletteObj.default;
  if (!def || typeof def !== 'object') return;
  let ref = def.$value;
  // If default points to .color.tone or .tone, strip the tail to the shade root
  if (typeof ref === 'string') {
    ref = ref.replace(/\.(color\.)?tone\}$/,'}');
    ref = ref.replace(/\.(text\.)?(high-emphasis|low-emphasis)\}$/,'}');
  }
  paletteObj.default = { $type: 'hue', $value: ref };
}

(function main(){
  const raw = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(raw);

  // 1) Fix references globally
  let updated = deepMap(data);

  // 2) Expand palettes color map and 3) normalize defaults
  for (const mode of ['light','dark']) {
    const theme = updated.brand && updated.brand[mode];
    if (!theme) continue;
    const palettes = theme.palettes;
    expandPalettesColorMap(palettes);
    if (palettes && typeof palettes === 'object') {
      for (const [pname, pobj] of Object.entries(palettes)) {
        if (!pobj || typeof pobj !== 'object' || ('$type' in pobj)) continue; // skip simple color tokens
        normalizeDefaultToHue(mode, pname, pobj);
      }
    }
  }

  fs.writeFileSync(path, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log('Applied consistency fixes: refs updated, color map expanded, defaults normalized.');
})();
