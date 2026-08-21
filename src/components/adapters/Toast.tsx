/**
 * Toast Component Adapter
 *
 * Unified Toast component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import React, { Suspense, useState, useEffect, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import { parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ToastProps } from './common/Toast'

// Re-exported so existing `import type { ToastProps } from '.../adapters/Toast'`
// call sites keep working — the types now live in common/Toast.ts.
export type { ToastProps } from './common/Toast'

export function Toast({
  children,
  variant = 'default',
  layer = 'layer-0',
  elevation,
  className,
  style,
  icon,
  onClose,
  action,
  mantine,
  material,
  carbon,
}: ToastProps) {
  const Component = useComponent('Toast')
  const { mode } = useThemeMode()

  const elevationVar = useMemo(() => {
    return buildComponentCssVarPath('Toast', 'properties', 'elevation', layer, mode)
  }, [layer, mode])

  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })

  useEffect(() => {
    const value = readCssVar(elevationVar)
    setElevationFromVar(value ? parseElevationValue(value) : undefined)
  }, [elevationVar, mode])

  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
    })
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar, mode])

  const componentElevation = elevation ?? elevationFromVar ?? undefined

  const libraryProps = mapToastProps({
    variant,
    layer,
    elevation: componentElevation,
    className,
    style,
    icon,
    onClose,
    action,
    mantine,
    material,
    carbon,
  })

  const C = Component as React.ComponentType<any>

  return (
    <Suspense fallback={<span />}>
      <C {...libraryProps}>{children}</C>
    </Suspense>
  )
}

function mapToastProps(props: ToastProps & { elevation?: string }): any {
  const { mantine, material, carbon, ...rest } = props
  return {
    ...rest,
    ...(mantine && { mantine }),
    ...(material && { material }),
    ...(carbon && { carbon }),
  }
}
