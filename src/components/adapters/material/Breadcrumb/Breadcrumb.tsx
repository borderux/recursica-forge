/**
 * Material UI Breadcrumb Implementation
 * 
 * Material UI-specific Breadcrumb component that uses CSS variables for theming.
 */

import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material'
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
  material,
  ...props
}: AdapterBreadcrumbProps) {
  // Get CSS variables for colors
  // Interactive, read-only, and separator colors are now component-level properties under colors, organized by layer
  const interactiveColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.interactive.color`)
  const readOnlyColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.read-only.color`)
  const separatorColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.separator-color`)
  
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
  
  // Transform items to Material UI format
  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1
    const isInteractive = !isLast && item.href
    
    // Determine which color variant to use
    const colorVar = isInteractive ? interactiveColorVar : readOnlyColorVar
    
    // Show home icon only on first item if showHomeIcon is true
    const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon
    
    const itemContent = (
      <>
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
      </>
    )
    
    if (isLast || !item.href) {
      // Last item or item without href - render as Typography
      return (
        <Typography
          key={index}
          className="recursica-breadcrumb-item"
          data-variant={isInteractive ? 'interactive' : 'read-only'}
          style={{
            color: `var(${colorVar})`,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {itemContent}
        </Typography>
      )
    }
    
    // Interactive item - render as Link
    return (
      <Link
        key={index}
        href={item.href}
        className="recursica-breadcrumb-item"
        data-variant="interactive"
        underline="hover"
        style={{
          color: `var(${colorVar})`,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {itemContent}
      </Link>
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
  
  const muiProps = {
    className,
    style: {
      '--breadcrumb-padding': `var(${paddingVar})`,
      '--breadcrumb-icon-label-gap': `var(${iconLabelGapVar})`,
      '--breadcrumb-item-gap': `var(${itemGapVar})`,
      '--breadcrumb-icon-size': `var(${iconSizeVar})`,
      '--breadcrumb-interactive-color': `var(${interactiveColorVar})`,
      '--breadcrumb-read-only-color': `var(${readOnlyColorVar})`,
      '--breadcrumb-separator-color': `var(${separatorColorVar})`,
      padding: `var(${paddingVar})`,
      ...style,
      ...material?.style,
    },
    separator: separatorElement,
    ...material,
    ...props,
  }
  
  return (
    <MuiBreadcrumbs {...muiProps}>
      {breadcrumbItems}
    </MuiBreadcrumbs>
  )
}

