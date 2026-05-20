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
import { buildComponentCssVarPath, getComponentTextCssVar } from '../utils/cssVarNames'

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
    tabContentAlignment,
  }), [activeValue, orientation, variant, layer, kit, tabContentAlignment])

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

  // Calculate CSS variables for Material and Carbon implementations
  const variantStyle = variant || 'default'
  const activeBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'colors', layer, 'background')
  const activeBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'colors', layer, 'border-color')
  const activeTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'colors', layer, 'text-color')
  
  const inactiveBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'colors', layer, 'background')
  const inactiveBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'colors', layer, 'border-color')
  const inactiveTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'colors', layer, 'text-color')

  const borderRadiusVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'border-radius')
  const tabsContentGapVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'variants', 'orientation', orientation, 'properties', 'tabs-content-gap')

  const cssVars = {
    '--recursica_tabs_active_background': activeBackgroundVar ? `var(${activeBackgroundVar})` : undefined,
    '--recursica_tabs_active_border-color': activeBorderColorVar ? `var(${activeBorderColorVar})` : undefined,
    '--recursica_tabs_active_text-color': activeTextColorVar ? `var(${activeTextColorVar})` : undefined,
    '--recursica_tabs_inactive_background': inactiveBackgroundVar ? `var(${inactiveBackgroundVar})` : undefined,
    '--recursica_tabs_inactive_border-color': inactiveBorderColorVar ? `var(${inactiveBorderColorVar})` : undefined,
    '--recursica_tabs_inactive_text-color': inactiveTextColorVar ? `var(${inactiveTextColorVar})` : undefined,
    '--recursica_tabs_border-radius': borderRadiusVar ? `var(${borderRadiusVar})` : undefined,
    '--recursica_tabs_gap': tabsContentGapVar ? `var(${tabsContentGapVar})` : undefined,
    '--recursica_tabs_content_align_flex': tabContentAlignment === 'center' ? 'center' : tabContentAlignment === 'right' ? 'flex-end' : 'flex-start',
  } as React.CSSProperties

  // Under Material or Carbon, we render the provider and a wrapping layout div.
  // The library-specific active component styling is delegated to Tabs.List and Tabs.Tab.
  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={`recursica-tabs ${className || ''}`}
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'row' : 'column',
          gap: 'var(--recursica_tabs_gap, 16px)',
          ...cssVars,
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
          borderColor: 'var(--recursica_tabs_inactive_border-color, divider)',
          '& .MuiTabs-indicator': {
            backgroundColor: 'var(--recursica_tabs_active_border-color, primary.main)',
          },
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
        gap: 'var(--recursica_tabs_gap, 12px)',
        borderBottom: orientation === 'horizontal' ? '1px solid var(--recursica_tabs_inactive_border-color, var(--recursica_brand_palettes_neutral_100_color_border, #e2e8f0))' : 'none',
        borderRight: orientation === 'vertical' ? '1px solid var(--recursica_tabs_inactive_border-color, var(--recursica_brand_palettes_neutral_100_color_border, #e2e8f0))' : 'none',
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

  const { kit, value: activeValue, onChange, variant, tabContentAlignment } = context

  const activeFontFamilyVar = getComponentTextCssVar('Tabs', 'active-text', 'font-family')
  const activeFontSizeVar = getComponentTextCssVar('Tabs', 'active-text', 'font-size')
  const activeFontWeightVar = getComponentTextCssVar('Tabs', 'active-text', 'font-weight')
  const activeLetterSpacingVar = getComponentTextCssVar('Tabs', 'active-text', 'letter-spacing')
  const activeLineHeightVar = getComponentTextCssVar('Tabs', 'active-text', 'line-height')
  const activeTextDecorationVar = getComponentTextCssVar('Tabs', 'active-text', 'text-decoration')
  const activeTextTransformVar = getComponentTextCssVar('Tabs', 'active-text', 'text-transform')
  const activeFontStyleVar = getComponentTextCssVar('Tabs', 'active-text', 'font-style')

  const inactiveFontFamilyVar = getComponentTextCssVar('Tabs', 'inactive-text', 'font-family')
  const inactiveFontSizeVar = getComponentTextCssVar('Tabs', 'inactive-text', 'font-size')
  const inactiveFontWeightVar = getComponentTextCssVar('Tabs', 'inactive-text', 'font-weight')
  const inactiveLetterSpacingVar = getComponentTextCssVar('Tabs', 'inactive-text', 'letter-spacing')
  const inactiveLineHeightVar = getComponentTextCssVar('Tabs', 'inactive-text', 'line-height')
  const inactiveTextDecorationVar = getComponentTextCssVar('Tabs', 'inactive-text', 'text-decoration')
  const inactiveTextTransformVar = getComponentTextCssVar('Tabs', 'inactive-text', 'text-transform')
  const inactiveFontStyleVar = getComponentTextCssVar('Tabs', 'inactive-text', 'font-style')

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
    return (
      <MaterialTab
        value={value}
        disabled={disabled}
        label={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'var(--recursica_tabs_content_align_flex, flex-start)',
            width: '100%',
            gap: '8px' 
          }}>
            {leftSection}
            {children}
            {rightSection}
          </div>
        }
        style={style}
        className={className}
        sx={{
          color: 'var(--recursica_tabs_inactive_text-color)',
          fontFamily: `var(${inactiveFontFamilyVar})`,
          fontSize: `var(${inactiveFontSizeVar})`,
          fontWeight: `var(${inactiveFontWeightVar})`,
          letterSpacing: `var(${inactiveLetterSpacingVar})`,
          lineHeight: `var(${inactiveLineHeightVar})`,
          textDecoration: `var(${inactiveTextDecorationVar})`,
          textTransform: inactiveTextTransformVar ? `var(${inactiveTextTransformVar})` : 'none',
          fontStyle: `var(${inactiveFontStyleVar})`,
          minHeight: 'unset',
          '&.Mui-selected': {
            color: 'var(--recursica_tabs_active_text-color)',
            fontFamily: `var(${activeFontFamilyVar})`,
            fontSize: `var(${activeFontSizeVar})`,
            fontWeight: `var(${activeFontWeightVar})`,
            letterSpacing: `var(${activeLetterSpacingVar})`,
            lineHeight: `var(${activeLineHeightVar})`,
            textDecoration: `var(${activeTextDecorationVar})`,
            textTransform: activeTextTransformVar ? `var(${activeTextTransformVar})` : 'none',
            fontStyle: `var(${activeFontStyleVar})`,
            backgroundColor: variant === 'pills' ? 'var(--recursica_tabs_active_background)' : 'transparent',
          },
          borderRadius: 'var(--recursica_tabs_border-radius, 0px)',
          ...(variant === 'pills' && {
            backgroundColor: 'var(--recursica_tabs_inactive_background)',
            border: '1px solid var(--recursica_tabs_inactive_border-color, transparent)',
            '&.Mui-selected': {
              border: '1px solid var(--recursica_tabs_active_border-color, transparent)',
            }
          })
        }}
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
        justifyContent: 'var(--recursica_tabs_content_align_flex, flex-start)',
        gap: 'var(--recursica_brand_dimensions_general_xs, 8px)',
        padding: 'var(--recursica_brand_dimensions_general_default, 12px)',
        border: 'none',
        borderBottom: variant !== 'pills' && isActive ? '2px solid var(--recursica_tabs_active_border-color)' : 'none',
        borderRadius: 'var(--recursica_tabs_border-radius, 0px)',
        background: isActive
          ? 'var(--recursica_tabs_active_background, var(--recursica_brand_palettes_primary_100_color_tone, #e2e8f0))'
          : 'var(--recursica_tabs_inactive_background, transparent)',
        color: isActive
          ? 'var(--recursica_tabs_active_text-color, var(--recursica_brand_palettes_primary_100_color_on-tone, #1a202c))'
          : 'var(--recursica_tabs_inactive_text-color, var(--recursica_brand_palettes_neutral_100_color_on-tone, #4a5568))',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: isActive ? `var(${activeFontFamilyVar})` : `var(${inactiveFontFamilyVar})`,
        fontSize: isActive ? `var(${activeFontSizeVar})` : `var(${inactiveFontSizeVar})`,
        fontWeight: isActive ? `var(${activeFontWeightVar}, 600)` : `var(${inactiveFontWeightVar}, 400)`,
        letterSpacing: isActive ? `var(${activeLetterSpacingVar})` : `var(${inactiveLetterSpacingVar})`,
        lineHeight: isActive ? `var(${activeLineHeightVar})` : `var(${inactiveLineHeightVar})`,
        textDecoration: isActive ? `var(${activeTextDecorationVar})` : `var(${inactiveTextDecorationVar})`,
        textTransform: isActive ? (activeTextTransformVar ? `var(${activeTextTransformVar})` : 'none') : (inactiveTextTransformVar ? `var(${inactiveTextTransformVar})` : 'none'),
        fontStyle: isActive ? `var(${activeFontStyleVar})` : `var(${inactiveFontStyleVar})`,
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

