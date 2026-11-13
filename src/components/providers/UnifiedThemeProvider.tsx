/**
 * Unified Theme Provider
 * 
 * Wraps the app with the Mantine provider, plus the published adapter's theme provider
 * when that adapter is active.
 */

import { ReactNode, useState, useEffect } from 'react'
import { RecursicaThemeProvider } from '@recursica/adapter-mantine-v8'
import { isLocalAdapter } from '../registry/activeAdapter'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'

// Module-level caches: once a provider resolves, subsequent renders use it synchronously.
// This ensures that pre-warmed imports (e.g. in test beforeAll) take effect immediately
// on mount without waiting for a useEffect cycle.
let _MantineProviderCached: React.ComponentType<{ children: ReactNode }> | null = null

const MantineProvider = ({ children }: { children: ReactNode }) => {
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(
    () => _MantineProviderCached
  )
  const [isLoading, setIsLoading] = useState(!_MantineProviderCached)

  useEffect(() => {
    if (_MantineProviderCached) return
    import('@mantine/core').then(({ MantineProvider: MP }) => {
      _MantineProviderCached = MP
      setProvider(() => MP)
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })
  }, [])

  // In test environment, wait for provider to load before rendering children
  // This prevents "MantineProvider was not found" errors
  if (process.env.NODE_ENV === 'test' && isLoading) {
    return null
  }

  if (!Provider) return <>{children}</>
  return <Provider>{children}</Provider>
}

/**
 * Keeps @recursica/adapter-mantine-v8's theme context in sync with Forge's theme mode.
 *
 * initLayer0 is false on purpose: RecursicaThemeProvider's default is to wrap
 * children in a `<Layer layer={0}>` div, but core/bootstrap.ts already sets
 * data-recursica-layer="0" on <html> alongside data-recursica-theme, so layer-0
 * variables resolve on the root and inherit. Letting it inject its own wrapper
 * would add a display:block div around Mantine's AppShell and disturb the layout.
 */
const RecursicaProvider = ({ children }: { children: ReactNode }) => {
  const { mode } = useThemeMode()
  return (
    <RecursicaThemeProvider theme={mode} initLayer0={false}>
      {children}
    </RecursicaThemeProvider>
  )
}

export function UnifiedThemeProvider({ children }: { children: ReactNode }) {
  // The actual component selection happens at the adapter level
  return (
    <MantineProvider>
      {isLocalAdapter ? children : <RecursicaProvider>{children}</RecursicaProvider>}
    </MantineProvider>
  )
}
