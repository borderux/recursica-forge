import { JsonLike } from '../../resolvers/tokens';
import { shiftValue, shiftNumber, randomizeTokenReference } from './randomizerFactories';

export function randomizeTokens(initialTokens: JsonLike, options: any, diffs: any[]): JsonLike {
  const modifiedTokens = JSON.parse(JSON.stringify(initialTokens)) as any;
  const tokensOpts = options.tokens || {};
  
  function walk(node: any, prefix: string[]) {
    if (!node || typeof node !== 'object') return;
    
    // Disable auto-scaling explicitly to prevent the store from resetting randomized sizes mathematically
    if (node.$extensions && 'com.recursica.autoscaling' in node.$extensions) {
        if ((prefix.includes('size') || prefix.includes('sizes')) && tokensOpts.sizes) {
            node.$extensions['com.recursica.autoscaling'] = false;
        } else if (prefix.includes('font') && prefix.includes('sizes') && tokensOpts.fontSizes) {
            node.$extensions['com.recursica.autoscaling'] = false;
        }
    }
    
    // Check if dimension object
    const isDimension = 'value' in node && 'unit' in node;
    if (isDimension) {
      const oldVal = node.value;
      if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
         node.value = randomizeTokenReference(oldVal);
      } else {
         const parsed = typeof oldVal === 'number' ? oldVal : parseFloat(oldVal);
         if (!Number.isNaN(parsed)) {
             if (prefix.includes('font') && prefix.includes('sizes')) {
                if (tokensOpts.fontSizes) node.value = shiftNumber(parsed, 4, 100, 2, 2);
             } else if ((prefix.includes('size') || prefix.includes('sizes')) && tokensOpts.sizes) {
                node.value = shiftNumber(parsed, 4, 100, 2, 2);
             }
         }
      }
      const hasChanged = node.value !== oldVal;
      diffs.push({ path: 'tokens.' + prefix.join('.'), before: oldVal, after: node.value, changed: hasChanged });
      return;
    }
    
    // Direct token object
    if ('$value' in node && typeof node.$value !== 'object') {
       const val = node.$value;
       if (typeof val === 'string' && val.startsWith('{')) {
          node.$value = randomizeTokenReference(val);
       } else if (prefix.includes('colors') && tokensOpts.colors) {
          if (typeof val === 'string' && val.startsWith('#')) {
             node.$value = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
          }
       } else if ((prefix.includes('opacities') || prefix.includes('opacity')) && tokensOpts.opacities) {
          if (typeof val === 'number') node.$value = shiftNumber(val, 0, 1, 2, 0.1);
       } else if (prefix.includes('font') && prefix.includes('weights') && tokensOpts.fontWeights) {
          // weights usually strings or numbers? Keep it unchanged for now, standard randomized by tokens
       } else if (prefix.includes('letter-spacings') && tokensOpts.letterSpacing) {
          if (typeof val === 'number') node.$value = shiftNumber(val, -0.1, 0.5, 2, 0.05);
       } else if ((prefix.includes('line-heights') || prefix.includes('line-height')) && tokensOpts.lineHeights) {
          if (typeof val === 'number') node.$value = shiftNumber(val, 1.0, 2.0, 2, 0.1);
       }
       const hasChanged = node.$value !== val;
       diffs.push({ path: 'tokens.' + prefix.join('.'), before: val, after: node.$value, changed: hasChanged });
       return;
    }
    
    for (const key of Object.keys(node)) {
       if (key.startsWith('$') && key !== '$value') continue;
       walk(node[key], [...prefix, key]);
    }
  }
  
  walk(modifiedTokens.tokens || modifiedTokens, []);
  return modifiedTokens;
}
