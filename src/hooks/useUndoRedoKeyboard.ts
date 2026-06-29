import { useEffect } from 'react'
import { useVars } from '../modules/vars/VarsContext'

export function useUndoRedoKeyboard() {
  const { undo, redo } = useVars()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (cmdOrCtrl) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            // Cmd+Shift+Z or Ctrl+Shift+Z
            e.preventDefault()
            redo()
          } else {
            // Cmd+Z or Ctrl+Z
            e.preventDefault()
            undo()
          }
        } else if (e.key.toLowerCase() === 'y' && !isMac) {
          // Ctrl+Y (Windows/Linux redo)
          e.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [undo, redo])
}
