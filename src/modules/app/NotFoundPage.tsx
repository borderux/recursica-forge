/**
 * 404 Not Found Page
 * 
 * Displayed when a user navigates to a route that doesn't exist.
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/adapters/Button'
import { useThemeMode } from '../theme/ThemeModeContext'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { mode } = useThemeMode()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: 'var(--recursica-brand-dimensions-general-xl)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          marginBottom: 'var(--recursica-brand-dimensions-general-md)',
          fontSize: 'var(--recursica-brand-typography-heading-1-font-size)',
          fontWeight: 'var(--recursica-brand-typography-heading-1-font-weight)',
          color: `var(${layer0Base}-element-text-color)`,
          opacity: `var(${layer0Base}-element-text-high-emphasis)`,
        }}
      >
        404
      </h1>
      <p
        style={{
          margin: 0,
          marginBottom: 'var(--recursica-brand-dimensions-general-lg)',
          fontSize: 'var(--recursica-brand-typography-body-font-size)',
          color: `var(${layer0Base}-element-text-color)`,
          opacity: `var(${layer0Base}-element-text-medium-emphasis)`,
        }}
      >
        Page not found
      </p>
      <Button
        variant="solid"
        onClick={() => navigate('/tokens')}
        layer="layer-0"
      >
        Go to Home
      </Button>
    </div>
  )
}
