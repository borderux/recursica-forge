import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { App } from './App'

it('renders app title', () => {
  render(
    <MantineProvider>
      <App />
    </MantineProvider>
  )
  // App component uses Mantine Title component which requires MantineProvider
  expect(screen.getByText(/recursica-forge/i)).toBeInTheDocument()
  expect(screen.getByText(/Vite \+ React \+ TypeScript scaffold/i)).toBeInTheDocument()
})
