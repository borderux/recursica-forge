import { useState, useEffect, createContext, useContext } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ComponentsSidebar } from './ComponentsSidebar'

const DebugModeContext = createContext<{ debugMode: boolean; setDebugMode: (value: boolean) => void } | undefined>(undefined)

export function useDebugMode() {
  const context = useContext(DebugModeContext)
  if (!context) throw new Error('useDebugMode must be used within PreviewPage')
  return context
}

export default function PreviewPage() {
  const [showUnmapped, setShowUnmapped] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
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
    <DebugModeContext.Provider value={{ debugMode, setDebugMode }}>
      <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
        <ComponentsSidebar 
          showUnmapped={showUnmapped} 
          onShowUnmappedChange={setShowUnmapped}
          debugMode={debugMode}
          onDebugModeChange={setDebugMode}
        />
        <div style={{ flex: 1, minHeight: 0 }}>
          <Outlet />
        </div>
      </div>
    </DebugModeContext.Provider>
  )
}
