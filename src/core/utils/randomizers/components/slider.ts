import { JsonLike } from '../../../resolvers/tokens';
import { randomizeTokenReference, randomizeRawColor, randomizeNumberValue, randomizeStringValue, randomizeNullValue } from '../randomizerFactories';

export function randomizeSlider(componentNode: any, options: any, diffs: any[], pathPrefix: string): void {
    const uikitOpts = options.uikit?.components || {};
    
    // Helper to check if a specific path is selected
    function isPathSelected(pathArr: string[]): boolean {
        // Path starts after 'components' in the tree, e.g., 'button.variants.appearances'
        const fullPathArr = ['slider', ...pathArr];
        
        let selected = false;
        const segments = [...fullPathArr];
        
        // Find most specific match
        while (segments.length > 0) {
            const key = segments.join('.');
            if (key in uikitOpts) {
                selected = uikitOpts[key];
                break;
            }
            segments.pop();
        }
        return selected;
    }

    // Traverse the component's properties and randomize them
    function walk(node: any, path: string[]) {
        if (!node || typeof node !== 'object') return;

        // Ensure current node path is selected
        if (!isPathSelected(path)) return;

        // Check if dimension object
        const isDimension = 'value' in node && 'unit' in node;
        if (isDimension) {
            const oldVal = node.value;
            if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
                node.value = randomizeTokenReference(oldVal);
            } else {
                const parsed = typeof oldVal === 'number' ? oldVal : parseFloat(oldVal);
                if (!Number.isNaN(parsed)) {
                    node.value = randomizeNumberValue(parsed);
                }
            }
            if (oldVal !== node.value) { diffs.push({ path: pathPrefix + '.' + path.join('.'), before: oldVal, after: node.value, changed: true }); } else { diffs.push({ path: pathPrefix + '.' + path.join('.'), before: oldVal, after: node.value, changed: false }); }
            return;
        }

        // Direct token or value object
        if ('$value' in node && (typeof node.$value !== 'object' || node.$value === null)) {
            const oldVal = node.$value;
            let newVal = oldVal;
            
            if (oldVal === null) {
                newVal = randomizeNullValue(node.$type || '', path[path.length - 1]);
            } else if (typeof oldVal === 'string' && oldVal.startsWith('{')) {
                newVal = randomizeTokenReference(oldVal);
            } else if (typeof oldVal === 'string' && /^#[0-9a-fA-F]{6}$/.test(oldVal)) {
                newVal = randomizeRawColor(oldVal);
            } else if (typeof oldVal === 'number') {
                newVal = randomizeNumberValue(oldVal);
            } else if (typeof oldVal === 'string') {
                newVal = randomizeStringValue(path[path.length - 1], oldVal);
            }

            if (newVal !== oldVal) { node.$value = newVal; diffs.push({ path: pathPrefix + '.' + path.join('.'), before: oldVal, after: newVal, changed: true }); } else { diffs.push({ path: pathPrefix + '.' + path.join('.'), before: oldVal, after: newVal, changed: false }); }
            return;
        }

        for (const key of Object.keys(node)) {
            if (key.startsWith('$') && key !== '$value') continue;
            walk(node[key], [...path, key]);
        }
    }
    
    walk(componentNode, []);
}
