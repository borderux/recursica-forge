/**
 * Mantine Breadcrumb Implementation
 * 
 * Mantine-specific Breadcrumb component that uses CSS variables for theming.
 */

import { Breadcrumbs as MantineBreadcrumbs, Anchor } from '@mantine/core'
import type { BreadcrumbProps as AdapterBreadcrumbProps, BreadcrumbItem } from '../../Breadcrumb'
import { buildVariantColorCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
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
  // Interactive, read-only, and separator colors are now component-level properties under colors, organized by layer
  const interactiveColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.interactive`)
  const readOnlyColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.read-only`)
  const separatorColorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.separator-color`)
  
  // Get component-level CSS variables
  const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
  const iconLabelGapVar = getComponentLevelCssVar('Breadcrumb', 'icon-label-gap')
  const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')
  const iconSizeVar = getComponentLevelCssVar('Breadcrumb', 'icon-size')
  
  // Get text CSS variables
  const fontFamilyVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Breadcrumb', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Breadcrumb', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Breadcrumb', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Breadcrumb', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-style')
  
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
      '--breadcrumb-font-family': `var(${fontFamilyVar})`,
      '--breadcrumb-font-size': `var(${fontSizeVar})`,
      '--breadcrumb-font-weight': `var(${fontWeightVar})`,
      '--breadcrumb-letter-spacing': `var(${letterSpacingVar})`,
      '--breadcrumb-line-height': `var(${lineHeightVar})`,
      '--breadcrumb-text-decoration': `var(${textDecorationVar})`,
      '--breadcrumb-text-transform': `var(${textTransformVar})`,
      '--breadcrumb-font-style': `var(${fontStyleVar})`,
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

