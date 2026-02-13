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
  ArrowsOutCardinal,
  ArrowsOutLineHorizontal,
  ArrowsOutLineVertical,
  ArrowsOutSimple,
  ArrowsVertical,
  Article,
  Asterisk,
  Bell,
  BugBeetle as Bug,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Chat,
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
  Envelope,
  Equals,
  Eye,
  EyeSlash,
  FadersHorizontal,
  FileSvg,
  FileText,
  FrameCorners,
  GoogleLogo,
  GridFour,
  Heart,
  House,
  Info,
  Layout,
  Link,
  List,
  MagnifyingGlass,
  Minus,
  Moon,
  PaintBrush,
  PaintBrushBroad,
  PaintBucket,
  Palette,
  PaperPlaneTilt as PaperPlane,
  Pause,
  Pencil,
  Plus,
  Queue,
  Resize,
  Rows,
  Scales,
  SignOut,
  SlidersHorizontal,
  SplitHorizontal,
  Square,
  SquareLogo,
  SquaresFour,
  Stack,
  Star,
  Sun,
  Swap,
  TextAUnderline,
  TextAa,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextItalic,
  TextStrikethrough,
  TextT,
  TextUnderline,
  ThumbsUp,
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
  // Navigation & Arrows
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-long-up': ArrowUp,
  'arrow-long-down': ArrowDown,
  'arrow-long-left': ArrowLeft,
  'arrow-long-right': ArrowRight,
  'arrow-line-up': ArrowLineUp,
  'arrow-line-down': ArrowLineDown,
  'arrow-line-left': ArrowLineLeft,
  'arrow-line-right': ArrowLineRight,
  'arrow-bend-right-down': ArrowBendRightDown,
  'arrow-clockwise': ArrowClockwise,
  'arrow-path': ArrowClockwise,
  'chevron-up': CaretUp,
  'chevron-down': CaretDown,
  'chevron-left': CaretLeft,
  'chevron-right': CaretRight,
  'caret-up': CaretUp,
  'caret-down': CaretDown,
  'caret-left': CaretLeft,
  'caret-right': CaretRight,
  'chevron-double-right': CaretDoubleRight,
  'arrows-up-down': ArrowsVertical,
  'arrows-vertical': ArrowsVertical,
  'arrows-right-left': ArrowsHorizontal,
  'arrows-left-right': ArrowsHorizontal,
  'arrows-horizontal': ArrowsHorizontal,
  'arrows-in': ArrowsIn,
  'arrows-out': ArrowsOut,
  'arrows-pointing-in': ArrowsIn,
  'arrows-pointing-out': ArrowsOut,
  'arrows-out-simple': ArrowsOutSimple,
  'arrows-out-cardinal': ArrowsOutCardinal,

  // Link & Actions
  'link': Link,
  'external-link': Link,
  'arrow-top-right-on-square': Link,
  'sign-out': SignOut,
  'share': SignOut,
  'upload': Upload,
  'arrow-up-tray': Upload,
  'download': Download,
  'arrow-down-tray': Download,
  'trash': Trash,
  'pencil': Pencil,
  'edit': Pencil,
  'pencil-square': Pencil,
  'magnifying-glass': MagnifyingGlass,
  'search': MagnifyingGlass,
  'plus': Plus,
  'minus': Minus,
  'x': X,
  'x-mark': X,
  'check': Check,
  'check-circle': CheckCircle,
  'check-square': CheckSquare,
  'info': Info,
  'warning': Warning,
  'article': Article,
  'file-text': FileText,
  'document-text': FileText,
  'file-svg': FileSvg,
  'copy-simple': CopySimple,
  'cursor-click': CursorClick,

  // Communication & Social
  'bell': Bell,
  'envelope': Envelope,
  'chat': Chat,
  'paper-plane': PaperPlane,
  'heart': Heart,
  'thumbs-up': ThumbsUp,
  'star': Star,
  'user': User,
  'google-logo': GoogleLogo,

  // UI Components & States
  'house': House,
  'home': House,
  'sun': Sun,
  'moon': Moon,
  'eye': Eye,
  'eye-slash': EyeSlash,
  'bug': Bug,
  'asterisk': Asterisk,
  'options': DotsThree,
  'ellipsis-horizontal': DotsThree,
  'resize': Resize,
  'variant-size': Resize,
  'variant-color': DiamondsFour,
  'diamonds-four': DiamondsFour,
  'palette': Palette,
  'swatch': Palette,
  'paint-brush': PaintBrush,
  'paint-brush-broad': PaintBrushBroad,
  'paint-bucket': PaintBucket,
  'stack': Stack,
  'layers': Stack,
  'circle-stack': Stack,
  'square-2-stack': Stack,
  'square-3-stack-3d': Stack,
  'rectangle-stack': Stack,
  'shadow': Stack,
  'grid-four': GridFour,
  'squares-four': SquaresFour,
  'squares-2x2': GridFour,
  'rectangle-group': GridFour,
  'plus-square': Plus,
  'squares-plus': Plus,
  'list': List,
  'list-bullet': List,
  'bars-3': List,
  'queue-list': Queue,
  'queue': Queue,
  'columns': Columns,
  'view-columns': Columns,
  'rows': Rows,
  'layout': Layout,
  'scale': Scales,
  'equals': Equals,
  'pause': Pause,
  'swap': Swap,
  'split-horizontal': SplitHorizontal,
  'diamond': Diamond,
  'circle': Circle,
  'circle-half': CircleHalf,
  'circle-half-tilt': CircleHalfTilt,
  'square': Square,
  'square-logo': SquareLogo,
  'frame-corners': FrameCorners,
  'corners-out': CornersOut,
  'border': FrameCorners,
  'angle': Angle,
  'slash': SlashIcon,

  // Typography
  'text-aa': TextAa,
  'text-underline': TextUnderline,
  'text-strikethrough': TextStrikethrough,
  'text-t': TextT,
  'text-a-underline': TextAUnderline,
  'text-t-slash': TextTSlashIcon,
  'text-italic': TextItalic,
  'align-left': TextAlignLeft,
  'align-center': TextAlignCenter,
  'align-right': TextAlignRight,
  'text-align-left': TextAlignLeft,
  'text-align-center': TextAlignCenter,
  'text-align-right': TextAlignRight,
  'bars-arrow-up': TextAa,

  // Radix UI typography icons
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

  // Layout Properties
  'arrows-in-line-horizontal': ArrowsInLineHorizontal,
  'arrows-out-line-horizontal': ArrowsOutLineHorizontal,
  'arrows-in-line-vertical': ArrowsInLineVertical,
  'arrows-out-line-vertical': ArrowsOutLineVertical,
  'sliders-horizontal': SlidersHorizontal,
  'faders-horizontal': FadersHorizontal,
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


