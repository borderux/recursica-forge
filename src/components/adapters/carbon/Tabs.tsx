/**
 * Carbon Tabs Implementation
 * 
 * Carbon doesn't have a native Tabs component, so we'll use a simple div-based implementation
 * that matches Carbon's styling patterns.
 */

import type { TabsProps as AdapterTabsProps } from '../Tabs'

export default function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  children,
  className,
  style,
  carbon,
  ...props
}: AdapterTabsProps) {
  // Carbon doesn't have a Tabs component, so we'll render children directly
  // The actual tab functionality will be handled by the parent component
  return (
    <div
      className={className}
      style={{
        display: orientation === 'vertical' ? 'flex' : 'block',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        ...style,
        ...carbon?.style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

