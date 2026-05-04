const fs = require('fs');

const uikit = JSON.parse(fs.readFileSync('./recursica_ui-kit.json', 'utf8'));
const brand = JSON.parse(fs.readFileSync('./recursica_brand.json', 'utf8'));

console.log("brand light layer 1 elevation:");
console.log(brand.themes.light.layers['layer-1'].properties.elevation);

console.log("brand dark layer 1 elevation:");
console.log(brand.themes.dark.layers['layer-1'].properties.elevation);
