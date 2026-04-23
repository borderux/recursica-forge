import { JsonLike } from '../../resolvers/tokens';
import { shiftValue, shiftNumber, randomizeTokenReference, randomizeStringValue, randomizeNullValue } from './randomizerFactories';

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
      let isCategoryEnabled = false;
      if (prefix.includes('font') && prefix.includes('sizes')) isCategoryEnabled = !!tokensOpts.fontSizes;
      else if ((prefix.includes('size') || prefix.includes('sizes'))) isCategoryEnabled = !!tokensOpts.sizes;

      if (!isCategoryEnabled) return;

      const oldVal = node.value;
      if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
          node.value = randomizeTokenReference(oldVal);
      } else {
          const parsed = typeof oldVal === 'number' ? oldVal : parseFloat(oldVal);
          if (!Number.isNaN(parsed)) {
              if (prefix.includes('font') && prefix.includes('sizes')) {
                 node.value = shiftNumber(parsed, 4, 100, 2, 2);
              } else {
                 node.value = shiftNumber(parsed, 4, 100, 2, 2);
              }
          }
      }
      const hasChanged = node.value !== oldVal;
      diffs.push({ path: 'tokens.' + prefix.join('.'), before: oldVal, after: node.value, changed: hasChanged });
      return;
    }
    
    // Direct token object
    if ('$value' in node && (typeof node.$value !== 'object' || node.$value === null || Array.isArray(node.$value))) {
       const key = prefix[prefix.length - 1];
       const isBaseline = key === 'none' || key === 'original' || key === 'normal';
       
       let randomized = false;
       const val = node.$value;

       if (typeof val === 'string' && val.startsWith('{')) {
          node.$value = randomizeTokenReference(val);
          randomized = true;
       } else if (prefix.includes('colors') && tokensOpts.colors) {
          if (typeof val === 'string' && val.startsWith('#')) {
             node.$value = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
             randomized = true;
          }
       } else if ((prefix.includes('opacities') || prefix.includes('opacity')) && tokensOpts.opacities) {
          if (typeof val === 'number') {
             node.$value = shiftNumber(val, 0, 1, 2, 0.1);
             randomized = true;
          }
       } else if (prefix.includes('letter-spacings') && tokensOpts.letterSpacing) {
          if (typeof val === 'number') {
             node.$value = shiftNumber(val, -0.1, 0.5, 2, 0.05);
             randomized = true;
          }
       } else if ((prefix.includes('line-heights') || prefix.includes('line-height')) && tokensOpts.lineHeights) {
          if (typeof val === 'number') {
             node.$value = shiftNumber(val, 1.0, 2.0, 2, 0.1);
             randomized = true;
          }
       }

       if (randomized) {
           const hasChanged = JSON.stringify(node.$value) !== JSON.stringify(val);
           if (!isBaseline || hasChanged) {
               diffs.push({ path: 'tokens.' + prefix.join('.'), before: val, after: node.$value, changed: hasChanged });
           }
       }
       return;
    }

    // Handle {value, unit} dimension objects for sizes, font.sizes, letter-spacings, and line-heights
    if ('$value' in node && typeof node.$value === 'object' && node.$value !== null && !Array.isArray(node.$value) && 'value' in node.$value && 'unit' in node.$value) {
       const val = node.$value;
       let randomized = false;

       if (prefix.includes('font') && prefix.includes('sizes') && tokensOpts.fontSizes && typeof val.value === 'number') {
          node.$value = { ...val, value: shiftNumber(val.value, 4, 100, 2, 2) };
          randomized = true;
       } else if ((prefix.includes('sizes') || prefix.includes('size')) && !prefix.includes('font') && tokensOpts.sizes && typeof val.value === 'number') {
          node.$value = { ...val, value: shiftNumber(val.value, 0, 100, 2, 2) };
          randomized = true;
       } else if (prefix.includes('letter-spacings') && tokensOpts.letterSpacing && typeof val.value === 'number') {
          node.$value = { ...val, value: shiftNumber(val.value, -0.1, 0.5, 2, 0.05) };
          randomized = true;
       } else if ((prefix.includes('line-heights') || prefix.includes('line-height')) && tokensOpts.lineHeights && typeof val.value === 'number') {
          node.$value = { ...val, value: shiftNumber(val.value, 0.9, 2.0, 2, 0.1) };
          randomized = true;
       }

       if (randomized) {
           const hasChanged = JSON.stringify(node.$value) !== JSON.stringify(val);
           diffs.push({ path: 'tokens.' + prefix.join('.'), before: val, after: node.$value, changed: hasChanged });
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
