import { useState, createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { ComponentsSidebar } from './ComponentsSidebar'

const DebugModeContext = createContext<{
  debugMode: boolean
  setDebugMode: (value: boolean) => void
} | undefined>(undefined)

export function useDebugMode() {
  const context = useContext(DebugModeContext)
  if (!context) {
    return { debugMode: false, setDebugMode: () => { } }
  }
  return context
}

export default function PreviewPage() {
  const [debugMode, setDebugMode] = useState(false)


  return (
    <DebugModeContext.Provider value={{ debugMode, setDebugMode }}>
      <div style={{ display: 'flex', height: debugMode ? 'auto' : '100%', minHeight: debugMode ? undefined : '100%' }}>
        <ComponentsSidebar
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
