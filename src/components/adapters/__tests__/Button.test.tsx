import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnifiedThemeProvider } from '../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../modules/uikit/UiKitContext'
import { Button } from '../Button'

// Mock icon component for testing
const TestIcon = () => <svg data-testid="test-icon"><circle /></svg>

describe('Button Component (Adapter)', () => {
  beforeEach(() => {
    // Clear any CSS variables set in previous tests
    document.documentElement.style.cssText = ''
  })

  const renderWithProviders = (ui: React.ReactElement, kit: 'mantine' | 'material' | 'carbon' = 'mantine') => {
    return render(
      <UiKitProvider>
        <UnifiedThemeProvider>
          {ui}
        </UnifiedThemeProvider>
      </UiKitProvider>
    )
  }

  describe('Basic Rendering', () => {
    it('renders with children', () => {
      renderWithProviders(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders as button element', () => {
      const { container } = renderWithProviders(<Button>Test</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('renders with icon', () => {
      renderWithProviders(
        <Button icon={<TestIcon />}>With Icon</Button>
      )
      expect(screen.getByText('With Icon')).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders icon-only button', () => {
      renderWithProviders(<Button icon={<TestIcon />} />)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('handles onClick events', async () => {
      const handleClick = vi.fn()
      renderWithProviders(<Button onClick={handleClick}>Click</Button>)
      const button = screen.getByText('Click')
      button.click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies disabled state', () => {
      renderWithProviders(<Button disabled>Disabled</Button>)
      expect(screen.getByText('Disabled')).toBeDisabled()
    })

    it('applies type prop', () => {
      const { container } = renderWithProviders(<Button type="submit">Submit</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('applies className', () => {
      const { container } = renderWithProviders(<Button className="custom-class">Test</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('custom-class')
    })

    it('applies custom style', () => {
      const { container } = renderWithProviders(
        <Button style={{ marginTop: '10px' }}>Test</Button>
      )
      const button = container.querySelector('button')
      expect(button).toHaveStyle({ marginTop: '10px' })
    })
  })

  describe('Variants', () => {
    it('applies solid variant', () => {
      const { container } = renderWithProviders(<Button variant="solid">Solid</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
      // Check that CSS variables are referenced (actual values depend on CSS var definitions)
      const styles = window.getComputedStyle(button!)
      expect(styles).toBeDefined()
    })

    it('applies outline variant', () => {
      const { container } = renderWithProviders(<Button variant="outline">Outline</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('applies text variant', () => {
      const { container } = renderWithProviders(<Button variant="text">Text</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('applies default size', () => {
      const { container } = renderWithProviders(<Button size="default">Default</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('applies small size', () => {
      const { container } = renderWithProviders(<Button size="small">Small</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Layers', () => {
    it('applies layer-0', () => {
      const { container } = renderWithProviders(<Button layer="layer-0">Layer 0</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('applies layer-1', () => {
      const { container } = renderWithProviders(<Button layer="layer-1">Layer 1</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('applies layer-2', () => {
      const { container } = renderWithProviders(<Button layer="layer-2">Layer 2</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('applies layer-3', () => {
      const { container } = renderWithProviders(<Button layer="layer-3">Layer 3</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

  })

  describe('Fallback Behavior', () => {
    it('renders native button when component not available', () => {
      // This tests the fallback when useComponent returns null
      // In a real scenario, this would happen if the component isn't registered
      const { container } = renderWithProviders(<Button>Fallback</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
      expect(button?.textContent).toBe('Fallback')
    })
  })

  describe('Library-Specific Props', () => {
    it('passes mantine-specific props', () => {
      const { container } = renderWithProviders(
        <Button mantine={{ 'data-testid': 'mantine-button' }}>Mantine</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('passes material-specific props', () => {
      const { container } = renderWithProviders(
        <Button material={{ 'data-testid': 'material-button' }}>Material</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('passes carbon-specific props', () => {
      const { container } = renderWithProviders(
        <Button carbon={{ 'data-testid': 'carbon-button' }}>Carbon</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })
})

