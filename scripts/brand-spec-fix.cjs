const fs = require('fs');
const path = '/Users/aaronmartlage/Documents/recursica-forge/recursica-forge/src/vars/Brand.json';

const SHADE_KEY_RE = /^(000|050|100|200|300|400|500|600|700|800|900|1000)$/;

function fixShade(shade) {
  if (!shade || typeof shade !== 'object') return shade;

  // Fix color: move $value.{tone,on-tone} into child tokens under a group with $type: color
  if (shade.color && typeof shade.color === 'object') {
    const c = shade.color;
    if ('$value' in c && typeof c.$value === 'object') {
      const val = c.$value;
      const newColor = { $type: 'color' };
      if (val && typeof val === 'object') {
        if ('tone' in val) newColor.tone = { $value: val.tone };
        if ('on-tone' in val) newColor['on-tone'] = { $value: val['on-tone'] };
      }
      shade.color = newColor;
    } else if (!('$type' in c) && ('tone' in c || 'on-tone' in c)) {
      // If it's already decomposed but missing type, add inherited type
      const newColor = { $type: 'color' };
      for (const [k, v] of Object.entries(c)) {
        newColor[k] = v;
      }
      shade.color = newColor;
    }
  }

  // Fix text: group high/low emphasis under a number-typed group with child tokens
  if (shade.text && typeof shade.text === 'object') {
    const t = shade.text;
    if ('$value' in t && typeof t.$value === 'object') {
      const val = t.$value;
      const newText = { $type: 'number' };
      if ('high-emphasis' in val) newText['high-emphasis'] = { $value: val['high-emphasis'] };
      if ('low-emphasis' in val) newText['low-emphasis'] = { $value: val['low-emphasis'] };
      shade.text = newText;
    } else if (t.$type === 'opacity') {
      // Convert non-standard type to number
      const newText = { $type: 'number' };
      for (const [k, v] of Object.entries(t)) {
        if (k === '$type') continue;
        newText[k] = v;
      }
      shade.text = newText;
    }
  }

  return shade;
}

function transformBrand(brand) {
  for (const mode of ['light','dark']) {
    const theme = brand[mode];
    if (!theme || !theme.palettes) continue;
    const palettes = theme.palettes;

    for (const [pname, pobj] of Object.entries(palettes)) {
      // Skip simple color tokens like black/white/alert/success/warning
      if (pobj && typeof pobj === 'object' && !('$type' in pobj)) {
        // Normalize default: remove non-standard $type if present
        if (pobj.default && typeof pobj.default === 'object' && pobj.default.$type === 'hue') {
          const ref = pobj.default.$value;
          pobj.default = { $value: ref };
        }
        // Fix each shade
        for (const [shadeKey, shadeVal] of Object.entries(pobj)) {
          if (!SHADE_KEY_RE.test(shadeKey)) continue;
          pobj[shadeKey] = fixShade(shadeVal);
        }
      }
    }
  }
}

(function main(){
  const raw = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(raw);
  if (!data.brand) throw new Error('No brand key');
  transformBrand(data.brand);
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Brand spec fixes applied: color/text groups normalized; default type cleaned.');
})();
