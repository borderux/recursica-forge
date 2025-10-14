import { Suspense, lazy, useMemo } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useUiKit } from '../uikit/UiKitContext'

export function Layout() {
  const { kit, setKit } = useUiKit()

  const Shell = useMemo(() => {
    if (kit === 'mantine') return lazy(() => import('./shells/MantineShell'))
    if (kit === 'material') return lazy(() => import('./shells/MaterialShell'))
    return lazy(() => import('./shells/CarbonShell'))
  }, [kit])

  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading UI…</div>}>
      <Shell kit={kit} onKitChange={setKit}>
        <Outlet />
      </Shell>
    </Suspense>
  )
}


