/**
 * Carbon Breadcrumb Implementation
 * 
 * Carbon Design System-specific Breadcrumb component that uses CSS variables for theming.
 */

import React from 'react'
import type { BreadcrumbProps as AdapterBreadcrumbProps, BreadcrumbItem } from '../../Breadcrumb'
import { getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import { Link } from '../../Link'
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
  // Get component-level CSS variables
  const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
  const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')

  // Get home icon
  const HomeIcon = iconNameToReactComponent('house') || iconNameToReactComponent('home')

  // Use fallback implementation to avoid CarbonBreadcrumbItem undefined props issue
  // CarbonBreadcrumb internally calls BreadcrumbItem with undefined props, causing crashes

  // Build style object with CSS variables for theming
  const navStyle: React.CSSProperties = {
    // Set CSS custom properties for CSS file to use
    '--breadcrumb-padding': `var(${paddingVar})`,
    '--breadcrumb-item-gap': `var(${itemGapVar})`,
    padding: `var(${paddingVar})`,
    ...style,
    ...(carbon && typeof carbon === 'object' && carbon.style ? carbon.style : {}),
  } as React.CSSProperties;

  return (
    <nav aria-label="Breadcrumb" className={className} style={navStyle}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isInteractive = !isLast && item.href;

          // Show home icon only on first item if showHomeIcon is true
          const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon;

          return (
            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {index > 0 && (
                <span>
                  {separator === 'chevron' ? '›' : separator === 'arrow' ? '→' : '/'}
                </span>
              )}
              <Link
                href={isInteractive ? item.href : undefined}
                layer={layer}
                forceState={isInteractive ? 'default' : 'visited'}
                className="recursica-breadcrumb-item"
                inlineStyle={{
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                startIcon={
                  shouldShowHomeIcon && HomeIcon ? (
                    <HomeIcon
                      style={{
                        width: '1.25em',
                        height: '1.25em',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                    />
                  ) : undefined
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

