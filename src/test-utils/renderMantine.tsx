/**
 * renderMantine — test helper for Mantine-only component render tests.
 *
 * Wraps the component in ONLY MantineProvider rather than the app's UnifiedThemeProvider,
 * which keeps headless-DOM renders fast.
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
