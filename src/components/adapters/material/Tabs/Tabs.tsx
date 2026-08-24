/**
 * Material UI Tabs Implementation
 * 
 * Material UI-specific Tabs component that uses CSS variables for theming.
 */

import React from 'react'
import { Tabs as MaterialTabs } from '@mui/material'
import type { TabsProps as AdapterTabsProps } from '../../common/Tabs'

export default React.forwardRef<any, AdapterTabsProps>(function Tabs({
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
}: AdapterTabsProps, ref) {
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
          gap: 'var(--recursica_brand_dimensions_general_default)',
        },
      }),
      ...style,
      ...material?.sx,
    },
    ...material,
    ...props,
  }
  
  return (
    <MaterialTabs {...materialProps} ref={ref}>
      {children}
    </MaterialTabs>
  )
})

