/**
 * Carbon Avatar Implementation
 * 
 * Carbon-specific Avatar component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Avatar component, so we'll create a custom implementation.
 */

import { useState, useEffect } from 'react'
import type { AvatarProps as AdapterAvatarProps } from '../../Avatar'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getComponentColorVars } from '../../../utils/getComponentColorVars'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { useCssVar } from '../../../hooks/useCssVar'
import { readCssVarResolved } from '../../../../core/css/readCssVar'
import './Avatar.css'

export default function Avatar({
  src,
  alt,
  fallback,
  colorVariant = 'text-ghost',
  sizeVariant = 'default',
  layer = 'layer-0',
  elevation,
  shape = 'circle',
  className,
  style,
  carbon,
  ...props
}: AdapterAvatarProps) {
  const { mode } = useThemeMode()
  const [imageError, setImageError] = useState(false)
  
  // Get color CSS variables using shared utility
  const { bgVar, borderVar, labelVar } = getComponentColorVars({
    componentName: 'Avatar',
    colorVariant,
    layer,
    mode,
    src,
    imageError,
  })
  
  // Reactively read border color to trigger re-renders when it changes
  const borderColorValue = useCssVar(borderVar, '')
  
  // Get size and other CSS variables
  const sizeVar = getComponentCssVar('Avatar', 'size', sizeVariant, undefined)
  
  // Get level CSS variables (border-size, border-radius, padding)
  const borderSizeVar = getComponentLevelCssVar('Avatar', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Avatar', 'border-radius')
  const paddingVar = getComponentLevelCssVar('Avatar', 'padding')
  
  // Reactively read border-radius to trigger re-renders when it changes
  const borderRadiusValueRaw = useCssVar(borderRadiusVar, '')
  // Resolve the border-radius value (handles var() references)
  const [borderRadiusValue, setBorderRadiusValue] = useState(() => {
    const resolved = readCssVarResolved(borderRadiusVar, 10)
    return resolved || borderRadiusValueRaw || `var(${borderRadiusVar})`
  })
  
  useEffect(() => {
    const updateBorderRadius = () => {
      const resolved = readCssVarResolved(borderRadiusVar, 10)
      if (resolved) {
        setBorderRadiusValue(resolved)
        return
      }
      setBorderRadiusValue(borderRadiusValueRaw || `var(${borderRadiusVar})`)
    }
    
    updateBorderRadius()
    
    // Listen for CSS variable updates
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(borderRadiusVar)) {
        updateBorderRadius()
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes
    const observer = new MutationObserver(() => {
      updateBorderRadius()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [borderRadiusVar, borderRadiusValueRaw])
  
  // Get text CSS variables - use size variant for variant-specific text properties
  const fontFamilyVar = getComponentTextCssVar('Avatar', 'text', 'font-family', sizeVariant)
  const fontSizeVar = getComponentTextCssVar('Avatar', 'text', 'font-size', sizeVariant)
  const fontWeightVar = getComponentTextCssVar('Avatar', 'text', 'font-weight', sizeVariant)
  const letterSpacingVar = getComponentTextCssVar('Avatar', 'text', 'letter-spacing', sizeVariant)
  const lineHeightVar = getComponentTextCssVar('Avatar', 'text', 'line-height', sizeVariant)
  const textDecorationVar = getComponentTextCssVar('Avatar', 'text', 'text-decoration', sizeVariant)
  const textTransformVar = getComponentTextCssVar('Avatar', 'text', 'text-transform', sizeVariant)
  const fontStyleVar = getComponentTextCssVar('Avatar', 'text', 'font-style', sizeVariant)
  
  // Handle elevation
  const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
  
  return (
    <div
      className={`cds--avatar ${className || ''}`}
      style={{
        // Set CSS custom properties that reference the UIKit CSS vars directly
        // These point to the UIKit vars, allowing CSS to reference them dynamically
        '--avatar-bg': `var(${bgVar})`,
        '--avatar-border': borderColorValue || `var(${borderVar})`,
        '--avatar-label': `var(${labelVar})`,
        '--avatar-size': `var(${sizeVar})`,
        '--avatar-border-size': `var(${borderSizeVar})`,
        // Set the CSS variable - for circle, use 50%, otherwise use the resolved value
        '--avatar-border-radius': shape === 'circle' ? '50%' : (borderRadiusValue || `var(${borderRadiusVar})`),
        '--avatar-padding': `var(${paddingVar})`,
        '--avatar-font-family': `var(${fontFamilyVar})`,
        '--avatar-font-size': `var(${fontSizeVar})`,
        '--avatar-font-weight': `var(${fontWeightVar})`,
        '--avatar-letter-spacing': `var(${letterSpacingVar})`,
        '--avatar-line-height': `var(${lineHeightVar})`,
        '--avatar-text-decoration': `var(${textDecorationVar})`,
        '--avatar-text-transform': `var(${textTransformVar})`,
        '--avatar-font-style': `var(${fontStyleVar})`,
        // Only set non-CSS-variable styles here (like boxShadow for elevation)
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...style,
      } as React.CSSProperties}
      {...carbon}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || ''}
          onError={() => setImageError(true)}
          className="cds--avatar-image"
        />
      ) : (
        <div className="cds--avatar-fallback">
          {fallback}
        </div>
      )}
    </div>
  )
}

