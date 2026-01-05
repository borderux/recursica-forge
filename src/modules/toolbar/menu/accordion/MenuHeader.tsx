import { iconNameToReactComponent } from '../../../components/iconUtils'
import './MenuHeader.css'

export interface MenuHeaderProps {
  title: string
  icon?: React.ComponentType<{ className?: string }> | null
  selectedValue?: string
  onClick: () => void
  className?: string
}

export default function MenuHeader({
  title,
  icon: Icon,
  selectedValue,
  onClick,
  className = '',
}: MenuHeaderProps) {
  return (
    <div className={`menu-header-section ${className}`}>
      <button
        className="menu-header"
        onClick={onClick}
      >
        <div className="menu-header-content">
          {Icon && <Icon className="menu-header-icon" />}
          <span className="menu-header-title">{title}</span>
        </div>
        <div className="menu-header-right">
          {selectedValue && (
            <span className="menu-header-selected-value">{selectedValue}</span>
          )}
        </div>
      </button>
    </div>
  )
}

