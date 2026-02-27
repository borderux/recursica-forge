import { getComponentCssVar, buildVariantColorCssVar } from './src/components/utils/cssVarNames';

console.log("getComponentCssVar:", getComponentCssVar('Badge', 'colors', 'primary-color-background', 'layer-0'));
console.log("buildVariantColorCssVar:", buildVariantColorCssVar('Badge', 'primary-color', 'background', 'layer-0'));
