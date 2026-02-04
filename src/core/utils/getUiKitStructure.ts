import uikitJson from '../../vars/UIKit.json'

export interface CheckboxItem {
    key: string
    label: string
    children?: CheckboxItem[]
}

const formatLabel = (key: string): string => {
    return key
        .split(/[-_]/) // Split by dash or underscore
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Title case
        .join(' ')
}

export function getUiKitStructure(): CheckboxItem[] {
    const components = (uikitJson as any)?.['ui-kit']?.components || {}

    const processNode = (key: string, node: any, parentKey: string): CheckboxItem => {
        const currentKey = parentKey ? `${parentKey}.${key}` : key

        // Check if node is a leaf definition (has $value and $type)
        // If so, it's a terminal node in our tree (we don't drill into $value)
        if (node && typeof node === 'object' && '$value' in node && '$type' in node) {
            return {
                key: currentKey,
                label: formatLabel(key)
            }
        }

        // Process children
        const children: CheckboxItem[] = []
        if (node && typeof node === 'object') {
            Object.entries(node).forEach(([childKey, childValue]) => {
                // Skip metadata
                if (childKey.startsWith('$')) return

                // Flatten 'properties' node if it's a container (no $value)
                if (childKey === 'properties' && childValue && typeof childValue === 'object' && !('$value' in childValue)) {
                    Object.entries(childValue).forEach(([propKey, propValue]) => {
                        if (propKey.startsWith('$')) return
                        // Pass parentKey as currentKey + .properties so the path remains valid for JSON lookup
                        children.push(processNode(propKey, propValue, `${currentKey}.properties`))
                    })
                } else {
                    children.push(processNode(childKey, childValue, currentKey))
                }
            })
        }

        // Sort children by label
        children.sort((a, b) => a.label.localeCompare(b.label))

        return {
            key: currentKey,
            label: formatLabel(key),
            children: children.length > 0 ? children : undefined
        }
    }

    const rootItems: CheckboxItem[] = []
    Object.entries(components).forEach(([key, value]) => {
        rootItems.push(processNode(key, value, ''))
    })

    rootItems.sort((a, b) => a.label.localeCompare(b.label))

    return rootItems
}
