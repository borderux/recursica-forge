const fs = require('fs');
const path = '/Users/aaronmartlage/Documents/recursica-forge/recursica-forge/src/vars/Brand.json';

function replaceRefsDeep(value) {
  if (typeof value === 'string') {
    return value
      .replaceAll('{theme.light.palette.', '{theme.light.palettes.')
      .replaceAll('{theme.dark.palette.', '{theme.dark.palettes.');
  }
  if (Array.isArray(value)) return value.map(replaceRefsDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = replaceRefsDeep(v);
    }
    return out;
  }
  return value;
}

function reorderPalettes(palettes) {
  const entries = Object.entries(palettes);
  const neutralEntry = entries.find(([k]) => k === 'neutral');
  const numbered = entries.filter(([k]) => /^palette-\d+$/.test(k)).sort((a,b)=>{
    const na = parseInt(a[0].split('-')[1], 10);
    const nb = parseInt(b[0].split('-')[1], 10);
    return na - nb;
  });
  const others = entries.filter(([k]) => k !== 'neutral' && !/^palette-\d+$/.test(k));

  const ordered = {};
  if (neutralEntry) ordered[neutralEntry[0]] = neutralEntry[1];
  for (const [k,v] of numbered) ordered[k] = v;
  for (const [k,v] of others) ordered[k] = v;
  return ordered;
}

(function main(){
  const raw = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(raw);

  // Update references first
  const updated = replaceRefsDeep(data);

  // Rename palette -> palettes and reorder per theme
  for (const mode of ['light','dark']) {
    if (!updated.brand || !updated.brand[mode]) continue;
    const theme = updated.brand[mode];
    if (theme.palette) {
      theme.palettes = reorderPalettes(theme.palette);
      delete theme.palette;
    } else if (theme.palettes) {
      theme.palettes = reorderPalettes(theme.palettes);
    }
  }

  fs.writeFileSync(path, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log('Renamed palette->palettes, updated references, reordered with neutral first.');
})();
