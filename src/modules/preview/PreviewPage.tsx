import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ComponentsSidebar } from './ComponentsSidebar'

export default function PreviewPage() {
  const [showUnmapped, setShowUnmapped] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to first component if on /components without a component name
  useEffect(() => {
    if (location.pathname === '/components') {
      // Will redirect after sidebar loads and determines first component
      // This is handled in ComponentsSidebar
    }
  }, [location.pathname, navigate])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <ComponentsSidebar showUnmapped={showUnmapped} onShowUnmappedChange={setShowUnmapped} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  )
}
