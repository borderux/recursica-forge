import { forwardRef } from 'react'
import { type IconComponent } from '../../components/iconLibrary'
import './MenuIcon.css'

export interface MenuIconProps {
  icon: IconComponent | null
  active?: boolean
  onClick?: () => void
  title?: string
  'aria-label'?: string
  className?: string
}

const MenuIcon = forwardRef<HTMLButtonElement, MenuIconProps>(
  ({ icon: Icon, active = false, onClick, title, 'aria-label': ariaLabel, className = '' }, ref) => {
    if (!Icon) return null

    return (
      <button
        ref={ref}
        className={`toolbar-icon-button ${active ? 'active' : ''} ${className}`}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel || title}
      >
        <Icon className="toolbar-icon" />
      </button>
    )
  }
)

MenuIcon.displayName = 'MenuIcon'

export default MenuIcon

