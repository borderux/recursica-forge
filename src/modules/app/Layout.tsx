/**
 * Layout
 *
 * Renders the Mantine shell and hosts the routed pages inside it.
 */
import { Suspense, lazy } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useUiKit } from '../uikit/UiKitContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import { GlobalRefModalProvider } from '../toolbar/modals/GlobalRefModalProvider'
import { OnToneModalProvider } from '../toolbar/modals/OnToneModalProvider'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { useUndoRedoKeyboard } from '../../hooks/useUndoRedoKeyboard'

// Create lazy components outside the component to avoid context timing issues
const MantineShell = lazy(() => import('./shells/MantineShell'))

export function Layout() {
  const { kit, setKit } = useUiKit()
  useUndoRedoKeyboard()

  return (
    <Suspense fallback={<span />}>
      <MantineShell kit={kit} onKitChange={setKit}>
        <Suspense fallback={<span />}>
          <Outlet />
        </Suspense>
      </MantineShell>
      <ColorTokenPicker />
      <PaletteSwatchPicker />
      <GlobalRefModalProvider />
      <OnToneModalProvider />
    </Suspense>
  )
}


