import { useEffect } from 'react'

export function useForcePseudoState(activeState: string | null) {
  useEffect(() => {
    if (!activeState || activeState === 'default' || activeState === 'disabled') {
      const el = document.getElementById('recursica-force-state-style')
      if (el) el.remove()
      return
    }

    const targetPseudos = activeState === 'hover' 
      ? [':hover'] 
      : activeState === 'focus' 
        ? [':focus-visible', ':focus-within', ':focus', '.Mui-focusVisible'] 
        : []

    if (targetPseudos.length === 0) return

    let injectedCss = ''

    function processRule(rule: any) {
      if (rule.cssRules) {
        // It's a group rule like CSSMediaRule or CSSSupportsRule
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
                // Escape the dot for Mui-focusVisible when doing RegExp
                const escapedP = p.replace(/\./g, '\\.')
                newS = newS.replace(new RegExp(escapedP, 'g'), '')
              }
            })
            if (matched) {
              return `.recursica-force-${activeState} ` + newS.trim()
            }
            return s
          })
          
          if (rewrittenSelectors.some((s: string) => s.includes(`.recursica-force-${activeState}`))) {
            const onlyRewritten = rewrittenSelectors.filter((s: string) => s.includes(`.recursica-force-${activeState}`))
            injectedCss += `${onlyRewritten.join(', ')} { ${rule.style.cssText} }\n`
          }
        }
      }
    }

    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i]
        try {
          if (!sheet.cssRules) continue
          for (let j = 0; j < sheet.cssRules.length; j++) {
            processRule(sheet.cssRules[j])
          }
        } catch (e) {
          // Cross-origin stylesheet access error, ignore
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

    return () => {
      const el = document.getElementById('recursica-force-state-style')
      if (el) el.remove()
    }
  }, [activeState])
}
