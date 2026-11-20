/**
 * renderWithForge — render tests against the REAL adapter, styled the way the app styles it.
 *
 * The real adapter splits styling in two, and a test needs both halves:
 *   - the adapter's stylesheet holds the RULES (which property of which element reads which
 *     `--recursica_ui-kit_components_*` variable). It defines no variables itself.
 *   - Forge provides the VALUES: VarsProvider writes every token to :root and the scoped CSS
 *     engine aliases Forge's moded/layered names onto the stable names the adapter reads.
 *
 * So this mirrors main.tsx + MantineShell: theme bootstrap, VarsProvider, the providers, and
 * the same two stylesheets MantineShell loads for the real adapter. With it, a toolbar edit
 * (updateCssVar on a Forge var) shows up in the rendered component's computed style.
 */

import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@recursica/adapter-mantine-v8/style.css'
import { bootstrapTheme } from '../core/bootstrap'
import { UiKitProvider } from '../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../modules/theme/ThemeModeContext'
import { VarsProvider } from '../modules/vars/VarsContext'
import { UnifiedThemeProvider } from '../components/providers/UnifiedThemeProvider'

let bootstrapped = false

export function renderWithForge(ui: ReactElement) {
  if (!bootstrapped) {
    bootstrapTheme()
    bootstrapped = true
  }
  return render(
    <UiKitProvider>
      <ThemeModeProvider>
        <VarsProvider>
          <UnifiedThemeProvider>{ui}</UnifiedThemeProvider>
        </VarsProvider>
      </ThemeModeProvider>
    </UiKitProvider>
  )
}
