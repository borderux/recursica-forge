import { describe, expect, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { Tree } from '../Tree'
import { preloadComponent } from '../../registry'
import '../../../components/registry/mantine'
import { itDom } from '../../../test-utils/conditionalTests'
import { getComponentTextCssVar, getComponentLevelCssVar } from '../../utils/cssVarNames'

describe.skip('Tree Component (Adapter)', () => {
  beforeAll(async () => {
    await Promise.all([
      import('@mantine/core'),
      import('@mui/material/styles'),
      import('@mui/material'),
      import('@carbon/react'),
    ])
    await preloadComponent('mantine', 'Tree')
  })

  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <UiKitProvider>
        <ThemeModeProvider>
          <UnifiedThemeProvider>
            {ui}
          </UnifiedThemeProvider>
        </ThemeModeProvider>
      </UiKitProvider>
    )
  }

  const waitForTree = async (container: HTMLElement) => {
    return await waitFor(() => {
      const el = container.querySelector('.recursica-tree') as HTMLElement | null
      if (!el) throw new Error('Tree not found')
      return el
    }, { timeout: 90000 })
  }

  itDom('renders tree nodes', async () => {
    const data = [
      {
        value: 'root',
        label: 'Root Node',
        children: [
          { value: 'child', label: 'Child Node' }
        ]
      }
    ]
    const { container } = renderWithProviders(<Tree data={data} />)
    await waitForTree(container)
    expect(screen.getByText('Root Node')).toBeInTheDocument()
  }, 120000)

  itDom('applies custom typography and layout CSS variables correctly', async () => {
    const data = [
      {
        value: 'root',
        label: 'Root Node',
      }
    ]
    const { container } = renderWithProviders(<Tree data={data} selected={['root']} />)
    const root = await waitForTree(container)

    // Resolve expected CSS variable names for typography
    const selectedFontFamilyVar = getComponentTextCssVar('Tree', 'selected-text', 'font-family')
    const unselectedFontFamilyVar = getComponentTextCssVar('Tree', 'unselected-text', 'font-family')
    const indentVar = getComponentLevelCssVar('Tree', 'indent')
    const buttonNodeGapVar = getComponentLevelCssVar('Tree', 'button-node-gap')

    const styles = window.getComputedStyle(root)
    expect(styles.getPropertyValue('--tree-selected-font-family')).toContain(selectedFontFamilyVar)
    expect(styles.getPropertyValue('--tree-unselected-font-family')).toContain(unselectedFontFamilyVar)
    expect(styles.getPropertyValue('--tree-indent')).toContain(indentVar)
    expect(styles.getPropertyValue('--tree-button-node-gap')).toContain(buttonNodeGapVar)
  }, 120000)
})

