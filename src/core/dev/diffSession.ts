/**
 * Diff Session Coordinator
 *
 * Manages the state shared between the "Diff" button trigger and the
 * post-import diff tab. Uses sessionStorage so data survives the mandatory
 * store reset but not across unrelated browser sessions.
 */

export interface CssSnapshot {
  [cssVarName: string]: string
}

export interface JsonSnapshot {
  tokens: object
  brand: object
  uikit: object
}

export interface DiffSessionData {
  /** Captured before reset — the "ground truth" state */
  originalJson: JsonSnapshot
  /** CSS vars captured before reset */
  originalCss: CssSnapshot
}

const SESSION_KEY = '__recursica_diff_session__'
const PENDING_KEY = '__recursica_diff_pending__'

/** Persist the pre-reset snapshot and mark a diff as pending. */
export function startDiffSession(data: DiffSessionData): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    sessionStorage.setItem(PENDING_KEY, '1')
  } catch {
    // sessionStorage quota exceeded — unlikely but handle gracefully
  }
}

/** Returns true if a diff session was started and is waiting for an import. */
export function isDiffSessionPending(): boolean {
  try {
    return sessionStorage.getItem(PENDING_KEY) === '1'
  } catch {
    return false
  }
}

/** Clear the pending flag once the diff has been triggered. */
export function consumeDiffSession(): DiffSessionData | null {
  try {
    sessionStorage.removeItem(PENDING_KEY)
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    sessionStorage.removeItem(SESSION_KEY)
    return JSON.parse(raw) as DiffSessionData
  } catch {
    return null
  }
}

/** Peek at session data without consuming it. */
export function peekDiffSession(): DiffSessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as DiffSessionData) : null
  } catch {
    return null
  }
}
