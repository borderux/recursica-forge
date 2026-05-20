/**
 * Tabs Component Adapter
 * 
 * Unified Tabs component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Supports unified subcomponents: Tabs.List, Tabs.Tab, and Tabs.Panel.
 */

import { Suspense, ReactNode, createContext, useContext, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { useUiKit } from '../../modules/uikit/UiKitContext'
import type { LibrarySpecificProps } from '../registry/types'
import { Tabs as MantineTabs } from '@mantine/core'
import { Tabs as MaterialTabs, Tab as MaterialTab } from '@mui/material'

export type TabsProps = {
  value?: string
  defaultValue?: string
  onChange?: (value: string | null) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'outline'
  tabContentAlignment?: 'left' | 'center' | 'right'
  layer?: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

interface TabsContextValue {
  value?: string
  onChange?: (value: string | null) => void
  orientation: 'horizontal' | 'vertical'
  variant: 'default' | 'pills' | 'outline'
  layer?: string
  kit: 'mantine' | 'material' | 'carbon'
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  tabContentAlignment = 'left',
  layer,
  children,
  className,
  style,
  mantine,
  material,
  carbon,
}: TabsProps) {
  const { kit } = useUiKit()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeValue = value !== undefined ? value : internalValue

  const handleTabChange = (val: string | null) => {
    if (value === undefined) {
      setInternalValue(val ?? undefined)
    }
    if (onChange) {
      onChange(val)
    }
  }

  const contextValue = useMemo(() => ({
    value: activeValue,
    onChange: handleTabChange,
    orientation,
    variant,
    layer,
    kit,
  }), [activeValue, orientation, variant, layer, kit])

  if (kit === 'mantine') {
    const Component = useComponent('Tabs')

    if (!Component) {
      return (
        <TabsContext.Provider value={contextValue}>
          <div className={className} style={style}>
            {children}
          </div>
        </TabsContext.Provider>
      )
    }

    const libraryProps = {
      value: activeValue,
      onChange: handleTabChange,
      orientation,
      variant,
      tabContentAlignment,
      layer,
      className,
      style,
      mantine,
      material,
      carbon,
    }

    return (
      <TabsContext.Provider value={contextValue}>
        <Suspense fallback={<span />}>
          <Component {...libraryProps}>{children}</Component>
        </Suspense>
      </TabsContext.Provider>
    )
  }

  // Under Material or Carbon, we render the provider and a wrapping layout div.
  // The library-specific active component styling is delegated to Tabs.List and Tabs.Tab.
  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={`recursica-tabs ${className || ''}`}
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'row' : 'column',
          gap: 'var(--recursica_brand_dimensions_general_default, 16px)',
          ...style,
        }}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// ---------------- Tabs.List Adapter ----------------

export type TabsListProps = {
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export function TabsList({ children, style, className }: TabsListProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs.List must be used within a Tabs parent component')
  }

  const { kit, orientation, variant } = context

  if (kit === 'mantine') {
    return (
      <MantineTabs.List style={style} className={className}>
        {children}
      </MantineTabs.List>
    )
  }

  if (kit === 'material') {
    const handleMuiChange = (_e: any, newValue: any) => {
      if (context.onChange) {
        context.onChange(newValue)
      }
    }

    return (
      <MaterialTabs
        value={context.value}
        onChange={handleMuiChange}
        orientation={orientation}
        variant={variant === 'pills' ? 'scrollable' : 'standard'}
        className={className}
        sx={{
          borderRight: orientation === 'vertical' ? 1 : 0,
          borderBottom: orientation === 'horizontal' ? 1 : 0,
          borderColor: 'divider',
          ...(variant === 'pills' && {
            '& .MuiTabs-indicator': {
              display: 'none',
            },
            '& .MuiTabs-flexContainer': {
              gap: 'var(--recursica_brand_dimensions_general_default)',
            },
          }),
          ...style,
        }}
      >
        {children}
      </MaterialTabs>
    )
  }

  // Carbon or fallback (Flexbox buttons container)
  return (
    <div
      className={`recursica-tabs-list ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: 'var(--recursica_brand_dimensions_general_default, 12px)',
        borderBottom: orientation === 'horizontal' ? '1px solid var(--recursica_brand_palettes_neutral_100_color_border, #e2e8f0)' : 'none',
        borderRight: orientation === 'vertical' ? '1px solid var(--recursica_brand_palettes_neutral_100_color_border, #e2e8f0)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ---------------- Tabs.Tab Adapter ----------------

export type TabsTabProps = {
  value: string
  children: ReactNode
  leftSection?: ReactNode
  rightSection?: ReactNode
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

export function TabsTab({
  value,
  children,
  leftSection,
  rightSection,
  disabled,
  style,
  className,
  ...props
}: TabsTabProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs.Tab must be used within a Tabs parent component')
  }

  const { kit, value: activeValue, onChange } = context
  const isActive = activeValue === value

  if (kit === 'mantine') {
    return (
      <MantineTabs.Tab
        value={value}
        leftSection={leftSection}
        rightSection={rightSection}
        disabled={disabled}
        style={style}
        className={className}
      >
        {children}
      </MantineTabs.Tab>
    )
  }

  if (kit === 'material') {
    // Under MUI, MUI's Tabs clones Tab and injects value, selected, onChange directly.
    // Forwarding props via {...props} lets these values cascade cleanly down to MaterialTab.
    return (
      <MaterialTab
        value={value}
        disabled={disabled}
        label={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {leftSection}
            {children}
            {rightSection}
          </div>
        }
        style={style}
        className={className}
        {...props}
      />
    )
  }

  // Carbon or fallback (Carbon style buttons)
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(value)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`recursica-tabs-tab ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--recursica_brand_dimensions_general_xs, 8px)',
        padding: 'var(--recursica_brand_dimensions_general_default, 12px)',
        border: 'none',
        background: isActive
          ? 'var(--recursica_brand_palettes_primary_100_color_tone, #e2e8f0)'
          : 'transparent',
        color: isActive
          ? 'var(--recursica_brand_palettes_primary_100_color_on-tone, #1a202c)'
          : 'var(--recursica_brand_palettes_neutral_100_color_on-tone, #4a5568)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontWeight: isActive ? 600 : 400,
        ...style,
      }}
    >
      {leftSection}
      {children}
      {rightSection}
    </button>
  )
}

// ---------------- Tabs.Panel Adapter ----------------

export type TabsPanelProps = {
  value: string
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export function TabsPanel({ value, children, style, className }: TabsPanelProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs.Panel must be used within a Tabs parent component')
  }

  const { kit, value: activeValue } = context
  const isActive = activeValue === value

  if (kit === 'mantine') {
    return (
      <MantineTabs.Panel value={value} style={style} className={className}>
        {children}
      </MantineTabs.Panel>
    )
  }

  if (!isActive) return null

  return (
    <div
      className={`recursica-tabs-panel ${className || ''}`}
      style={{
        flex: 1,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Attach subcomponents to main namespace
Tabs.List = TabsList
Tabs.Tab = TabsTab
Tabs.Panel = TabsPanel
