/**
 * Material UI Avatar Implementation
 * 
 * Material UI-specific Avatar component that uses CSS variables for theming.
 */

import { Avatar as MaterialAvatar } from '@mui/material'
import type { AvatarProps as AdapterAvatarProps } from '../../Avatar'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getComponentColorVars } from '../../../utils/getComponentColorVars'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { useCssVar } from '../../../hooks/useCssVar'
import { readCssVarResolved } from '../../../../core/css/readCssVar'
import { useState, useEffect } from 'react'
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
  material,
  ...props
}: AdapterAvatarProps) {
  const { mode } = useThemeMode()
  
  // Get color CSS variables using shared utility
  const { bgVar, borderVar, labelVar } = getComponentColorVars({
    componentName: 'Avatar',
    colorVariant,
    layer,
    mode,
    src,
    imageError: false,
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
      const fallbackValue = borderRadiusValueRaw || `var(${borderRadiusVar})`
      setBorderRadiusValue(fallbackValue)
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
  
  // Map unified size to Material UI size
  const materialSize = sizeVariant === 'small' ? 'small' : sizeVariant === 'large' ? 'medium' : undefined
  
  // Handle elevation
  const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
  
  // Calculate border radius value
  const borderRadiusForSx = shape === 'circle' ? '50%' : (borderRadiusValue || `var(${borderRadiusVar})`)
  
  return (
    <MaterialAvatar
      src={src}
      alt={alt}
      sx={{
        width: materialSize ? undefined : `var(${sizeVar})`,
        height: materialSize ? undefined : `var(${sizeVar})`,
        padding: `var(${paddingVar})`,
        backgroundColor: `var(${bgVar})`,
        color: `var(${labelVar})`,
        border: `var(${borderSizeVar}) solid ${borderColorValue || `var(${borderVar})`}`,
        borderRadius: borderRadiusForSx,
        fontFamily: `var(${fontFamilyVar})`,
        fontSize: `var(${fontSizeVar})`,
        fontWeight: `var(${fontWeightVar})`,
        letterSpacing: `var(${letterSpacingVar})`,
        lineHeight: `var(${lineHeightVar})`,
        textDecoration: `var(${textDecorationVar})`,
        textTransform: `var(${textTransformVar})`,
        fontStyle: `var(${fontStyleVar})`,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...material?.sx,
      }}
      className={className}
      style={{
        ...style,
      } as React.CSSProperties}
      {...material}
      {...props}
    >
      {fallback}
    </MaterialAvatar>
  )
}

