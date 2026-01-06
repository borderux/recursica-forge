/**
 * Carbon Breadcrumb Implementation
 * 
 * Carbon Design System-specific Breadcrumb component that uses CSS variables for theming.
 */

import { Breadcrumb as CarbonBreadcrumb, BreadcrumbItem as CarbonBreadcrumbItem } from '@carbon/react'
import type { BreadcrumbProps as AdapterBreadcrumbProps, BreadcrumbItem } from '../../Breadcrumb'
import { buildVariantColorCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Breadcrumb.css'

export default function Breadcrumb({
  items,
  separator = 'slash',
  showHomeIcon = false,
  layer = 'layer-0',
  className,
  style,
  carbon,
  ...props
}: AdapterBreadcrumbProps) {
  // Get CSS variables for colors
  // Interactive, read-only, and separator colors are now component-level properties under colors, organized by layer
  const interactiveColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.interactive`)
  const readOnlyColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.read-only`)
  const separatorColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.separator-color`)
  
  // Get component-level CSS variables
  const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
  const iconLabelGapVar = getComponentLevelCssVar('Breadcrumb', 'icon-label-gap')
  const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')
  const iconSizeVar = getComponentLevelCssVar('Breadcrumb', 'icon-size')
  
  // Get home icon
  const HomeIcon = iconNameToReactComponent('house') || iconNameToReactComponent('home')
  
  // Carbon doesn't support custom separators in the same way, so we'll use CSS to style the default separator
  // Carbon uses a slash by default, but we can override it with CSS
  
  const carbonProps = {
    className,
    style: {
      // Set CSS custom properties for CSS file to use
      '--breadcrumb-padding': `var(${paddingVar})`,
      '--breadcrumb-icon-label-gap': `var(${iconLabelGapVar})`,
      '--breadcrumb-item-gap': `var(${itemGapVar})`,
      '--breadcrumb-icon-size': `var(${iconSizeVar})`,
      '--breadcrumb-interactive-color': `var(${interactiveColorVar})`,
      '--breadcrumb-read-only-color': `var(${readOnlyColorVar})`,
      '--breadcrumb-separator-color': `var(${separatorColorVar})`,
      // Also apply padding directly to ensure it's used
      padding: `var(${paddingVar})`,
      ...style,
      ...carbon?.style,
    },
    ...carbon,
    ...props,
  }
  
  return (
    <CarbonBreadcrumb {...carbonProps}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isInteractive = !isLast && item.href
        
        // Determine which color variant to use
        const colorVar = isInteractive ? interactiveColorVar : readOnlyColorVar
        
        // Show home icon only on first item if showHomeIcon is true
        const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon
        
        return (
          <CarbonBreadcrumbItem
            key={index}
            href={isInteractive ? item.href : undefined}
            className="recursica-breadcrumb-item"
            data-variant={isInteractive ? 'interactive' : 'read-only'}
            data-separator={separator}
            style={{
              color: `var(${colorVar})`,
            }}
          >
            {shouldShowHomeIcon && (
              <HomeIcon
                style={{
                  width: `var(${iconSizeVar})`,
                  height: `var(${iconSizeVar})`,
                  marginRight: `var(${iconLabelGapVar})`,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}
              />
            )}
            {item.label}
          </CarbonBreadcrumbItem>
        )
      })}
    </CarbonBreadcrumb>
  )
}

