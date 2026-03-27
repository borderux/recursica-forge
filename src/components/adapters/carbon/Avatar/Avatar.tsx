/**
 * Carbon Avatar Implementation
 * 
 * Carbon-specific Avatar component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Avatar component, so we'll create a custom implementation.
 */

import { useState, useEffect } from 'react'
import type { AvatarProps as AdapterAvatarProps } from '../../Avatar'
import { getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
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
  const sizeVar = buildComponentCssVarPath('Avatar', 'variants', 'sizes', sizeVariant, 'properties', 'size')
  
  // Get level CSS variables (border-size, border-radius, padding)
  const paddingStyleType = colorVariant.split('-')[0]
  const styleType = colorVariant.split('-').slice(1).join('-')
  const borderSizeStyleVar = paddingStyleType === 'image'
    ? buildComponentCssVarPath('Avatar', 'variants', 'styles', 'image', 'properties', 'border-size')
    : buildComponentCssVarPath('Avatar', 'variants', 'styles', paddingStyleType, 'variants', styleType, 'properties', 'border-size')
  
  const sizeBorderColorVar = buildComponentCssVarPath('Avatar', 'variants', 'sizes', sizeVariant, 'properties', 'border-color')
  const sizeBorderSizeVar = buildComponentCssVarPath('Avatar', 'variants', 'sizes', sizeVariant, 'properties', 'border-size')
  
  const sizeBorderColorRaw = useCssVar(sizeBorderColorVar, '')
  const sizeBorderSizeRaw = useCssVar(sizeBorderSizeVar, '')
  const borderRadiusVar = buildComponentCssVarPath('Avatar', 'variants', 'styles', paddingStyleType, 'properties', 'border-radius')
  const paddingVar = buildComponentCssVarPath('Avatar', 'variants', 'styles', paddingStyleType, 'properties', 'padding')
  const widthVar = buildComponentCssVarPath('Avatar', 'variants', 'sizes', sizeVariant, 'properties', 'width')
  const heightVar = buildComponentCssVarPath('Avatar', 'variants', 'sizes', sizeVariant, 'properties', 'height')
  const iconSizeVar = buildComponentCssVarPath('Avatar', 'variants', 'sizes', sizeVariant, 'properties', 'icon-size')
  
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
      data-avatar-type={paddingStyleType}
      style={{
        // Set CSS custom properties that reference the UIKit CSS vars directly
        // These point to the UIKit vars, allowing CSS to reference them dynamically
        '--avatar-bg': `var(${bgVar})`,
        backgroundColor: paddingStyleType === 'image' ? `var(${bgVar})` : undefined,
        '--avatar-border': borderColorValue || `var(${borderVar})`,
        '--avatar-label': paddingStyleType === 'image' 
          ? (borderColorValue || `var(${borderVar})`) 
          : `var(${labelVar})`,
        '--avatar-size': `var(${sizeVar})`,
        '--avatar-width': `var(${widthVar})`,
        '--avatar-height': `var(${heightVar})`,
        '--avatar-icon-size': `var(${iconSizeVar})`,
        '--avatar-border-size': borderSizeStyleVar ? `var(${borderSizeStyleVar})` : `var(${sizeBorderSizeVar})`,
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
      ) : paddingStyleType === 'image' ? (
        <img
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          alt={alt || ''}
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

