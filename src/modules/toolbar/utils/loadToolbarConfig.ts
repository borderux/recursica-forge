/**
 * Loads toolbar configuration for a component
 */

import ButtonConfig from '../configs/Button.toolbar.json'
import SwitchConfig from '../configs/Switch.toolbar.json'
import AvatarConfig from '../configs/Avatar.toolbar.json'
import ToastConfig from '../configs/Toast.toolbar.json'
import BadgeConfig from '../configs/Badge.toolbar.json'
import ChipConfig from '../configs/Chip.toolbar.json'
import LabelConfig from '../configs/Label.toolbar.json'
import BreadcrumbConfig from '../configs/Breadcrumb.toolbar.json'
import AccordionConfig from '../configs/Accordion.toolbar.json'
import AccordionItemConfig from '../configs/AccordionItem.toolbar.json'
import MenuItemConfig from '../configs/MenuItem.toolbar.json'
import MenuConfig from '../configs/Menu.toolbar.json'
import SliderConfig from '../configs/Slider.toolbar.json'
import SegmentedControlConfig from '../configs/SegmentedControl.toolbar.json'
import SegmentedControlItemConfig from '../configs/SegmentedControlItem.toolbar.json'
import AssistiveElementConfig from '../configs/AssistiveElement.toolbar.json'
import TextFieldConfig from '../configs/TextField.toolbar.json'
import ModalConfig from '../configs/Modal.toolbar.json'
import DropdownConfig from '../configs/Dropdown.toolbar.json'
import TabsConfig from '../configs/Tabs.toolbar.json'
import TooltipConfig from '../configs/Tooltip.toolbar.json'

export interface ToolbarPropConfig {
  icon: string
  label: string
  visible?: boolean
  group?: Record<string, ToolbarPropConfig> // Props that are grouped under this icon
  propertyType?: 'slider' | 'select' | 'color' | 'text' // Custom property type override
  range?: [number, number] // For slider
  step?: number // For slider
}

export interface ToolbarVariantConfig {
  icon: string
  label: string
}

export interface ToolbarConfig {
  variants?: Record<string, ToolbarVariantConfig>
  props: Record<string, ToolbarPropConfig>
}

/**
 * Loads the toolbar config for a component
 * Falls back to default config if component-specific config doesn't exist
 */
export function loadToolbarConfig(componentName: string): ToolbarConfig | null {
  try {
    // Convert component name to kebab-case for file name
    const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')

    // Load component-specific config
    switch (componentKey) {
      case 'button':
        return ButtonConfig as unknown as ToolbarConfig
      case 'switch':
        return SwitchConfig as unknown as ToolbarConfig
      case 'avatar':
        return AvatarConfig as unknown as ToolbarConfig
      case 'toast':
        return ToastConfig as unknown as ToolbarConfig
      case 'badge':
        return BadgeConfig as unknown as ToolbarConfig
      case 'chip':
        return ChipConfig as unknown as ToolbarConfig
      case 'label':
        return LabelConfig as unknown as ToolbarConfig
      case 'breadcrumb':
        return BreadcrumbConfig as unknown as ToolbarConfig
      case 'accordion':
        return AccordionConfig as unknown as ToolbarConfig
      case 'accordion-item':
      case 'accordion item':
        return AccordionItemConfig as unknown as ToolbarConfig
      case 'menu-item':
      case 'menu item':
        return MenuItemConfig as unknown as ToolbarConfig
      case 'menu':
        return MenuConfig as unknown as ToolbarConfig
      case 'slider':
        return SliderConfig as unknown as ToolbarConfig
      case 'segmented-control':
      case 'segmented control':
        return SegmentedControlConfig as unknown as ToolbarConfig
      case 'segmented-control-item':
      case 'segmented control item':
        return SegmentedControlItemConfig as unknown as ToolbarConfig
      case 'assistive-element':
      case 'assistive element':
        return AssistiveElementConfig as unknown as ToolbarConfig
      case 'text-field':
      case 'text field':
        return TextFieldConfig as unknown as ToolbarConfig
      case 'modal':
        return ModalConfig as unknown as ToolbarConfig
      case 'dropdown':
        return DropdownConfig as unknown as ToolbarConfig
      case 'tabs':
        return TabsConfig as unknown as ToolbarConfig
      case 'tooltip':
        return TooltipConfig as unknown as ToolbarConfig
      default:
        return null
    }
  } catch (error) {
    console.warn(`Failed to load toolbar config for ${componentName}:`, error)
    return null
  }
}

/**
 * Gets the config for a specific prop, including searching inside groups
 */
export function getPropConfig(
  componentName: string,
  propName: string
): ToolbarPropConfig | null {
  const config = loadToolbarConfig(componentName)
  if (!config) return null

  const propKey = propName.toLowerCase()

  // First check at the root level
  if (config.props[propKey]) {
    return config.props[propKey]
  }

  // Then check inside groups
  for (const parentPropConfig of Object.values(config.props)) {
    if (parentPropConfig.group && parentPropConfig.group[propKey]) {
      return parentPropConfig.group[propKey]
    }
  }

  return null
}

/**
 * Gets the icon name for a prop
 */
export function getPropIcon(componentName: string, propName: string): string | null {
  const config = getPropConfig(componentName, propName)
  return config?.icon || null
}

/**
 * Gets the label for a prop
 */
export function getPropLabel(componentName: string, propName: string): string | null {
  const config = getPropConfig(componentName, propName)
  return config?.label || null
}

/**
 * Gets the visible property for a prop (defaults to true if not specified)
 */
export function getPropVisible(componentName: string, propName: string): boolean {
  const config = getPropConfig(componentName, propName)
  return config?.visible !== false // Default to true if not specified
}

/**
 * Checks if a prop is grouped under another prop
 */
export function getGroupedPropParent(
  componentName: string,
  propName: string
): string | null {
  const config = loadToolbarConfig(componentName)
  if (!config) return null

  const propKey = propName.toLowerCase()

  // Check if any prop has this prop in its group
  for (const [key, propConfig] of Object.entries(config.props)) {
    if (propConfig.group && propConfig.group[propKey]) {
      return key
    }
  }

  return null
}

/**
 * Gets the config for a grouped prop
 */
export function getGroupedPropConfig(
  componentName: string,
  parentPropName: string,
  groupedPropName: string
): ToolbarPropConfig | null {
  const config = getPropConfig(componentName, parentPropName)
  if (!config || !config.group) return null

  const groupedPropKey = groupedPropName.toLowerCase()
  return config.group[groupedPropKey] || null
}

/**
 * Gets all grouped props for a parent prop
 */
export function getGroupedProps(
  componentName: string,
  parentPropName: string
): Record<string, ToolbarPropConfig> | null {
  const config = getPropConfig(componentName, parentPropName)
  return config?.group || null
}

/**
 * Gets the config for a variant prop (e.g., "color", "size", "style")
 */
export function getVariantConfig(
  componentName: string,
  variantPropName: string
): ToolbarVariantConfig | null {
  const config = loadToolbarConfig(componentName)
  if (!config || !config.variants) return null

  const variantKey = variantPropName.toLowerCase()
  return config.variants[variantKey] || null
}

/**
 * Gets the icon name for a variant prop
 */
export function getVariantIcon(componentName: string, variantPropName: string): string | null {
  const config = getVariantConfig(componentName, variantPropName)
  return config?.icon || null
}

/**
 * Gets the label for a variant prop
 */
export function getVariantLabel(componentName: string, variantPropName: string): string | null {
  const config = getVariantConfig(componentName, variantPropName)
  return config?.label || null
}

