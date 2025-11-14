/**
 * useComponent Hook
 * 
 * Returns the appropriate component implementation based on the current UI kit.
 */

import { useMemo } from 'react'
import { useUiKit } from '../../modules/uikit/UiKitContext'
import { getComponent } from '../registry'
import type { ComponentName } from '../registry/types'

export function useComponent<T = any>(componentName: ComponentName): React.ComponentType<T> | null {
  const { kit } = useUiKit()
  
  return useMemo(() => {
    return getComponent(kit, componentName)
  }, [kit, componentName])
}

