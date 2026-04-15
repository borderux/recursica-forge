import { JsonLike } from '../../resolvers/tokens';
import { randomizeTokenReference, randomizeRawColor, randomizeNumberValue, randomizeStringValue, randomizeNullValue } from './randomizerFactories';

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
    const isLayers = path.includes('layers') && (path.includes('properties') || path.includes('elements'));

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
    let dimObj = null;
    if ('value' in node && 'unit' in node) {
        dimObj = node;
    } else if ('$value' in node && typeof node.$value === 'object' && node.$value !== null && 'value' in node.$value && 'unit' in node.$value) {
        dimObj = node.$value;
    }

    if (dimObj) {
        if (!shouldRandomize) return;
        const oldVal = dimObj.value;
        if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
            dimObj.value = randomizeTokenReference(oldVal, path.join('.'));
        } else {
            const parsed = typeof oldVal === 'number' ? oldVal : parseFloat(oldVal);
            if (!Number.isNaN(parsed)) {
                if (dimObj.unit === 'percentage') {
                    const asFloat = parsed <= 1 ? parsed : parsed / 100;
                    // Ensure a non-zero shift by picking from (-0.1, -0.05, 0.05, 0.1)
                    const options = [-0.1, -0.05, 0.05, 0.1];
                    const shift = options[Math.floor(Math.random() * options.length)];
                    const result = Math.max(0, Math.min(1, asFloat + shift));
                    let newVal = Number(result.toFixed(2));
                    // Ensure we actually moved from oldVal
                    if (newVal === asFloat) {
                        newVal = asFloat > 0.5 ? Number((asFloat - 0.1).toFixed(2)) : Number((asFloat + 0.1).toFixed(2));
                    }
                    dimObj.value = Math.round(newVal * 100);
                } else {
                    dimObj.value = randomizeNumberValue(parsed);
                }
            }
        }
        let displayOld = oldVal;
        if (dimObj.unit === 'percentage' && typeof oldVal === 'number' && oldVal > 1) {
            displayOld = Number((oldVal / 100).toFixed(2));
        }
        const hasChanged = oldVal !== dimObj.value;
        if (hasChanged) {
           diffs.push({ path: 'theme.' + path.join('.'), before: displayOld, after: dimObj.value, changed: hasChanged });
        }
        return;
    }

    if ('$value' in node && (typeof node.$value !== 'object' || node.$value === null || Array.isArray(node.$value))) {
       if (!shouldRandomize) return;
       const oldVal = node.$value;
       let newVal = oldVal;
       if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
          newVal = randomizeTokenReference(oldVal, path.join('.'));
       } else if (typeof oldVal === 'string' && /^#[0-9a-fA-F]{6}$/.test(oldVal)) {
          newVal = randomizeRawColor(oldVal);
       } else if (typeof oldVal === 'number') {
          if (path.includes('opacity')) {
              const asFloat = oldVal <= 1 ? oldVal : oldVal / 100;
              // Ensure a non-zero shift by picking from (-0.1, -0.05, 0.05, 0.1)
              const options = [-0.1, -0.05, 0.05, 0.1];
              const shift = options[Math.floor(Math.random() * options.length)];
              const result = Math.max(0, Math.min(1, asFloat + shift));
              newVal = Number(result.toFixed(2));
              // Ensure we actually moved from oldVal
              if (newVal === asFloat) {
                  newVal = asFloat > 0.5 ? Number((asFloat - 0.1).toFixed(2)) : Number((asFloat + 0.1).toFixed(2));
              }
          } else {
              newVal = randomizeNumberValue(oldVal);
          }
       } else if (typeof oldVal === 'string') {
          newVal = randomizeStringValue(path[path.length - 1], oldVal);
       } else if (oldVal === null) {
          const type = node.$type || 'string';
          newVal = randomizeNullValue(type, path[path.length - 1]);
       }
       let displayOld = oldVal;
       if (path.includes('opacity') && typeof oldVal === 'number' && oldVal > 1) {
           displayOld = Number((oldVal / 100).toFixed(2));
       }
       const hasChanged = newVal !== oldVal;
       if (hasChanged) {
          node.$value = newVal;
       }
       diffs.push({ path: 'theme.' + path.join('.'), before: displayOld, after: newVal, changed: hasChanged });
       return;
    }

    if ('$type' in node && node.$type === 'typography' && themeOpts.type) {
       const tv = node.$value;
       if (tv && typeof tv === 'object') {
          for (const key of Object.keys(tv)) {
             const oldVal = tv[key];
             const fullPathStr = path.join('.') + '.$value.' + key;
             let newVal = oldVal;
             
             const isExcluded = ['fontWeight', 'fontStyle', 'textCase', 'textDecoration'].includes(key);
             if (isExcluded) continue;

             if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
                newVal = randomizeTokenReference(oldVal, fullPathStr);
             } else if (typeof oldVal === 'string') {
                newVal = randomizeStringValue(key, oldVal);
             } else if (typeof oldVal === 'number') {
                newVal = randomizeNumberValue(oldVal);
             }
             
             const hasChanged = newVal !== oldVal;
             if (hasChanged) {
                tv[key] = newVal;
                diffs.push({ path: 'theme.' + fullPathStr, before: oldVal, after: newVal, changed: hasChanged });
             }
          }
       }
       return;
    }
    
    // Add support for generic leaf nodes that might be strings (e.g. border-style)
    if ('$value' in node && typeof node.$value === 'string' && !node.$value.startsWith('{') && !/^#[0-9a-fA-F]{6}$/.test(node.$value) && shouldRandomize) {
        const oldVal = node.$value;
        const newVal = randomizeStringValue(path[path.length - 1], oldVal);
        const hasChanged = newVal !== oldVal;
        if (hasChanged) {
            node.$value = newVal;
            diffs.push({ path: 'theme.' + path.join('.'), before: oldVal, after: newVal, changed: hasChanged });
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
