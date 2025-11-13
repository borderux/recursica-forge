const fs = require('fs');
const path = require('path');

const brandPath = path.join(__dirname, '../src/vars/Brand.json');

console.log('Reading Brand.json...');
const brand = JSON.parse(fs.readFileSync(brandPath, 'utf8'));

// Fix: Rename "core" to "core-colors" in both light and dark
if (brand.brand?.light?.palettes?.core) {
  brand.brand.light.palettes['core-colors'] = brand.brand.light.palettes.core;
  delete brand.brand.light.palettes.core;
  console.log('✓ Renamed light.palettes.core to core-colors');
}

if (brand.brand?.dark?.palettes?.core) {
  brand.brand.dark.palettes['core-colors'] = brand.brand.dark.palettes.core;
  delete brand.brand.dark.palettes.core;
  console.log('✓ Renamed dark.palettes.core to core-colors');
}

// Replicate light structure to dark if dark is incomplete
if (brand.brand?.light && brand.brand?.dark) {
  const light = brand.brand.light;
  const dark = brand.brand.dark;
  
  // Function to deep clone and replace light references with dark
  const replicateToDark = (lightObj, darkObj, path = '') => {
    if (!lightObj || typeof lightObj !== 'object' || Array.isArray(lightObj)) {
      return lightObj;
    }
    
    const result = { ...darkObj };
    
    for (const [key, value] of Object.entries(lightObj)) {
      if (key === '$value' && typeof value === 'string') {
        // Replace light references with dark references
        result[key] = value
          .replace(/{brand\.light\./g, '{brand.dark.')
          .replace(/{theme\.light\./g, '{theme.dark.');
      } else if (key === '$type') {
        result[key] = value;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = replicateToDark(value, result[key] || {}, `${path}.${key}`);
      } else {
        // Only copy if dark doesn't already have this key
        if (!(key in result)) {
          result[key] = value;
        }
      }
    }
    
    return result;
  };
  
  // Replicate palettes structure
  if (light.palettes && dark.palettes) {
    console.log('Replicating light palettes structure to dark...');
    dark.palettes = replicateToDark(light.palettes, dark.palettes, 'palettes');
    console.log('✓ Replicated palettes');
  }
  
  // Replicate elevations structure
  if (light.elevations && (!dark.elevations || Object.keys(dark.elevations).length < Object.keys(light.elevations).length)) {
    console.log('Replicating light elevations structure to dark...');
    dark.elevations = replicateToDark(light.elevations, dark.elevations || {}, 'elevations');
    console.log('✓ Replicated elevations');
  }
  
  // Replicate layer structure
  if (light.layer && (!dark.layer || Object.keys(dark.layer).length < Object.keys(light.layer).length)) {
    console.log('Replicating light layer structure to dark...');
    dark.layer = replicateToDark(light.layer, dark.layer || {}, 'layer');
    console.log('✓ Replicated layer');
  }
  
  // Replicate other top-level structures
  const topLevelKeys = ['dimension', 'typography', 'grid'];
  topLevelKeys.forEach(key => {
    if (light[key] && (!dark[key] || Object.keys(dark[key] || {}).length < Object.keys(light[key]).length)) {
      console.log(`Replicating light ${key} structure to dark...`);
      dark[key] = replicateToDark(light[key], dark[key] || {}, key);
      console.log(`✓ Replicated ${key}`);
    }
  });
}

console.log('Writing updated Brand.json...');
fs.writeFileSync(brandPath, JSON.stringify(brand, null, 2) + '\n');
console.log('✓ Done!');

