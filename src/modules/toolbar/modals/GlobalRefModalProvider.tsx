/**
 * GlobalRefModalProvider
 *
 * Mounts once at the application root.  Listens for `globalRefConflict`
 * CustomEvents dispatched by the interceptor and renders a
 * `<GlobalRefModal />` when a conflict needs user resolution.
 */

import { useState, useEffect, useCallback } from 'react'
import { GlobalRefModal } from './GlobalRefModal'
import type { GlobalRefConflict } from '../../../core/css/globalRefInterceptor'

export function GlobalRefModalProvider() {
  const [conflict, setConflict] = useState<GlobalRefConflict | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleConflict = useCallback((e: Event) => {
    const detail = (e as CustomEvent<GlobalRefConflict>).detail
    if (detail) {
      setConflict(detail)
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('globalRefConflict', handleConflict)
    return () => window.removeEventListener('globalRefConflict', handleConflict)
  }, [handleConflict])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Keep conflict in state briefly so the closing animation can reference it
    setTimeout(() => setConflict(null), 300)
  }, [])

  return (
    <GlobalRefModal
      isOpen={isOpen}
      onClose={handleClose}
      conflict={conflict}
    />
  )
}
