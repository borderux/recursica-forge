/**
 * Icon Library Abstraction
 * 
 * This file provides an abstraction layer for icon libraries, allowing
 * easy switching between different icon libraries without changing code.
 * 
 * Currently using: Phosphor Icons and Radix UI Icons
 * To switch libraries, update the imports and iconMap below.
 */

import React from 'react'

// Import only the icons we actually use - this allows Vite to tree-shake unused icons
import {
  Angle,
  ArrowBendRightDown,
  ArrowClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowLineDown,
  ArrowLineLeft,
  ArrowLineRight,
  ArrowLineUp,
  ArrowRight,
  ArrowUp,
  ArrowsHorizontal,
  ArrowsIn,
  ArrowsInLineHorizontal,
  ArrowsInLineVertical,
  ArrowsOut,
  ArrowsOutLineHorizontal,
  ArrowsOutLineVertical,
  ArrowsVertical,
  Asterisk,
  BugBeetle as Bug,
  CaretDoubleRight,
  CaretDown,
  CaretRight,
  CaretUp,
  Check,
  CheckCircle,
  CheckSquare,
  Circle,
  CircleHalf,
  CircleHalfTilt,
  Columns,
  CopySimple,
  CornersOut,
  CursorClick,
  Diamond,
  DiamondsFour,
  DotsThree,
  Download,
  Equals,
  Eye,
  FadersHorizontal,
  FileSvg,
  FileText,
  FrameCorners,
  GridFour,
  House,
  Info,
  Layout,
  Link,
  List,
  Minus,
  Moon,
  PaintBrush,
  PaintBucket,
  Palette,
  Pause,
  Pencil,
  Plus,
  Queue,
  Resize,
  Scales,
  SignOut,
  SlidersHorizontal,
  SplitHorizontal,
  SplitVertical,
  Square,
  SquareLogo,
  SquaresFour,
  Stack,
  Star,
  Sun,
  Swap,
  TextAUnderline,
  TextAa,
  TextItalic,
  TextStrikethrough,
  TextT,
  TextUnderline,
  Trash,
  Upload,
  User,
  Warning,
  X,
} from '@phosphor-icons/react'

// Import Radix UI typography icons
import {
  FontItalicIcon,
  FontRomanIcon,
  UnderlineIcon,
  StrikethroughIcon,
  TextNoneIcon,
  TextIcon,
  FontBoldIcon,
  FontSizeIcon,
  LetterCaseCapitalizeIcon,
  LetterCaseLowercaseIcon,
  LetterCaseUppercaseIcon,
} from '@radix-ui/react-icons'

// Wrapper to normalize Radix icon props (Radix uses width/height, not size)
function createRadixIconWrapper(RadixIcon: React.ComponentType<any>): IconComponent {
  return ({ size, style, ...props }) => {
    const width = size || props.width || 16
    const height = size || props.height || 16
    return React.createElement(RadixIcon, {
      width,
      height,
      style,
      ...props
    })
  }
}

// Simple slash icon component (Phosphor doesn't have a slash icon)
const SlashIcon: IconComponent = ({ style, ...props }) => {
  return React.createElement('span', { style: { display: 'inline-block', ...style }, ...props }, '/')
}

// Text T with slash icon (custom combination)
const TextTSlashIcon: IconComponent = ({ style, size = 16, ...props }) => {
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: size,
      height: size,
      ...style
    },
    ...props
  }, [
    React.createElement(TextT, { key: 'text-t', size, style: { opacity: 0.5 } }),
    React.createElement('span', {
      key: 'slash',
      style: {
        position: 'absolute',
        fontSize: `${(size as number) * 0.8}px`,
        fontWeight: 'bold',
        transform: 'rotate(-15deg)',
        color: 'currentColor',
      }
    }, '/')
  ])
}

// Type for icon component props
export type IconComponent = React.ComponentType<{
  className?: string
  style?: React.CSSProperties
  width?: number | string
  height?: number | string
  [key: string]: any
}>

