/**
 * Mantine Breadcrumb Implementation
 * 
 * Mantine-specific Breadcrumb component that uses CSS variables for theming.
 */

import { Breadcrumbs as MantineBreadcrumbs, Anchor } from '@mantine/core'
import type { BreadcrumbProps as AdapterBreadcrumbProps, BreadcrumbItem } from '../../Breadcrumb'
import { buildVariantColorCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Breadcrumb.css'

export default function Breadcrumb({
  items,
  separator = 'slash',
  showHomeIcon = false,
  layer = 'layer-0',
  className,
  style,
  mantine,
  ...props
}: AdapterBreadcrumbProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables for colors
  // Use buildVariantColorCssVar for style variant color properties
  const interactiveColorVar = buildVariantColorCssVar('Breadcrumb', 'interactive', 'color', layer)
  // Read-only color is now component-level, not variant-specific
  const readOnlyColorVar = getComponentLevelCssVar('Breadcrumb', 'colors.read-only-color')
  const separatorColorVar = getComponentLevelCssVar('Breadcrumb', 'colors.separator-color')
  
  // Get component-level CSS variables
  const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
  const iconLabelGapVar = getComponentLevelCssVar('Breadcrumb', 'icon-label-gap')
  const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')
  const iconSizeVar = getComponentLevelCssVar('Breadcrumb', 'icon')
  
  // Get separator icon component
  const separatorIconMap: Record<string, string> = {
    slash: 'slash',
    chevron: 'chevron-right',
    arrow: 'arrow-right',
  }
  const separatorIconName = separatorIconMap[separator] || 'slash'
  const SeparatorIcon = iconNameToReactComponent(separatorIconName)
  
  // Get home icon
  const HomeIcon = iconNameToReactComponent('house') || iconNameToReactComponent('home')
  
  // Transform items to Mantine format
  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1
    const isInteractive = !isLast && item.href
    
    // Determine which color variant to use
    const colorVar = isInteractive ? interactiveColorVar : readOnlyColorVar
    
    // Show home icon only on first item if showHomeIcon is true
    const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon
    
    if (isLast || !item.href) {
      // Last item or item without href - render as span
      return (
        <span
          key={index}
          className="recursica-breadcrumb-item"
          data-variant={isInteractive ? 'interactive' : 'read-only'}
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
        </span>
      )
    }
    
    // Interactive item - render as anchor
    return (
      <Anchor
        key={index}
        href={item.href}
        className="recursica-breadcrumb-item"
        data-variant="interactive"
        style={{
          color: `var(${colorVar})`,
          textDecoration: 'none',
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
      </Anchor>
    )
  })
  
  // Create separator element - spacing is handled by CSS using item-gap
  const separatorElement = SeparatorIcon ? (
    <SeparatorIcon
      style={{
        width: `var(${iconSizeVar})`,
        height: `var(${iconSizeVar})`,
        display: 'inline-block',
        verticalAlign: 'middle',
        color: `var(${separatorColorVar})`,
      }}
    />
  ) : (
    <span style={{ fontSize: `var(${iconSizeVar})`, color: `var(${separatorColorVar})` }}>/</span>
  )
  
  const mantineProps = {
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
      ...mantine?.style,
    },
    separator: separatorElement,
    ...mantine,
    ...props,
  }
  
  return (
    <MantineBreadcrumbs {...mantineProps}>
      {breadcrumbItems}
    </MantineBreadcrumbs>
  )
}

