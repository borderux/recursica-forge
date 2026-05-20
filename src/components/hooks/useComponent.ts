/**
 * useComponent Hook
 * 
 * Returns the appropriate component implementation based on the current UI kit.
 */

import React, { useMemo } from 'react'
import { useUiKit } from '../../modules/uikit/UiKitContext'
import { getComponent } from '../registry'
import type { ComponentName } from '../registry/types'

export function useComponent<T = any>(componentName: ComponentName): React.ComponentType<T> | null {
  const { kit } = useUiKit()
  
  return useMemo(() => {
    const Component = getComponent(kit, componentName)
    if (!Component) return null
    
    // Return a wrapper that strips out other library props before passing to the adapter
    // This allows inner adapters to omit `mantine`, `material`, `carbon` from their destructuring
    const Wrapper = (props: any) => {
      const { mantine, material, carbon, ...rest } = props
      
      const activeProps: any = {}
      if (kit === 'mantine' && mantine !== undefined) activeProps.mantine = mantine
      if (kit === 'material' && material !== undefined) activeProps.material = material
      if (kit === 'carbon' && carbon !== undefined) activeProps.carbon = carbon
      
      return React.createElement(Component as any, { ...rest, ...activeProps })
    }
    
    // Copy over any static properties (like Tabs.List, Tabs.Tab, Tabs.Panel)
    Object.assign(Wrapper, Component)
    
    return Wrapper as unknown as React.ComponentType<T>
  }, [kit, componentName])
}

