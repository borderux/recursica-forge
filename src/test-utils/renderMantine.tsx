/**
 * renderMantine — test helper for Mantine-only component render tests.
 *
 * The app ships three UI-kit backends (Mantine/Material/Carbon), but we only exercise
 * ONE library in tests — Mantine, the default kit (see UiKitProvider, which pins
 * kit='mantine'). Rendering through the app's UnifiedThemeProvider would nest all three
 * providers and lazy-load MUI + Carbon too, whose combined CSS-in-JS injection is what
 * makes headless-DOM renders hang. Wrapping in ONLY MantineProvider keeps the render to a
 * single library so these tests are fast and don't drag in the other two.
 */
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { ThemeModeProvider } from '../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../modules/uikit/UiKitContext'
import type { ReactElement } from 'react'

export function renderMantine(ui: ReactElement) {
  return render(
    <UiKitProvider>
      <ThemeModeProvider>
        <MantineProvider>{ui}</MantineProvider>
      </ThemeModeProvider>
    </UiKitProvider>
  )
}
