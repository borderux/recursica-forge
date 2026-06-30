import { useEffect } from 'react'

export function useForcePseudoState(activeState: string | null) {
  useEffect(() => {
    if (!activeState) return

    const stateLower = activeState.toLowerCase()
    if (stateLower === 'default' || stateLower === 'disabled') {
      const el = document.getElementById('recursica-force-state-style')
      if (el) el.remove()
      return
    }

    const targetPseudos = stateLower === 'hover' 
      ? [':hover'] 
      : stateLower === 'focus' 
        ? [':focus-visible', ':focus-within', ':focus', '.Mui-focusVisible'] 
        : []

    if (targetPseudos.length === 0) return

    function updateForcedStyles() {
      let injectedCss = ''

      function processRule(rule: any) {
        if (rule.cssRules) {
          // Group rules (e.g. @media or @supports)
          for (let k = 0; k < rule.cssRules.length; k++) {
            processRule(rule.cssRules[k])
          }
        } else if (rule.selectorText) {
          const hasMatch = targetPseudos.some(p => rule.selectorText.includes(p))
          if (hasMatch) {
            const selectors = rule.selectorText.split(',')
            const rewrittenSelectors = selectors.map((s: string) => {
              let matched = false
              let newS = s
              targetPseudos.forEach(p => {
                if (newS.includes(p)) {
                  matched = true
                  const escapedP = p.replace(/\./g, '\\.')
                  newS = newS.replace(new RegExp(escapedP, 'g'), '')
                }
              })
              if (matched) {
                return `.recursica-force-${stateLower} ` + newS.trim()
              }
              return s
            })
            
            if (rewrittenSelectors.some((s: string) => s.includes(`.recursica-force-${stateLower}`))) {
              const onlyRewritten = rewrittenSelectors.filter((s: string) => s.includes(`.recursica-force-${stateLower}`))
              injectedCss += `${onlyRewritten.join(', ')} { ${rule.style.cssText} }\n`
            }
          }
        }
      }

      try {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i]
          if (sheet.ownerNode && (sheet.ownerNode as Element).id === 'recursica-force-state-style') continue
          try {
            if (!sheet.cssRules) continue
            for (let j = 0; j < sheet.cssRules.length; j++) {
              processRule(sheet.cssRules[j])
            }
          } catch (e) {
            // ignore cross-origin sheet access error
          }
        }
      } catch (e) {
        console.error(e)
      }

      let el = document.getElementById('recursica-force-state-style')
      if (!el) {
        el = document.createElement('style')
        el.id = 'recursica-force-state-style'
        document.head.appendChild(el)
      }
      el.innerHTML = injectedCss
    }

    // Run immediately
    updateForcedStyles()

    // Observe style tag additions to document head
    const observer = new MutationObserver(() => {
      updateForcedStyles()
    })
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })

    // Delayed retries to handle asynchronous style injections
    const t1 = setTimeout(updateForcedStyles, 100)
    const t2 = setTimeout(updateForcedStyles, 500)
    const t3 = setTimeout(updateForcedStyles, 1500)

    return () => {
      observer.disconnect()
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      const el = document.getElementById('recursica-force-state-style')
      if (el) el.remove()
    }
  }, [activeState])
}
