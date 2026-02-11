/**
 * Layout
 *
 * Chooses a UI shell (Mantine/Material/Carbon) based on UiKitContext and
 * hosts the routed pages inside it.
 */
import { Suspense, lazy, useMemo } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useUiKit } from '../uikit/UiKitContext'

// Create lazy components outside the component to avoid context timing issues
const MantineShell = lazy(() => import('./shells/MantineShell'))
const MaterialShell = lazy(() => import('./shells/MaterialShell'))
const CarbonShell = lazy(() => import('./shells/CarbonShell'))

export function Layout() {
  const { kit, setKit } = useUiKit()

  const Shell = useMemo(() => {
    if (kit === 'mantine') return MantineShell
    if (kit === 'material') return MaterialShell
    return CarbonShell
  }, [kit])

  return (
    <Suspense fallback={<span />}>
      <Shell kit={kit} onKitChange={setKit}>
        <Suspense fallback={<span />}>
          <Outlet />
        </Suspense>
      </Shell>
    </Suspense>
  )
}


