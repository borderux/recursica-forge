/**
 * Material UI Breadcrumb Implementation
 * 
 * Material UI-specific Breadcrumb component that uses CSS variables for theming.
 */

import { Breadcrumbs as MuiBreadcrumbs } from '@mui/material'
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
  material,
  ...props
}: AdapterBreadcrumbProps) {
  // Get component-level CSS variables
  const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
  const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')

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

    // Show home icon only on first item if showHomeIcon is true
    const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon

    return (
      <Link
        key={index}
        href={isInteractive ? item.href : undefined}
        layer={layer}
        forceState={isInteractive ? 'default' : 'visited'}
        underline={isInteractive ? 'hover' : 'none'}
        className="recursica-breadcrumb-item"
        inlineStyle={{
          display: 'inline-flex',
          alignItems: 'center',
        }}
        startIcon={
          shouldShowHomeIcon ? (
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
    )
  })

  // Create separator element - spacing is handled by CSS using item-gap
  const separatorElement = SeparatorIcon ? (
    <SeparatorIcon
      style={{
        width: '1em',
        height: '1em',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    />
  ) : (
    <span style={{ fontSize: '1em' }}>/</span>
  )

  const muiProps = {
    className,
    style: {
      '--breadcrumb-padding': `var(${paddingVar})`,
      '--breadcrumb-item-gap': `var(${itemGapVar})`,
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

