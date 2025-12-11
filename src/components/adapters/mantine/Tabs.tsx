/**
 * Mantine Tabs Implementation
 * 
 * Mantine-specific Tabs component that uses CSS variables for theming.
 */

import { Tabs as MantineTabs } from '@mantine/core'
import type { TabsProps as AdapterTabsProps } from '../Tabs'

export default function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  children,
  className,
  style,
  mantine,
  ...props
}: AdapterTabsProps) {
  const mantineProps = {
    value,
    defaultValue,
    onChange,
    orientation,
    variant: variant === 'pills' ? 'pills' : 'default',
    className,
    style: {
      ...style,
      ...mantine?.style,
    },
    ...mantine,
    ...props,
  }
  
  return (
    <MantineTabs {...mantineProps}>
      {children}
    </MantineTabs>
  )
}

