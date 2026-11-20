/**
 * Unified Theme Provider
 * 
 * Wraps the app with the Mantine provider, plus the published adapter's theme provider
 * when that adapter is active.
 */

import { ReactNode, useState, useEffect, useMemo } from 'react'
import { RecursicaThemeProvider } from '@recursica/adapter-mantine-v8'
import { isLocalAdapter } from '../registry/activeAdapter'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { useOptionalVars } from '../../modules/vars/VarsContext'
import { exportManifestJson } from '../../core/export/manifestExport'

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
 *
 * manifest is the same recursica_manifest.json Forge exports, built live from the current
 * JSON so edits reach components that read it (Pagination throws without it).
 */
const RecursicaProvider = ({ children }: { children: ReactNode }) => {
  const { mode } = useThemeMode()
  const vars = useOptionalVars()
  const tokens = vars?.tokens
  const brand = vars?.theme
  const uikit = vars?.uikit
  const manifest = useMemo(() => {
    if (!tokens || !brand || !uikit) return undefined
    try {
      return exportManifestJson(tokens, brand, uikit) as Record<string, unknown>
    } catch (error) {
      console.error('[UnifiedThemeProvider] Could not build the live manifest:', error)
      return undefined
    }
  }, [tokens, brand, uikit])
  return (
    <RecursicaThemeProvider theme={mode} initLayer0={false} manifest={manifest}>
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
