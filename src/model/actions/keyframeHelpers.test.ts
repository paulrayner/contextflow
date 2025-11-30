import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { TemporalKeyframe, BoundedContext } from '../types'
import {
  validateKeyframeDate,
  checkDuplicateKeyframe,
  shouldWarnFarFuture,
  captureContextPositions,
  shouldAutoCreateCurrentKeyframe,
  createCurrentKeyframe,
  sortKeyframes,
} from './keyframeHelpers'

describe('keyframeHelpers', () => {
  describe('validateKeyframeDate', () => {
    it('should accept valid year format (YYYY)', () => {
      const result = validateKeyframeDate('2025')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid quarterly format (YYYY-QN)', () => {
      const result = validateKeyframeDate('2025-Q2')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept all quarters (Q1-Q4)', () => {
      expect(validateKeyframeDate('2025-Q1').valid).toBe(true)
      expect(validateKeyframeDate('2025-Q2').valid).toBe(true)
      expect(validateKeyframeDate('2025-Q3').valid).toBe(true)
      expect(validateKeyframeDate('2025-Q4').valid).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = validateKeyframeDate('invalid-date')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid keyframe date format: invalid-date')
    })

    it('should reject invalid quarter (Q5)', () => {
      const result = validateKeyframeDate('2025-Q5')
      expect(result.valid).toBe(false)
    })

    it('should reject invalid quarter (Q0)', () => {
      const result = validateKeyframeDate('2025-Q0')
      expect(result.valid).toBe(false)
    })

    it('should reject malformed dates', () => {
      expect(validateKeyframeDate('25').valid).toBe(false)
      expect(validateKeyframeDate('20-Q2').valid).toBe(false)
      expect(validateKeyframeDate('2025-Q').valid).toBe(false)
      expect(validateKeyframeDate('2025-2').valid).toBe(false)
    })
  })

  describe('checkDuplicateKeyframe', () => {
    const existingKeyframes: TemporalKeyframe[] = [
      {
        id: 'kf-1',
        date: '2025',
        label: 'Future',
        positions: {},
        activeContextIds: []
      },
      {
        id: 'kf-2',
        date: '2025-Q2',
        label: 'Q2',
        positions: {},
        activeContextIds: []
      }
    ]

    it('should detect duplicate year', () => {
      const result = checkDuplicateKeyframe('2025', existingKeyframes)
      expect(result).toBe(true)
    })

    it('should detect duplicate quarterly date', () => {
      const result = checkDuplicateKeyframe('2025-Q2', existingKeyframes)
      expect(result).toBe(true)
    })

    it('should return false for non-duplicate date', () => {
      const result = checkDuplicateKeyframe('2026', existingKeyframes)
      expect(result).toBe(false)
    })

    it('should return false when no keyframes exist', () => {
      const result = checkDuplicateKeyframe('2025', [])
      expect(result).toBe(false)
    })
  })

  describe('shouldWarnFarFuture', () => {
    let consoleWarnSpy: any

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })

    it('should warn when keyframe is more than 10 years in future', () => {
      const currentYear = new Date().getFullYear()
      const farFuture = (currentYear + 15).toString()
      const result = shouldWarnFarFuture(farFuture)

      expect(result.shouldWarn).toBe(true)
      expect(result.message).toBe(`Keyframe date ${farFuture} is more than 10 years in the future`)
    })

    it('should not warn when keyframe is exactly 10 years in future', () => {
      const currentYear = new Date().getFullYear()
      const exactlyTenYears = (currentYear + 10).toString()
      const result = shouldWarnFarFuture(exactlyTenYears)

      expect(result.shouldWarn).toBe(false)
    })

    it('should not warn when keyframe is less than 10 years in future', () => {
      const currentYear = new Date().getFullYear()
      const nearFuture = (currentYear + 5).toString()
      const result = shouldWarnFarFuture(nearFuture)

      expect(result.shouldWarn).toBe(false)
    })

    it('should not warn for current year', () => {
      const currentYear = new Date().getFullYear().toString()
      const result = shouldWarnFarFuture(currentYear)

      expect(result.shouldWarn).toBe(false)
    })

    it('should not warn for past dates', () => {
      const result = shouldWarnFarFuture('2020')

      expect(result.shouldWarn).toBe(false)
    })

    it('should handle quarterly dates correctly', () => {
      const currentYear = new Date().getFullYear()
      const farFuture = `${currentYear + 15}-Q2`
      const result = shouldWarnFarFuture(farFuture)

      expect(result.shouldWarn).toBe(true)
    })
  })

  describe('captureContextPositions', () => {
    it('should capture strategic x and shared y positions from contexts', () => {
      const contexts: BoundedContext[] = [
        {
          id: 'ctx-1',
          name: 'Context 1',
          positions: {
            flow: { x: 10 },
            strategic: { x: 50 },
            distillation: { x: 50, y: 50 },
            shared: { y: 100 }
          },
          evolutionStage: 'custom-built',
          strategicClassification: 'core'
        },
        {
          id: 'ctx-2',
          name: 'Context 2',
          positions: {
            flow: { x: 20 },
            strategic: { x: 75 },
            distillation: { x: 75, y: 75 },
            shared: { y: 200 }
          },
          evolutionStage: 'product/rental',
          strategicClassification: 'supporting'
        }
      ]

      const result = captureContextPositions(contexts)

      expect(result).toEqual({
        'ctx-1': { x: 50, y: 100 },
        'ctx-2': { x: 75, y: 200 }
      })
    })

    it('should return empty object when no contexts provided', () => {
      const result = captureContextPositions([])
      expect(result).toEqual({})
    })

    it('should handle single context', () => {
      const contexts: BoundedContext[] = [
        {
          id: 'ctx-1',
          name: 'Context 1',
          positions: {
            flow: { x: 0 },
            strategic: { x: 25 },
            distillation: { x: 25, y: 25 },
            shared: { y: 50 }
          },
          evolutionStage: 'custom-built',
          strategicClassification: 'core'
        }
      ]

      const result = captureContextPositions(contexts)

      expect(result).toEqual({
        'ctx-1': { x: 25, y: 50 }
      })
    })
  })

  describe('shouldAutoCreateCurrentKeyframe', () => {
    const currentYear = new Date().getFullYear()

    it('should return true when first keyframe is in future', () => {
      const existingKeyframes: TemporalKeyframe[] = []
      const keyframeYear = currentYear + 5
      const date = keyframeYear.toString()

      const result = shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)

      expect(result).toBe(true)
    })

    it('should return false when first keyframe is current year', () => {
      const existingKeyframes: TemporalKeyframe[] = []
      const keyframeYear = currentYear
      const date = currentYear.toString()

      const result = shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)

      expect(result).toBe(false)
    })

    it('should return false when keyframes already exist', () => {
      const existingKeyframes: TemporalKeyframe[] = [
        {
          id: 'kf-1',
          date: '2024',
          label: 'Now',
          positions: {},
          activeContextIds: []
        }
      ]
      const keyframeYear = currentYear + 5
      const date = keyframeYear.toString()

      const result = shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)

      expect(result).toBe(false)
    })

    it('should return false when first keyframe is in past', () => {
      const existingKeyframes: TemporalKeyframe[] = []
      const keyframeYear = currentYear - 5
      const date = keyframeYear.toString()

      const result = shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)

      expect(result).toBe(false)
    })
  })

  describe('createCurrentKeyframe', () => {
    it('should create keyframe with "Current" label at current year', () => {
      const currentYear = new Date().getFullYear()
      const positions = {
        'ctx-1': { x: 50, y: 100 }
      }
      const activeContextIds = ['ctx-1']

      const result = createCurrentKeyframe(currentYear, positions, activeContextIds)

      expect(result.date).toBe(currentYear.toString())
      expect(result.label).toBe('Current')
      expect(result.positions).toEqual(positions)
      expect(result.activeContextIds).toEqual(activeContextIds)
      expect(result.id).toMatch(/^keyframe-\d+-now$/)
    })

    it('should create keyframe with all context positions', () => {
      const currentYear = new Date().getFullYear()
      const positions = {
        'ctx-1': { x: 50, y: 100 },
        'ctx-2': { x: 75, y: 200 }
      }
      const activeContextIds = ['ctx-1', 'ctx-2']

      const result = createCurrentKeyframe(currentYear, positions, activeContextIds)

      expect(result.positions).toEqual(positions)
      expect(result.activeContextIds).toEqual(activeContextIds)
    })

    it('should handle empty positions and contexts', () => {
      const currentYear = new Date().getFullYear()

      const result = createCurrentKeyframe(currentYear, {}, [])

      expect(result.positions).toEqual({})
      expect(result.activeContextIds).toEqual([])
    })
  })

  describe('sortKeyframes', () => {
    it('should sort keyframes by date (ascending)', () => {
      const keyframes: TemporalKeyframe[] = [
        {
          id: 'kf-2',
          date: '2026',
          label: 'Later',
          positions: {},
          activeContextIds: []
        },
        {
          id: 'kf-1',
          date: '2024',
          label: 'Earlier',
          positions: {},
          activeContextIds: []
        },
        {
          id: 'kf-3',
          date: '2025',
          label: 'Middle',
          positions: {},
          activeContextIds: []
        }
      ]

      const result = sortKeyframes(keyframes)

      expect(result[0].date).toBe('2024')
      expect(result[1].date).toBe('2025')
      expect(result[2].date).toBe('2026')
    })

    it('should handle quarterly dates correctly', () => {
      const keyframes: TemporalKeyframe[] = [
        {
          id: 'kf-2',
          date: '2025-Q3',
          label: 'Q3',
          positions: {},
          activeContextIds: []
        },
        {
          id: 'kf-1',
          date: '2025-Q1',
          label: 'Q1',
          positions: {},
          activeContextIds: []
        },
        {
          id: 'kf-3',
          date: '2025',
          label: 'Year',
          positions: {},
          activeContextIds: []
        },
        {
          id: 'kf-4',
          date: '2025-Q2',
          label: 'Q2',
          positions: {},
          activeContextIds: []
        }
      ]

      const result = sortKeyframes(keyframes)

      expect(result[0].date).toBe('2025')
      expect(result[1].date).toBe('2025-Q1')
      expect(result[2].date).toBe('2025-Q2')
      expect(result[3].date).toBe('2025-Q3')
    })

    it('should not mutate original array', () => {
      const keyframes: TemporalKeyframe[] = [
        {
          id: 'kf-2',
          date: '2026',
          label: 'Later',
          positions: {},
          activeContextIds: []
        },
        {
          id: 'kf-1',
          date: '2024',
          label: 'Earlier',
          positions: {},
          activeContextIds: []
        }
      ]
      const originalOrder = [...keyframes]

      sortKeyframes(keyframes)

      expect(keyframes).toEqual(originalOrder)
    })

    it('should handle empty array', () => {
      const result = sortKeyframes([])
      expect(result).toEqual([])
    })

    it('should handle single keyframe', () => {
      const keyframes: TemporalKeyframe[] = [
        {
          id: 'kf-1',
          date: '2025',
          label: 'Only',
          positions: {},
          activeContextIds: []
        }
      ]

      const result = sortKeyframes(keyframes)

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2025')
    })
  })
})
