/**
 * Carbon Breadcrumb Implementation
 * 
 * Carbon Design System-specific Breadcrumb component that uses CSS variables for theming.
 */

import React from 'react'
// NOTE: CarbonBreadcrumb and BreadcrumbItem imports removed - using fallback implementation
// CarbonBreadcrumb internally calls BreadcrumbItem with undefined props, causing crashes
import type { BreadcrumbProps as AdapterBreadcrumbProps, BreadcrumbItem } from '../../Breadcrumb'
import { buildVariantColorCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
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
  
  // Get text CSS variables
  const fontFamilyVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Breadcrumb', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Breadcrumb', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Breadcrumb', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Breadcrumb', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Breadcrumb', 'text', 'font-style')
  
  // Get home icon
  const HomeIcon = iconNameToReactComponent('house') || iconNameToReactComponent('home')
  
  // Use fallback implementation to avoid CarbonBreadcrumbItem undefined props issue
  // CarbonBreadcrumb internally calls BreadcrumbItem with undefined props, causing crashes
  // TODO: Fix CarbonBreadcrumb integration once Carbon fixes their internal prop handling
  
  // Build style object with CSS variables for theming
  const navStyle = {
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
    padding: `var(${paddingVar})`,
    ...style,
    ...(carbon && typeof carbon === 'object' && carbon.style ? carbon.style : {}),
  };
  
  return (
    <nav aria-label="Breadcrumb" className={className} style={navStyle}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isInteractive = !isLast && item.href;
          
          // Determine which color variant to use
          const colorVar = isInteractive ? interactiveColorVar : readOnlyColorVar;
          
          // Show home icon only on first item if showHomeIcon is true
          const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon;
          
          return (
            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {index > 0 && (
                <span style={{ color: `var(${separatorColorVar})` }}>
                  {separator === 'chevron' ? '›' : separator === 'arrow' ? '→' : '/'}
                </span>
              )}
              {isInteractive ? (
                <a 
                  href={item.href} 
                  className="recursica-breadcrumb-item"
                  style={{
                    color: `var(${colorVar})`,
                    fontFamily: `var(${fontFamilyVar})`,
                    fontSize: `var(${fontSizeVar})`,
                    fontWeight: `var(${fontWeightVar})`,
                    letterSpacing: `var(${letterSpacingVar})`,
                    lineHeight: `var(${lineHeightVar})`,
                    textDecoration: `var(${textDecorationVar})`,
                    textTransform: `var(${textTransformVar})` as React.CSSProperties['textTransform'],
                    fontStyle: `var(${fontStyleVar})`,
                  }}
                >
                  {shouldShowHomeIcon && HomeIcon && (
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
                </a>
              ) : (
                <span 
                  className="recursica-breadcrumb-item"
                  style={{
                    color: `var(${colorVar})`,
                    fontFamily: `var(${fontFamilyVar})`,
                    fontSize: `var(${fontSizeVar})`,
                    fontWeight: `var(${fontWeightVar})`,
                    letterSpacing: `var(${letterSpacingVar})`,
                    lineHeight: `var(${lineHeightVar})`,
                    textDecoration: `var(${textDecorationVar})`,
                    textTransform: `var(${textTransformVar})` as React.CSSProperties['textTransform'],
                    fontStyle: `var(${fontStyleVar})`,
                  }}
                >
                  {shouldShowHomeIcon && HomeIcon && (
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
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
  
  // DISABLED: CarbonBreadcrumb implementation - causes undefined props errors
  // CarbonBreadcrumb internally calls BreadcrumbItem with undefined props during reconciliation
  // The fallback implementation above avoids this issue by not using Carbon components
}

