const fs = require('fs');
const path = '/Users/aaronmartlage/Documents/recursica-forge/recursica-forge/src/vars/Tokens.json';

function transform(value) {
  if (!value) return value;
  if (Array.isArray(value)) return value.map(transform);
  if (typeof value === 'object') {
    // If it's a color token with "$value": { hex: "#..." }, convert to string "#..."
    if (value.$type === 'color' && value.$value && typeof value.$value === 'object') {
      const val = value.$value;
      if (val && typeof val.hex === 'string') {
        return { $type: 'color', $value: val.hex };
      }
    }
    const out = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = transform(v);
    }
    return out;
  }
  return value;
}

(function main(){
  const raw = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(raw);
  const fixed = transform(data);
  fs.writeFileSync(path, JSON.stringify(fixed, null, 2) + '\n', 'utf8');
  console.log('Converted color $value.hex objects to string hex values.');
})();
