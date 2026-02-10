/**
 * Tabs Component Adapter
 * 
 * Unified Tabs component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, ReactNode } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LibrarySpecificProps } from '../registry/types'

export type TabsProps = {
  value?: string
  defaultValue?: string
  onChange?: (value: string | null) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'outline'
  layer?: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  layer,
  children,
  className,
  style,
  mantine,
  material,
  carbon,
}: TabsProps) {
  const Component = useComponent('Tabs')

  if (!Component) {
    // Fallback to simple div if component not available
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  const libraryProps = {
    value,
    defaultValue,
    onChange,
    orientation,
    variant,
    layer,
    className,
    style,
    mantine,
    material,
    carbon,
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}
