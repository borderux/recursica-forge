/**
 * Shared utilities for adapter tests.
 * Ensures tests specify the UI kit explicitly and do not rely on localStorage.
 */

import { useEffect } from 'react'
import { useUiKit } from '../../../modules/uikit/UiKitContext'

export type AdapterKit = 'mantine' | 'material' | 'carbon'

/**
 * Clears the persisted UI kit from localStorage so tests get a predictable
 * initial state and do not depend on values from other tests or the app.
 */
export function clearUiKitStorage(): void {
  try {
    localStorage.removeItem('uikit')
  } catch {
    // ignore in environments where localStorage is unavailable
  }
}

/**
 * Sets the active UI kit when mounted. Use inside UiKitProvider so tests
 * explicitly control which adapter is rendered instead of relying on localStorage.
 */
export function KitSwitcher({ kit }: { kit: AdapterKit }) {
  const { setKit } = useUiKit()
  useEffect(() => {
    setKit(kit)
  }, [kit, setKit])
  return null
}
