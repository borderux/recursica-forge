/**
 * Active Mantine adapter
 *
 * The Mantine shell can render its components from one of two implementations:
 *   - 'local':   Forge's own Mantine-based adapter (src/components/adapters/local). Default.
 *   - 'mantine': the published @recursica/adapter-mantine-v8 package.
 *
 * The choice is read once, synchronously, at module load and is fixed for the life of the
 * page. Changing it reloads the page: each adapter ships global CSS that cannot be unloaded,
 * so only the active one's stylesheet is ever loaded.
 *
 * Selected by `?adapter=local|mantine` (which is remembered) or the localStorage key below.
 */

export type MantineAdapter = 'local' | 'mantine'

export const MANTINE_ADAPTER_STORAGE_KEY = 'recursica:mantine-adapter'

function read(): MantineAdapter {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('adapter')
    if (fromUrl === 'local' || fromUrl === 'mantine') {
      window.localStorage.setItem(MANTINE_ADAPTER_STORAGE_KEY, fromUrl)
      return fromUrl
    }
    const stored = window.localStorage.getItem(MANTINE_ADAPTER_STORAGE_KEY)
    if (stored === 'local' || stored === 'mantine') return stored
  } catch {
    // No window/localStorage (SSR, locked-down storage): fall through to the default.
  }
  return 'local'
}

const active: MantineAdapter = read()

export function getMantineAdapter(): MantineAdapter {
  return active
}

export const isLocalAdapter = active === 'local'

/** Persists the choice and reloads so the other adapter's modules and CSS load cleanly. */
export function setMantineAdapter(next: MantineAdapter) {
  if (next === active) return
  window.localStorage.setItem(MANTINE_ADAPTER_STORAGE_KEY, next)
  const url = new URL(window.location.href)
  url.searchParams.delete('adapter')
  window.location.replace(url.toString())
}
