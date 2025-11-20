/**
 * Material UI Tabs Implementation
 * 
 * Material UI-specific Tabs component that uses CSS variables for theming.
 */

import { Tabs as MaterialTabs, Tab } from '@mui/material'
import type { TabsProps as AdapterTabsProps } from '../Tabs'
import { useThemeMode } from '../../../modules/theme/ThemeModeContext'

export default function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  children,
  className,
  style,
  material,
  ...props
}: AdapterTabsProps) {
  const { mode } = useThemeMode()
  
  const materialProps = {
    value: value || defaultValue,
    onChange: (e: React.SyntheticEvent, newValue: string) => {
      if (onChange) onChange(newValue)
    },
    orientation,
    className,
    sx: {
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

