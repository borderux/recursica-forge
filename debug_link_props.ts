
import { parseComponentStructure } from './src/modules/toolbar/utils/componentToolbarUtils';
import * as fs from 'fs';
import * as path from 'path';

// Mock getPropConfig since it's used by some utils we might inadvertently touch, 
// though parseComponentStructure mainly relies on UIKit.json
// parseComponentStructure relies on 'uikitJson' imported from vars/UIKit.json.
// We need to bypass the import or rely on ts-node to handle it.
// Since environment is restricted, I will essentially copy parseComponentStructure logic 
// MINUS the import, injecting the JSON directly.

const uikitPath = path.resolve('./src/vars/UIKit.json');
const uikitJson = JSON.parse(fs.readFileSync(uikitPath, 'utf-8'));

function toCssVarName(name: string, mode: string): string {
    return `--${name.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()}`;
}

// Copying ComponentProp interface and parseComponentStructure function (simplified deps)
interface ComponentProp {
    name: string
    category: string
    type: string
    cssVar: string
    path: string[]
    isVariantSpecific: boolean
    variantProp?: string
    trackSelectedProp?: ComponentProp
    trackUnselectedProp?: ComponentProp
    thumbProps?: Map<string, ComponentProp>
    borderProps?: Map<string, ComponentProp>
    allowedPalettes?: string[]
}

interface ComponentVariant {
    propName: string
    variants: string[]
}

interface ComponentStructure {
    variants: ComponentVariant[]
    props: ComponentProp[]
}

function parseComponentStructure(componentName: string): ComponentStructure {
    const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
    const uikitRoot: any = uikitJson
    const components = uikitRoot?.['ui-kit']?.components || {}
    const component = components[componentKey]

    if (!component) {
        return { variants: [], props: [] }
    }

    const variants: ComponentVariant[] = []
    const props: ComponentProp[] = []
    const seenVariants = new Set<string>()

    function traverse(obj: any, prefix: string[], variantProp?: string): void {
        if (obj == null || typeof obj !== 'object') return

        Object.entries(obj).forEach(([key, value]) => {
            if (key.startsWith('$')) return

            const currentPath = [...prefix, key]

            if (key === 'properties' && typeof value === 'object' && value !== null && !('$value' in value)) {
                traverse(value, currentPath, variantProp)
                return
            }

            if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
                // Skipping variant value check for simplicity in this debug script, focusing on Link structure

                const type = (value as any).$type
                // Mock fullPath logic
                const cssVar = toCssVarName(['components', componentKey, ...currentPath].join('.'), 'light')
                const isVariantSpecific = currentPath.includes('variants')

                let category = prefix[0] || 'root'
                if (currentPath.includes('colors')) {
                    category = 'colors'
                } else if (currentPath.includes('size') || currentPath.includes('sizes')) {
                    category = 'size'
                } else if (prefix.includes('properties') && !currentPath.includes('colors')) {
                    category = 'size'
                }

                props.push({
                    name: key,
                    category,
                    type,
                    cssVar,
                    path: currentPath,
                    isVariantSpecific,
                    variantProp: isVariantSpecific ? variantProp : undefined,
                })
            } else {
                // Recurse
                traverse(value, currentPath, variantProp)
            }
        })
    }

    traverse(component, [])
    return { variants, props }
}

const structure = parseComponentStructure('Link');
console.log('Props found:', structure.props.map(p => `${p.name} (cat: ${p.category}, path: ${p.path.join('.')})`));
