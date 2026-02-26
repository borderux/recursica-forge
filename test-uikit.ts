import { generateThemeComponentCss, initTokens } from './src/core/compliance/uikitToCss';
import uikit from './src/vars/UIKit.json';
import brand from './src/vars/Brand.json';

const css = generateThemeComponentCss(uikit, 'light');
console.log(css.split(';').filter(line => line.includes('badge')).join(';\n'));
