/**
 * Mantine Breadcrumb Implementation
 * 
 * Mantine-specific Breadcrumb component that uses CSS variables for theming.
 */

import { Breadcrumbs as MantineBreadcrumbs } from '@mantine/core'
import type { BreadcrumbProps as AdapterBreadcrumbProps, BreadcrumbItem } from '../../Breadcrumb'
import { getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { genericLayerText } from '../../../../core/css/cssVarBuilder'
import { readCssVar } from '../../../../core/css/readCssVar'
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

  // The last (non-interactive) item is plain text, not a link. It takes its colour from the
  // active layer's text element and mirrors the interactive items' typography (which comes from
  // the Link component) so the row stays visually consistent.
  // Link typography lives at the component level (properties.text.*), shared across states.
  const layerNum = String(layer).replace('layer-', '')
  const plainTextColorVar = genericLayerText(layerNum, 'color')
  const fontFamilyVar = getComponentTextCssVar('Link', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Link', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Link', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Link', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Link', 'text', 'line-height')
  const textTransformVar = getComponentTextCssVar('Link', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Link', 'text', 'font-style')

  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1
    const isInteractive = !isLast && item.href

    // Show home icon only on first item if showHomeIcon is true
    const shouldShowHomeIcon = showHomeIcon && index === 0 && HomeIcon

    const homeIconEl = shouldShowHomeIcon ? (
      <HomeIcon
        style={{
          width: '1.25em',
          height: '1.25em',
          display: 'inline-block',
          verticalAlign: 'middle',
          marginRight: '8px', // Link handles text spacing differently when it's just a child element rather than startIcon
        }}
      />
    ) : null

    // Non-interactive items (the last crumb, or any item without an href) render as regular
    // text — not a link — so they never pick up link/visited styling like the underline.
    // The typography is applied to an inner span: Mantine's Breadcrumbs clones each child and
    // drops its `style` prop (the interactive Link survives only because it styles its own inner
    // <a>), so styling the outer span here would be lost.
    if (!isInteractive) {
      return (
        <span key={index} className="recursica-breadcrumb-item">
          {homeIconEl}
          <span
            style={{
              color: `var(${plainTextColorVar})`,
              fontFamily: `var(${fontFamilyVar})`,
              fontSize: `var(${fontSizeVar})`,
              fontWeight: `var(${fontWeightVar})`,
              letterSpacing: `var(${letterSpacingVar})`,
              lineHeight: `var(${lineHeightVar})`,
              textTransform: (readCssVar(textTransformVar) || 'none') as any,
              fontStyle: (readCssVar(fontStyleVar) || 'normal') as any,
              textDecoration: 'none',
            }}
          >
            {item.label}
          </span>
        </span>
      )
    }

    // We do not map native anchor tags. Instead we leverage our Link abstraction
    return (
      <Link
        key={index}
        href={item.href}
        layer={layer}
        forceState="default"
        className="recursica-breadcrumb-item"
        style={{
          textDecoration: 'none',
        }}
      >
        {homeIconEl}
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

