import { JsonLike } from '../../resolvers/tokens';
import { shiftValue, shiftNumber, randomizeTokenReference } from './randomizerFactories';

export function randomizeTokens(initialTokens: JsonLike, options: any): JsonLike {
  const modifiedTokens = JSON.parse(JSON.stringify(initialTokens)) as any;
  const tokensOpts = options.tokens || {};
  
  function walk(node: any, prefix: string[]) {
    if (!node || typeof node !== 'object') return;
    
    // Check if dimension object
    const isDimension = 'value' in node && 'unit' in node;
    if (isDimension) {
      const oldVal = node.value;
      if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
         node.value = randomizeTokenReference(oldVal);
      } else {
         const parsed = typeof oldVal === 'number' ? oldVal : parseFloat(oldVal);
         if (!Number.isNaN(parsed)) {
             if (prefix.includes('font') && prefix.includes('sizes') && tokensOpts.fontSizes) {
                node.value = shiftNumber(parsed, 4, 100, 2);
             } else if ((prefix.includes('size') || prefix.includes('sizes')) && tokensOpts.sizes) {
                node.value = shiftNumber(parsed, 4, 100, 2);
             }
         }
      }
      return;
    }
    
    // Direct token object
    if ('$value' in node && typeof node.$value !== 'object') {
       const val = node.$value;
       if (typeof val === 'string' && val.startsWith('{')) {
          node.$value = randomizeTokenReference(val);
       } else if (prefix.includes('colors') && tokensOpts.colors) {
          if (typeof val === 'string') { /* usually colors are hex */ }
       } else if ((prefix.includes('opacities') || prefix.includes('opacity')) && tokensOpts.opacities) {
          if (typeof val === 'number') node.$value = shiftNumber(val, 0, 1, 0.2);
       } else if (prefix.includes('font') && prefix.includes('weights') && tokensOpts.fontWeights) {
          // weights usually strings or numbers? Keep it unchanged for now, standard randomized by tokens
       }
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
