import { getVarsStore } from './store/varsStore'

// Initialize the store and compute/apply initial CSS vars before React mounts
export function bootstrapTheme() {
  try {
    getVarsStore()
  } catch {}
}


