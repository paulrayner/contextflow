import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getHasSeenWelcome,
  setHasSeenWelcome,
  shouldShowWelcome,
} from './onboarding'

describe('onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getHasSeenWelcome', () => {
    it('returns false when localStorage is empty', () => {
      expect(getHasSeenWelcome()).toBe(false)
    })

    it('returns false when localStorage value is not "true"', () => {
      localStorage.setItem('contextflow.hasSeenWelcome', 'false')
      expect(getHasSeenWelcome()).toBe(false)
    })

    it('returns true when localStorage value is "true"', () => {
      localStorage.setItem('contextflow.hasSeenWelcome', 'true')
      expect(getHasSeenWelcome()).toBe(true)
    })
  })

  describe('setHasSeenWelcome', () => {
    it('sets localStorage value to "true" when passed true', () => {
      setHasSeenWelcome(true)
      expect(localStorage.getItem('contextflow.hasSeenWelcome')).toBe('true')
    })

    it('sets localStorage value to "false" when passed false', () => {
      setHasSeenWelcome(false)
      expect(localStorage.getItem('contextflow.hasSeenWelcome')).toBe('false')
    })
  })

  describe('shouldShowWelcome', () => {
    it('returns true when hasSeenWelcome is false', () => {
      expect(shouldShowWelcome(false)).toBe(true)
    })

    it('returns false when hasSeenWelcome is true', () => {
      expect(shouldShowWelcome(true)).toBe(false)
    })
  })
})
