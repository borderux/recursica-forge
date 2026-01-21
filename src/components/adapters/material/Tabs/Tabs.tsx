/**
 * Material UI Tabs Implementation
 * 
 * Material UI-specific Tabs component that uses CSS variables for theming.
 */

import { Tabs as MaterialTabs } from '@mui/material'
import type { TabsProps as AdapterTabsProps } from '../../Tabs'

export default function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  children,
  className,
  style,
  material,
  ...props
}: AdapterTabsProps) {
  const materialProps = {
    value: value || defaultValue,
    onChange: (_e: React.SyntheticEvent, newValue: string) => {
      if (onChange) onChange(newValue)
    },
    orientation,
    variant: (variant === 'pills' ? 'scrollable' : 'standard') as 'scrollable' | 'standard',
    className,
    sx: {
      ...(variant === 'pills' && {
        '& .MuiTabs-indicator': {
          display: 'none',
        },
        '& .MuiTabs-flexContainer': {
          gap: 'var(--recursica-brand-dimensions-general-default)',
        },
      }),
      ...style,
      ...material?.sx,
    },
    ...material,
    ...props,
  }
  
  return (
    <MaterialTabs {...materialProps}>
      {children}
    </MaterialTabs>
  )
}

