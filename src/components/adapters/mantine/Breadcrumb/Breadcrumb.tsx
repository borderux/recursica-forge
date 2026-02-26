/**
 * Mantine Breadcrumb Implementation
 * 
 * Mantine-specific Breadcrumb component that uses CSS variables for theming.
 */

import { Breadcrumbs as MantineBreadcrumbs } from '@mantine/core'
import type { BreadcrumbProps as AdapterBreadcrumbProps, BreadcrumbItem } from '../../Breadcrumb'
import { getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import { Link } from '../../Link'
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

  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1
    const isInteractive = !isLast && item.href

    // Show home icon only on first item if showHomeIcon is true
    const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon

    // We do not map native anchor tags. Instead we leverage our Link abstraction
    return (
      <Link
        key={index}
        href={isInteractive ? item.href : undefined}
        layer={layer}
        forceState={isInteractive ? 'default' : 'visited'} // using visited to simulate default non-interactive color
        className="recursica-breadcrumb-item"
        style={{
          textDecoration: 'none',
        }}
      >
        {shouldShowHomeIcon && (
          <HomeIcon
            style={{
              width: '1.25em',
              height: '1.25em',
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '8px', // Link handles text spacing differently when it's just a child element rather than startIcon
            }}
          />
        )}
        {item.label}
      </Link>
    )
  })

  // Create separator element - spacing is handled by CSS using item-gap
  // The separator inherits its color from the container typography
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

  const mantineProps = {
    className,
    style: {
      // Set CSS custom properties for CSS file to use
      '--breadcrumb-padding': `var(${paddingVar})`,
      '--breadcrumb-item-gap': `var(${itemGapVar})`,
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

