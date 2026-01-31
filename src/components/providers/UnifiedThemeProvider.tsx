/**
 * Unified Theme Provider
 * 
 * Wraps the app with the appropriate library provider based on the current UI kit.
 * Ensures all library providers are available for component rendering.
 */

import { ReactNode, useState, useEffect } from 'react'

// Lazy load providers with synchronous check for preloaded modules
const MantineProvider = ({ children }: { children: ReactNode }) => {
  // Try to load provider immediately if module is already cached (from global setup)
  // This makes provider loading instant in tests where modules are preloaded
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(() => {
    // In test environment, try to use preloaded module if available
    // Modules preloaded in global setup will be in Node's module cache
    if (process.env.NODE_ENV === 'test') {
      try {
        // Check if module is already loaded by trying to access it
        // This is a best-effort check - if it fails, useEffect will load it
        const cachedModule = (globalThis as any).__MANTINE_MODULE__
        if (cachedModule?.MantineProvider) {
          return cachedModule.MantineProvider
        }
      } catch {
        // Module not cached, will load in useEffect
      }
    }
    return null
  })
  
  const [isLoading, setIsLoading] = useState(!Provider)
  
  useEffect(() => {
    if (Provider) {
      setIsLoading(false)
      return
    }
    
    // Try to import - if module is already loaded (from setup file), this will be instant
    const loadProvider = async () => {
      try {
        // In test environment, wait for preload to complete if it's still running
        if (process.env.NODE_ENV === 'test' && (globalThis as any).__PROVIDER_PRELOAD_PROMISE__) {
          await (globalThis as any).__PROVIDER_PRELOAD_PROMISE__
        }
        
        const mantineModule = await import('@mantine/core')
        // Cache for future use
        if (process.env.NODE_ENV === 'test') {
          (globalThis as any).__MANTINE_MODULE__ = mantineModule
        }
        setProvider(() => mantineModule.MantineProvider)
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }
    
    loadProvider()
  }, [Provider])
  
  // In test environment, wait for provider to load before rendering children
  // This prevents "MantineProvider was not found" errors
  // Don't render children until provider is ready to avoid provider errors
  if (process.env.NODE_ENV === 'test') {
    if (isLoading || !Provider) {
      return <div data-testid="mantine-provider-loading" style={{ display: 'none' }} />
    }
  }
  
  if (!Provider) return <>{children}</>
  return <Provider>{children}</Provider>
}

const MaterialProvider = ({ children }: { children: ReactNode }) => {
  // Try to load provider immediately if modules are already cached (from global setup)
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(() => {
    if (process.env.NODE_ENV === 'test') {
      try {
        const cachedModule = (globalThis as any).__MATERIAL_MODULE__
        if (cachedModule?.ThemeProvider && cachedModule?.createTheme && cachedModule?.CssBaseline) {
          const theme = cachedModule.createTheme()
          return ({ children: ch }: { children: ReactNode }) => (
            <cachedModule.ThemeProvider theme={theme}>
              <cachedModule.CssBaseline />
              {ch}
            </cachedModule.ThemeProvider>
          )
        }
      } catch {
        // Module not cached, will load in useEffect
      }
    }
    return null
  })
  
  const [isLoading, setIsLoading] = useState(!Provider)
  
  useEffect(() => {
    if (Provider) {
      setIsLoading(false)
      return
    }
    
    // Try to import - if modules are already loaded (from setup file), this will be instant
    const loadProvider = async () => {
      try {
        // In test environment, wait for preload to complete if it's still running
        if (process.env.NODE_ENV === 'test' && (globalThis as any).__PROVIDER_PRELOAD_PROMISE__) {
          await (globalThis as any).__PROVIDER_PRELOAD_PROMISE__
        }
        
        const [{ ThemeProvider, createTheme }, { CssBaseline }] = await Promise.all([
          import('@mui/material/styles'),
          import('@mui/material'),
        ])
        
        // Cache for future use
        if (process.env.NODE_ENV === 'test') {
          (globalThis as any).__MATERIAL_MODULE__ = { ThemeProvider, createTheme, CssBaseline }
        }
        const theme = createTheme()
        setProvider(() => ({ children: ch }: { children: ReactNode }) => (
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {ch}
          </ThemeProvider>
        ))
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }
    
    loadProvider()
  }, [Provider])
  
  // In test environment, wait for provider to load before rendering children
  // Don't render children until provider is ready to avoid provider errors
  if (process.env.NODE_ENV === 'test') {
    if (isLoading || !Provider) {
      return <div data-testid="material-provider-loading" style={{ display: 'none' }} />
    }
  }
  
  if (!Provider) return <>{children}</>
  return <Provider>{children}</Provider>
}

const CarbonProvider = ({ children }: { children: ReactNode }) => {
  // Try to load provider immediately if module is already cached (from global setup)
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(() => {
    if (process.env.NODE_ENV === 'test') {
      try {
        const cachedModule = (globalThis as any).__CARBON_MODULE__
        if (cachedModule?.Theme) {
          return ({ children: ch }: { children: ReactNode }) => (
            <cachedModule.Theme theme="g10">
              {ch}
            </cachedModule.Theme>
          )
        }
      } catch {
        // Module not cached, will load in useEffect
      }
    }
    return null
  })
  
  const [isLoading, setIsLoading] = useState(!Provider)
  
  useEffect(() => {
    if (Provider) {
      setIsLoading(false)
      return
    }
    
    // Try to import - if module is already loaded (from setup file), this will be instant
    const loadProvider = async () => {
      try {
        // In test environment, wait for preload to complete if it's still running
        if (process.env.NODE_ENV === 'test' && (globalThis as any).__PROVIDER_PRELOAD_PROMISE__) {
          await (globalThis as any).__PROVIDER_PRELOAD_PROMISE__
        }
        
        const { Theme } = await import('@carbon/react')
        // Cache for future use
        if (process.env.NODE_ENV === 'test') {
          (globalThis as any).__CARBON_MODULE__ = { Theme }
        }
        setProvider(() => ({ children: ch }: { children: ReactNode }) => (
          <Theme theme="g10">
            {ch}
          </Theme>
        ))
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }
    
    loadProvider()
  }, [Provider])
  
  // In test environment, wait for provider to load before rendering children
  // Don't render children until provider is ready to avoid provider errors
  if (process.env.NODE_ENV === 'test') {
    if (isLoading || !Provider) {
      return <div data-testid="carbon-provider-loading" style={{ display: 'none' }} />
    }
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

