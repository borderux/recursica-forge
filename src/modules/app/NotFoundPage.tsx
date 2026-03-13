/**
 * 404 Not Found Page
 * 
 * Displayed when a user navigates to a route that doesn't exist.
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/adapters/Button'
import { useThemeMode } from '../theme/ThemeModeContext'
import { genericLayerText } from '../../core/css/cssVarBuilder'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { mode } = useThemeMode()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: 'var(--recursica_brand_dimensions_general_xl)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          marginBottom: 'var(--recursica_brand_dimensions_general_md)',
          fontSize: 'var(--recursica_brand_typography_heading_1_font_size)',
          fontWeight: 'var(--recursica_brand_typography_heading_1_font_weight)',
          color: `var(${genericLayerText(0, 'color')})`,
          opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
        }}
      >
        404
      </h1>
      <p
        style={{
          margin: 0,
          marginBottom: 'var(--recursica_brand_dimensions_general_lg)',
          fontSize: 'var(--recursica_brand_typography_body-font-size)',
          color: `var(${genericLayerText(0, 'color')})`,
          opacity: `var(${genericLayerText(0, 'medium-emphasis')})`,
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
