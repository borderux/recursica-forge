import { JsonLike } from '../../resolvers/tokens';
import { randomizeTokenReference, randomizeRawColor, randomizeNumberValue } from './randomizerFactories';

export function randomizeTheme(initialTheme: JsonLike, options: any, diffs: any[]): JsonLike {
  const modifiedTheme = JSON.parse(JSON.stringify(initialTheme)) as any;
  const themeOpts = options.theme || {};
  
  function walk(node: any, path: string[]) {
    if (!node || typeof node !== 'object') return;
    
    // Check if we should randomize this path based on options
    const isCoreProps = path.includes('core-colors');
    const isCorePropElements = path.includes('text-emphasis') || (path.includes('states') && !path.includes('overlay'));
    const isOverlay = path.includes('states') && path.includes('overlay');
    const isType = path.includes('typography');
    const isPalettes = path.includes('palettes') && !isCoreProps;
    const isElevations = path.includes('elevations');
    const isDimensions = path.includes('dimensions');
    const isLayers = path.includes('layer') && (path.includes('properties') || path.includes('elements'));

    let shouldRandomize = false;
    if (isCoreProps && themeOpts.coreProperties) shouldRandomize = true;
    if (isCorePropElements && themeOpts.corePropertyElements) shouldRandomize = true;
    if (isOverlay && themeOpts.overlay) shouldRandomize = true;
    if (isType && themeOpts.type) shouldRandomize = true;
    if (isPalettes && themeOpts.palettes) shouldRandomize = true;
    if (isElevations && themeOpts.elevations) shouldRandomize = true;
    if (isDimensions && themeOpts.dimensions) shouldRandomize = true;
    if (isLayers && themeOpts.layers) shouldRandomize = true;

    // Check if dimension object
    const isDimension = 'value' in node && 'unit' in node;
    if (isDimension) {
        if (!shouldRandomize) return;
        const oldVal = node.value;
        if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
            node.value = randomizeTokenReference(oldVal, path.join('.'));
        } else {
            const parsed = typeof oldVal === 'number' ? oldVal : parseFloat(oldVal);
            if (!Number.isNaN(parsed)) {
                node.value = randomizeNumberValue(parsed);
            }
        }
        if (oldVal !== node.value) {
            diffs.push({ path: 'theme.' + path.join('.'), before: oldVal, after: node.value });
        }
        return;
    }

    if ('$value' in node && typeof node.$value !== 'object') {
       if (!shouldRandomize) return;
       const oldVal = node.$value;
       let newVal = oldVal;
       if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
          newVal = randomizeTokenReference(oldVal, path.join('.'));
       } else if (typeof oldVal === 'string' && /^#[0-9a-fA-F]{6}$/.test(oldVal)) {
          newVal = randomizeRawColor(oldVal);
       } else if (typeof oldVal === 'number') {
          newVal = randomizeNumberValue(oldVal);
       }
       if (newVal !== oldVal) {
          node.$value = newVal;
          diffs.push({ path: 'theme.' + path.join('.'), before: oldVal, after: newVal });
       }
       return;
    }

    if ('$type' in node && node.$type === 'typography' && themeOpts.type) {
       const tv = node.$value;
       if (tv && typeof tv === 'object') {
          for (const key of Object.keys(tv)) {
             const oldVal = tv[key];
             if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
                const newVal = randomizeTokenReference(oldVal);
                if (newVal !== oldVal) {
                   tv[key] = newVal;
                   diffs.push({ path: 'theme.' + path.join('.') + '.$value.' + key, before: oldVal, after: newVal });
                }
             }
          }
       }
       return;
    }

    for (const key of Object.keys(node)) {
       if (key.startsWith('$') && key !== '$value') continue;
       walk(node[key], [...path, key]);
    }
  }

  walk(modifiedTheme, []);
  
  return modifiedTheme;
}
