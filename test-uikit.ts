import { generateThemeComponentCss, initTokens } from './src/core/compliance/uikitToCss';
import uikit from './recursica_ui-kit.json';
import brand from './recursica_brand.json';

const css = generateThemeComponentCss(uikit, 'light');
console.log(css.split(';').filter(line => line.includes('badge')).join(';\n'));
