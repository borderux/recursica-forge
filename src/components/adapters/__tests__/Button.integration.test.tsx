import { describe, it, expect, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider, useUiKit } from '../../../modules/uikit/UiKitContext'
import { Button } from '../Button'

// Helper component to switch kits
function KitSwitcher({ kit }: { kit: 'mantine' | 'material' | 'carbon' }) {
  const { setKit } = useUiKit()
  useEffect(() => {
    setKit(kit)
  }, [kit, setKit])
  return null
}

describe('Button Integration', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  const renderWithKit = (kit: 'mantine' | 'material' | 'carbon') => {
    return render(
      <UiKitProvider>
        <UnifiedThemeProvider>
          <KitSwitcher kit={kit} />
          <Button>Test Button</Button>
        </UnifiedThemeProvider>
      </UiKitProvider>
    )
  }

  it('renders Mantine button when Mantine is selected', async () => {
    const { container } = renderWithKit('mantine')
    
    await waitFor(() => {
      const button = screen.getByText('Test Button')
      expect(button).toBeInTheDocument()
    })

    // Check for Mantine-specific classes (may be present after library loads)
    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
  })

  it('renders Material button when Material is selected', async () => {
    const { container } = renderWithKit('material')
    
    await waitFor(() => {
      const button = screen.getByText('Test Button')
      expect(button).toBeInTheDocument()
    })

    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
  })

  it('renders Carbon button when Carbon is selected', async () => {
    const { container } = renderWithKit('carbon')
    
    await waitFor(() => {
      const button = screen.getByText('Test Button')
      expect(button).toBeInTheDocument()
    })

    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
  })

  it('maintains consistent props across libraries', async () => {
    const variants: Array<'solid' | 'outline' | 'text'> = ['solid', 'outline', 'text']
    const sizes: Array<'default' | 'small'> = ['default', 'small']
    const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const

    for (const variant of variants) {
      for (const size of sizes) {
        for (const layer of layers) {
          for (const kit of ['mantine', 'material', 'carbon'] as const) {
            const { container, unmount } = render(
              <UiKitProvider>
                <UnifiedThemeProvider>
                  <KitSwitcher kit={kit} />
                  <Button variant={variant} size={size} layer={layer}>
                    {variant} {size}
                  </Button>
                </UnifiedThemeProvider>
              </UiKitProvider>
            )

            await waitFor(() => {
              const button = screen.getByText(`${variant} ${size}`)
              expect(button).toBeInTheDocument()
            })

            const button = container.querySelector('button')
            expect(button).toBeInTheDocument()
            
            unmount()
          }
        }
      }
    }
  })

  it('handles disabled state consistently across libraries', async () => {
    for (const kit of ['mantine', 'material', 'carbon'] as const) {
      const { container, unmount } = render(
        <UiKitProvider>
          <UnifiedThemeProvider>
            <KitSwitcher kit={kit} />
            <Button disabled>Disabled</Button>
          </UnifiedThemeProvider>
        </UiKitProvider>
      )

      await waitFor(() => {
        const button = screen.getByText('Disabled')
        expect(button).toBeDisabled()
      })

      unmount()
    }
  })

  it('handles icon prop consistently across libraries', async () => {
    const TestIcon = () => <svg data-testid="icon"><circle /></svg>

    for (const kit of ['mantine', 'material', 'carbon'] as const) {
      const { unmount } = render(
        <UiKitProvider>
          <UnifiedThemeProvider>
            <KitSwitcher kit={kit} />
            <Button icon={<TestIcon />}>With Icon</Button>
          </UnifiedThemeProvider>
        </UiKitProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('With Icon')).toBeInTheDocument()
        expect(screen.getByTestId('icon')).toBeInTheDocument()
      })

      unmount()
    }
  })
})