// Map of icon names (kebab-case) to Phosphor icon components
const phosphorIconMap: Record<string, IconComponent> = {
  // Props
  'paint-brush': PaintBrush,
  'swatch': Palette,
  'square-2-stack': Stack,
  'bars-arrow-up': TextAa,
  'scale': Scales,
  'bars-3': List,
  'equals': Equals,
  'arrows-pointing-out': ArrowsOut,
  'arrows-out': ArrowsOut,
  'arrow-long-up': ArrowUp,
  'arrow-long-down': ArrowDown,
  'arrow-long-left': ArrowLeft,
  'arrow-long-right': ArrowRight,
  'arrow-line-right': ArrowLineRight,
  'pause': Pause,
  'arrows-pointing-in': ArrowsIn,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'chevron-double-right': CaretDoubleRight,
  'arrows-up-down': ArrowsVertical,
  'arrows-right-left': ArrowsHorizontal,
  'arrows-left-right': ArrowsHorizontal,
  'arrow-right-start-on-rectangle': SignOut,
  'arrow-up-on-square': Upload,
  'arrow-uturn-right': ArrowBendRightDown,
  'rectangle-stack': Stack,
  'rectangle-group': GridFour,
  'diamonds-four': DiamondsFour,
  'squares-plus': Plus,
  'squares-2x2': GridFour,
  'square-3-stack-3d': Stack,
  'list-bullet': List,
  'view-columns': Columns,
  'circle-stack': Stack,
  'arrow-path': ArrowClockwise,
  'queue-list': Queue,
  'swap': Swap,
  'split-horizontal': SplitHorizontal,
  'diamond': Diamond,
  'paint-bucket': PaintBucket,
  'copy-simple': CopySimple,
  
  // Variants
  'variant-color': DiamondsFour,
  'variant-size': Resize,
  'resize': Resize,
  
  // Other icons used in the app
  'chevron-down': CaretDown,
  'chevron-right': CaretRight,
  'caret-down': CaretDown,
  'caret-up': CaretUp,
  'slash': SlashIcon,
  'x-mark': X,
  'document-text': FileText,
  'arrow-down-tray': Download,
  'arrow-up-tray': Upload,
  'sun': Sun,
  'moon': Moon,
  'star': Star,
  'plus': Plus,
  'minus': Minus,
  'arrow-top-right-on-square': Link,
  'trash': Trash,
  'text-aa': TextAa,
  'text-underline': TextUnderline,
  'text-strikethrough': TextStrikethrough,
  'text-t': TextT,
  'text-a-underline': TextAUnderline,
  'text-t-slash': TextTSlashIcon,
  'text-italic': TextItalic,
  
  // Radix UI typography icons (wrapped to normalize props)
  'radix-font-italic': createRadixIconWrapper(FontItalicIcon),
  'radix-font-roman': createRadixIconWrapper(FontRomanIcon),
  'radix-underline': createRadixIconWrapper(UnderlineIcon),
  'radix-strikethrough': createRadixIconWrapper(StrikethroughIcon),
  'radix-text-none': createRadixIconWrapper(TextNoneIcon),
  'radix-text': createRadixIconWrapper(TextIcon),
  'radix-font-bold': createRadixIconWrapper(FontBoldIcon),
  'radix-font-size': createRadixIconWrapper(FontSizeIcon),
  'radix-letter-case-uppercase': createRadixIconWrapper(LetterCaseUppercaseIcon),
  'radix-letter-case-lowercase': createRadixIconWrapper(LetterCaseLowercaseIcon),
  'radix-letter-case-capitalize': createRadixIconWrapper(LetterCaseCapitalizeIcon),
  'frame-corners': FrameCorners,
  'corners-out': CornersOut,
  'palette': Palette,
  'arrow-line-up': ArrowLineUp,
  'arrow-line-down': ArrowLineDown,
  'arrow-line-left': ArrowLineLeft,
  'arrows-in-line-horizontal': ArrowsInLineHorizontal,
  'arrows-out-line-horizontal': ArrowsOutLineHorizontal,
  'arrows-in-line-vertical': ArrowsInLineVertical,
  'arrows-out-line-vertical': ArrowsOutLineVertical,
  'angle': Angle,
  'file-svg': FileSvg,
  'check': Check,
  'check-circle': CheckCircle,
  'house': House,
  'home': House,
  'info': Info,
  'sliders-horizontal': SlidersHorizontal,
  'faders-horizontal': FadersHorizontal,
  'user': User,
  'circle-half': CircleHalf,
  'circle-half-tilt': CircleHalfTilt,
  'border': FrameCorners,
  'square': Square,
  'square-logo': SquareLogo,
  'cursor-click': CursorClick,
  'arrows-horizontal': ArrowsHorizontal,
  'arrows-vertical': ArrowsVertical,
  'stack': Stack,
  'layers': Stack,
  'layout': Layout,
  'asterisk': Asterisk,
  'bug': Bug,
  'eye': Eye,
  'circle': Circle,
  'ellipsis-horizontal': DotsThree,
  'pencil': Pencil,
  'pencil-square': Pencil,
  'edit': Pencil,
  'warning': Warning,
  'arrows-in': ArrowsIn,
  'x': X,
  'check-square': CheckSquare,
  'squares-four': SquaresFour,
  'split-vertical': SplitVertical,
}

/**
 * Get an icon component by name
 * @param iconName - Kebab-case icon name (e.g., "paint-brush")
 * @returns Icon component or null if not found
 */
export function getIcon(iconName: string): IconComponent | null {
  const IconComponent = phosphorIconMap[iconName]
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in icon map`)
    return null
  }
  
  return IconComponent
}

/**
 * Get all available icon names
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(phosphorIconMap)
}


