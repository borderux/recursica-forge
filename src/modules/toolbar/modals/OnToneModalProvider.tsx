/**
 * OnToneModalProvider
 *
 * Mounts once at the application root. Listens for `onToneConflict`
 * CustomEvents dispatched by the interceptor and renders an
 * <OnToneModal /> when related on-tone colors need user confirmation.
 */

import { useState, useEffect, useCallback } from 'react'
import { OnToneModal } from './OnToneModal'
import type { OnToneConflict } from '../../../core/css/onToneInterceptor'

export function OnToneModalProvider() {
  const [conflict, setConflict] = useState<OnToneConflict | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleConflict = useCallback((e: Event) => {
    const detail = (e as CustomEvent<OnToneConflict>).detail
    if (detail) {
      setConflict(detail)
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('onToneConflict', handleConflict)
    return () => window.removeEventListener('onToneConflict', handleConflict)
  }, [handleConflict])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setConflict(null), 300)
  }, [])

  return (
    <OnToneModal
      isOpen={isOpen}
      onClose={handleClose}
      conflict={conflict}
    />
  )
}
