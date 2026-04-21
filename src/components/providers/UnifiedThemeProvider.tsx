/**
 * Unified Theme Provider
 * 
 * Wraps the app with the appropriate library provider based on the current UI kit.
 * Ensures all library providers are available for component rendering.
 */

import { ReactNode, useState, useEffect } from 'react'

// Module-level caches: once a provider resolves, subsequent renders use it synchronously.
// This ensures that pre-warmed imports (e.g. in test beforeAll) take effect immediately
// on mount without waiting for a useEffect cycle.
let _MantineProviderCached: React.ComponentType<{ children: ReactNode }> | null = null
let _MaterialProviderCached: React.ComponentType<{ children: ReactNode }> | null = null
let _CarbonProviderCached: React.ComponentType<{ children: ReactNode }> | null = null

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

const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(
    () => _MaterialProviderCached
  )
  const [isLoading, setIsLoading] = useState(!_MaterialProviderCached)

  useEffect(() => {
    if (_MaterialProviderCached) return
    Promise.all([
      import('@mui/material/styles'),
      import('@mui/material'),
    ]).then(([{ ThemeProvider, createTheme }, { CssBaseline }]) => {
      const theme = createTheme()
      const Comp = ({ children: ch }: { children: ReactNode }) => (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {ch}
        </ThemeProvider>
      )
      _MaterialProviderCached = Comp
      setProvider(() => Comp)
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })
  }, [])

  // In test environment, wait for provider to load before rendering children
  if (process.env.NODE_ENV === 'test' && isLoading) {
    return null
  }

  if (!Provider) return <>{children}</>
  return <Provider>{children}</Provider>
}

const CarbonProvider = ({ children }: { children: ReactNode }) => {
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(
    () => _CarbonProviderCached
  )
  const [isLoading, setIsLoading] = useState(!_CarbonProviderCached)

  useEffect(() => {
    if (_CarbonProviderCached) return
    import('@carbon/react').then(({ Theme }) => {
      const Comp = ({ children: ch }: { children: ReactNode }) => (
        <Theme theme="g10">
          {ch}
        </Theme>
      )
      _CarbonProviderCached = Comp
      setProvider(() => Comp)
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })
  }, [])

  // In test environment, wait for provider to load before rendering children
  if (process.env.NODE_ENV === 'test' && isLoading) {
    return null
  }

  if (!Provider) return <>{children}</>
  return <Provider>{children}</Provider>
}

export function UnifiedThemeProvider({ children }: { children: ReactNode }) {
  // Wrap with all providers to ensure components can render regardless of kit
  // The actual component selection happens at the adapter level
  return (
    <MantineProvider>
      <MaterialProvider>
        <CarbonProvider>
          {children}
        </CarbonProvider>
      </MaterialProvider>
    </MantineProvider>
  )
}
