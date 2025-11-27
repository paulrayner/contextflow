/**
 * Pure functions for onboarding state management.
 * These handle first-time user detection and welcome modal state.
 */

const STORAGE_KEY = 'contextflow.hasSeenWelcome'

/**
 * Check if the user has previously seen the welcome modal.
 * Reads from localStorage.
 */
export function getHasSeenWelcome(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'true'
}

/**
 * Mark the welcome modal as seen.
 * Persists to localStorage.
 */
export function setHasSeenWelcome(seen: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(seen))
}

/**
 * Determine if the welcome modal should be shown.
 * Shows on first visit (hasSeenWelcome is false).
 */
export function shouldShowWelcome(hasSeenWelcome: boolean): boolean {
  return !hasSeenWelcome
}
