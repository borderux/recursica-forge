
const fs = require('fs');
const path = require('path');

const uikitPath = path.resolve('./src/vars/UIKit.json');
const uikitJson = JSON.parse(fs.readFileSync(uikitPath, 'utf-8'));

function toCssVarName(name, mode) {
    return `--${name.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()}`;
}

function parseComponentStructure(componentName) {
    const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
    const uikitRoot = uikitJson
    const components = uikitRoot?.['ui-kit']?.components || {}
    const component = components[componentKey]

    if (!component) {
        return { variants: [], props: [] }
    }

    const variants = []
    const props = []
    const seenVariants = new Set()

    function traverse(obj, prefix, variantProp) {
        if (obj == null || typeof obj !== 'object') return

        Object.entries(obj).forEach(([key, value]) => {
            if (key.startsWith('$')) return

            const currentPath = [...prefix, key]

            if (key === 'properties' && typeof value === 'object' && value !== null && !('$value' in value)) {
                traverse(value, currentPath, variantProp)
                return
            }

            if (value && typeof value === 'object' && '$value' in value && '$type' in value) {

                const type = value.$type
                // Mock fullPath logic (simplified)
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
