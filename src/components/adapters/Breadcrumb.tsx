/**
 * Breadcrumb Component Adapter
 * 
 * Unified Breadcrumb component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  separator?: 'slash' | 'chevron' | 'arrow'
  showHomeIcon?: boolean
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Breadcrumb({
  items,
  separator = 'slash',
  showHomeIcon = false,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: BreadcrumbProps) {
  const Component = useComponent('Breadcrumb')
  
  // Limit to 5 items maximum
  const limitedItems = items.slice(0, 5)
  
  if (!Component) {
    // Fallback to native HTML if component not available
    return (
      <nav aria-label="Breadcrumb" className={className} style={style}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
          {limitedItems.map((item, index) => {
            const isLast = index === limitedItems.length - 1
            const isInteractive = !isLast && item.href
            
            return (
              <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {index > 0 && <span>/</span>}
                {isInteractive ? (
                  <a href={item.href} style={{ textDecoration: 'none' }}>
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
  
  // Map unified props to library-specific props
  const libraryProps = {
    items: limitedItems,
    separator,
    showHomeIcon,
    layer,
    className,
    style,
    mantine,
    material,
    carbon,
  }
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...libraryProps} />
    </Suspense>
  )
}

