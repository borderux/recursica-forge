/**
 * Tabs Component Adapter
 * 
 * Unified Tabs component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Supports unified subcomponents: Tabs.List, Tabs.Tab, and Tabs.Panel.
 */

import { Suspense, ReactNode, createContext, useContext, useState, useMemo } from 'react'
import { useComponent } from '../../../hooks/useComponent'
import { useUiKit, type UiKit } from '../../../../modules/uikit/UiKitContext'
import type { LibrarySpecificProps } from '../../../registry/types'
import { Tabs as MantineTabs } from '@mantine/core'

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
  kit: UiKit
  tabContentAlignment?: 'left' | 'center' | 'right'
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  tabContentAlignment = 'left',
  layer = 'layer-0',
  children,
  className,
  style,
  mantine,
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
    tabContentAlignment,
  }), [activeValue, orientation, variant, layer, kit, tabContentAlignment])

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
  }

  return (
    <TabsContext.Provider value={contextValue}>
      <Suspense fallback={<span />}>
        <Component {...libraryProps}>{children}</Component>
      </Suspense>
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

  return (
    <MantineTabs.List style={style} className={className}>
      {children}
    </MantineTabs.List>
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
}: TabsTabProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs.Tab must be used within a Tabs parent component')
  }

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

  return (
    <MantineTabs.Panel value={value} style={style} className={className}>
      {children}
    </MantineTabs.Panel>
  )
}

// Attach subcomponents to main namespace
Tabs.List = TabsList
Tabs.Tab = TabsTab
Tabs.Panel = TabsPanel

