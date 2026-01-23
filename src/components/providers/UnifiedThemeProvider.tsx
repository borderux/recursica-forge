/**
 * Unified Theme Provider
 * 
 * Wraps the app with the appropriate library provider based on the current UI kit.
 * Ensures all library providers are available for component rendering.
 */

import { ReactNode, useState, useEffect } from 'react'

// Lazy load providers
const MantineProvider = ({ children }: { children: ReactNode }) => {
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    import('@mantine/core').then(({ MantineProvider: MP }) => {
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
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    Promise.all([
      import('@mui/material/styles'),
      import('@mui/material'),
    ]).then(([{ ThemeProvider, createTheme }, { CssBaseline }]) => {
      const theme = createTheme()
      setProvider(() => ({ children: ch }: { children: ReactNode }) => (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {ch}
        </ThemeProvider>
      ))
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
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    import('@carbon/react').then(({ Theme }) => {
      setProvider(() => ({ children: ch }: { children: ReactNode }) => (
        <Theme theme="g10">
          {ch}
        </Theme>
      ))
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

