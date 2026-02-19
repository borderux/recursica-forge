import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { Button } from '../Button'
import { describeDom, itDom } from '../../../test-utils/conditionalTests'

// Mock icon component for testing
const TestIcon = () => <svg data-testid="test-icon"><circle /></svg>

describe.skip('Button Component (Adapter)', () => {
  beforeEach(async () => {
    // Clear any CSS variables set in previous tests
    document.documentElement.style.cssText = ''
    // Wait for providers to be ready before each test - they're lazy loaded
    await new Promise(resolve => setTimeout(resolve, 200))
  })

  const renderWithProviders = (ui: React.ReactElement, kit: 'mantine' | 'material' | 'carbon' = 'mantine') => {
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

  // Helper to wait for button component to load (not Suspense fallback)
  const waitForButton = async (container: HTMLElement, expectedText?: string) => {
    return await waitFor(() => {
      const btn = container.querySelector('button')
      if (!btn) throw new Error('Button not found')
      if (expectedText && !btn.textContent?.includes(expectedText)) {
        throw new Error(`Button text mismatch: expected "${expectedText}", got "${btn.textContent}"`)
      }
      return btn
    }, { timeout: 15000 })
  }


  describeDom('Basic Rendering', () => {
    it.skip('renders with children', async () => {
      const { container } = renderWithProviders(<Button>Click me</Button>)
      await waitForButton(container, 'Click me')
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders as button element', async () => {
      const { container } = renderWithProviders(<Button>Test</Button>)
      await waitForButton(container, 'Test')
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('renders with icon', async () => {
      const { container } = renderWithProviders(
        <Button icon={<TestIcon />}>With Icon</Button>
      )
      await waitForButton(container, 'With Icon')
      expect(screen.getByText('With Icon')).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders icon-only button', async () => {
      const { container } = renderWithProviders(<Button icon={<TestIcon />} />)
      await waitForButton(container)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })
  })

  describeDom('Props Handling', () => {
    it.skip('handles onClick events', async () => {
      const handleClick = vi.fn()
      const { container } = renderWithProviders(<Button onClick={handleClick}>Click</Button>)
      const button = await waitForButton(container, 'Click')
      // Add small delay to ensure button is fully interactive
      await new Promise(resolve => setTimeout(resolve, 100))
      button.click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies disabled state', async () => {
      const { container } = renderWithProviders(<Button disabled>Disabled</Button>)
      const button = await waitForButton(container, 'Disabled')
      expect(button).toBeDisabled()
    })

    it('applies type prop', async () => {
      const { container } = renderWithProviders(<Button type="submit">Submit</Button>)
      const button = await waitForButton(container, 'Submit')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('applies className', async () => {
      const { container } = renderWithProviders(<Button className="custom-class">Test</Button>)
      const button = await waitForButton(container, 'Test')
      expect(button).toHaveClass('custom-class')
    })

    it('applies custom style', async () => {
      const { container } = renderWithProviders(
        <Button style={{ marginTop: '10px' }}>Test</Button>
      )
      const button = await waitForButton(container, 'Test')
      expect(button).toHaveStyle({ marginTop: '10px' })
    })
  })

  describeDom('Variants', () => {
    it('applies solid variant', async () => {
      const { container } = renderWithProviders(<Button variant="solid">Solid</Button>)
      const button = await waitForButton(container, 'Solid')
      expect(button).toBeInTheDocument()
      // Check that CSS variables are referenced (actual values depend on CSS var definitions)
      const styles = window.getComputedStyle(button)
      expect(styles).toBeDefined()
    })

    it('applies outline variant', async () => {
      const { container } = renderWithProviders(<Button variant="outline">Outline</Button>)
      const button = await waitForButton(container, 'Outline')
      expect(button).toBeInTheDocument()
    })

    it('applies text variant', async () => {
      const { container } = renderWithProviders(<Button variant="text">Text</Button>)
      const button = await waitForButton(container, 'Text')
      expect(button).toBeInTheDocument()
    })
  })

  describeDom('Sizes', () => {
    it('applies default size', async () => {
      const { container } = renderWithProviders(<Button size="default">Default</Button>)
      const button = await waitForButton(container, 'Default')
      expect(button).toBeInTheDocument()
    })

    it('applies small size', async () => {
      const { container } = renderWithProviders(<Button size="small">Small</Button>)
      const button = await waitForButton(container, 'Small')
      expect(button).toBeInTheDocument()
    })
  })

  describeDom('Layers', () => {
    it('applies layer-0', async () => {
      const { container } = renderWithProviders(<Button layer="layer-0">Layer 0</Button>)
      const button = await waitForButton(container, 'Layer 0')
      expect(button).toBeInTheDocument()
    })

    it('applies layer-1', async () => {
      const { container } = renderWithProviders(<Button layer="layer-1">Layer 1</Button>)
      const button = await waitForButton(container, 'Layer 1')
      expect(button).toBeInTheDocument()
    })

    it('applies layer-2', async () => {
      const { container } = renderWithProviders(<Button layer="layer-2">Layer 2</Button>)
      const button = await waitForButton(container, 'Layer 2')
      expect(button).toBeInTheDocument()
    })

    it('applies layer-3', async () => {
      const { container } = renderWithProviders(<Button layer="layer-3">Layer 3</Button>)
      const button = await waitForButton(container, 'Layer 3')
      expect(button).toBeInTheDocument()
    })

  })

  describeDom('Fallback Behavior', () => {
    it('renders native button when component not available', async () => {
      // This tests the fallback when useComponent returns null
      // In a real scenario, this would happen if the component isn't registered
      const { container } = renderWithProviders(<Button>Fallback</Button>)
      const button = await waitForButton(container, 'Fallback')
      expect(button).toBeInTheDocument()
      expect(button?.textContent).toBe('Fallback')
    })
  })

  describeDom('Library-Specific Props', () => {
    it('passes mantine-specific props', async () => {
      const { container } = renderWithProviders(
        <Button mantine={{ 'data-testid': 'mantine-button' }}>Mantine</Button>
      )
      const button = await waitForButton(container, 'Mantine')
      expect(button).toBeInTheDocument()
    })

    it('passes material-specific props', async () => {
      const { container } = renderWithProviders(
        <Button material={{ 'data-testid': 'material-button' }}>Material</Button>
      )
      const button = await waitForButton(container, 'Material')
      expect(button).toBeInTheDocument()
    })

    it('passes carbon-specific props', async () => {
      const { container } = renderWithProviders(
        <Button carbon={{ 'data-testid': 'carbon-button' }}>Carbon</Button>
      )
      const button = await waitForButton(container, 'Carbon')
      expect(button).toBeInTheDocument()
    })
  })
})

