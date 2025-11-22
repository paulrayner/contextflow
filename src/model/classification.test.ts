import { describe, it, expect } from 'vitest'
import {
  classifyFromDistillationPosition,
  classifyFromStrategicPosition,
  DISTILLATION_GENERIC_MAX_X,
  DISTILLATION_CORE_MIN_X,
  DISTILLATION_CORE_MIN_Y,
  STRATEGIC_GENESIS_MAX_X,
  STRATEGIC_CUSTOM_BUILT_MAX_X,
  STRATEGIC_PRODUCT_RENTAL_MAX_X
} from './classification'

describe('classifyFromDistillationPosition', () => {
  describe(`generic classification (x < ${DISTILLATION_GENERIC_MAX_X})`, () => {
    it('should classify as generic at x=0', () => {
      expect(classifyFromDistillationPosition(0, 50)).toBe('generic')
    })

    it(`should classify as generic at x=${DISTILLATION_GENERIC_MAX_X - 1}`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_GENERIC_MAX_X - 1, 50)).toBe('generic')
    })

    it(`should classify as generic at boundary x=${DISTILLATION_GENERIC_MAX_X - 0.1}`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_GENERIC_MAX_X - 0.1, 50)).toBe('generic')
    })

    it('should classify as generic regardless of y value', () => {
      expect(classifyFromDistillationPosition(20, 0)).toBe('generic')
      expect(classifyFromDistillationPosition(20, 50)).toBe('generic')
      expect(classifyFromDistillationPosition(20, 100)).toBe('generic')
    })
  })

  describe(`core classification (x >= ${DISTILLATION_CORE_MIN_X} && y >= ${DISTILLATION_CORE_MIN_Y})`, () => {
    it(`should classify as core at x=${DISTILLATION_CORE_MIN_X}, y=${DISTILLATION_CORE_MIN_Y}`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y)).toBe('core')
    })

    it('should classify as core at x=100, y=100', () => {
      expect(classifyFromDistillationPosition(100, 100)).toBe('core')
    })

    it('should classify as core at x=80, y=75', () => {
      expect(classifyFromDistillationPosition(80, 75)).toBe('core')
    })

    it(`should NOT classify as core if y < ${DISTILLATION_CORE_MIN_Y}`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y - 1)).toBe('supporting')
      expect(classifyFromDistillationPosition(100, 0)).toBe('supporting')
    })

    it(`should NOT classify as core if x < ${DISTILLATION_CORE_MIN_X}`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X - 1, DISTILLATION_CORE_MIN_Y)).toBe('supporting')
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X - 1, 100)).toBe('supporting')
    })
  })

  describe('supporting classification (middle + bottom-right)', () => {
    it(`should classify as supporting at x=${DISTILLATION_GENERIC_MAX_X}, y=${DISTILLATION_CORE_MIN_Y}`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_GENERIC_MAX_X, DISTILLATION_CORE_MIN_Y)).toBe('supporting')
    })

    it(`should classify as supporting at x=50, y=${DISTILLATION_CORE_MIN_Y / 2}`, () => {
      expect(classifyFromDistillationPosition(50, DISTILLATION_CORE_MIN_Y / 2)).toBe('supporting')
    })

    it(`should classify as supporting at x=${DISTILLATION_CORE_MIN_X - 1}, y=75`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X - 1, 75)).toBe('supporting')
    })

    it(`should classify as supporting at x=${DISTILLATION_CORE_MIN_X}, y=${DISTILLATION_CORE_MIN_Y - 1}`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y - 1)).toBe('supporting')
    })

    it('should classify as supporting in middle range', () => {
      expect(classifyFromDistillationPosition(40, 30)).toBe('supporting')
      expect(classifyFromDistillationPosition(50, 60)).toBe('supporting')
    })
  })

  describe('boundary conditions', () => {
    it(`should handle x=${DISTILLATION_GENERIC_MAX_X} boundary correctly`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_GENERIC_MAX_X - 0.01, 50)).toBe('generic')
      expect(classifyFromDistillationPosition(DISTILLATION_GENERIC_MAX_X, 50)).toBe('supporting')
      expect(classifyFromDistillationPosition(DISTILLATION_GENERIC_MAX_X + 0.01, 50)).toBe('supporting')
    })

    it(`should handle x=${DISTILLATION_CORE_MIN_X} boundary correctly`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X - 0.01, DISTILLATION_CORE_MIN_Y)).toBe('supporting')
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y)).toBe('core')
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X + 0.01, DISTILLATION_CORE_MIN_Y)).toBe('core')
    })

    it(`should handle y=${DISTILLATION_CORE_MIN_Y} boundary correctly for high x`, () => {
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y - 0.01)).toBe('supporting')
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y)).toBe('core')
      expect(classifyFromDistillationPosition(DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y + 0.01)).toBe('core')
    })

    it('should handle extreme values', () => {
      expect(classifyFromDistillationPosition(0, 0)).toBe('generic')
      expect(classifyFromDistillationPosition(0, 100)).toBe('generic')
      expect(classifyFromDistillationPosition(100, 0)).toBe('supporting')
      expect(classifyFromDistillationPosition(100, 100)).toBe('core')
    })
  })
})

describe('classifyFromStrategicPosition', () => {
  describe(`genesis classification (x < ${STRATEGIC_GENESIS_MAX_X})`, () => {
    it('should classify as genesis at x=0', () => {
      expect(classifyFromStrategicPosition(0)).toBe('genesis')
    })

    it(`should classify as genesis at x=${STRATEGIC_GENESIS_MAX_X - 1}`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_GENESIS_MAX_X - 1)).toBe('genesis')
    })

    it(`should classify as genesis at boundary x=${STRATEGIC_GENESIS_MAX_X - 0.1}`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_GENESIS_MAX_X - 0.1)).toBe('genesis')
    })
  })

  describe(`custom-built classification (${STRATEGIC_GENESIS_MAX_X} <= x < ${STRATEGIC_CUSTOM_BUILT_MAX_X})`, () => {
    it(`should classify as custom-built at x=${STRATEGIC_GENESIS_MAX_X}`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_GENESIS_MAX_X)).toBe('custom-built')
    })

    it('should classify as custom-built at x=37', () => {
      expect(classifyFromStrategicPosition(37)).toBe('custom-built')
    })

    it(`should classify as custom-built at boundary x=${STRATEGIC_CUSTOM_BUILT_MAX_X - 0.1}`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_CUSTOM_BUILT_MAX_X - 0.1)).toBe('custom-built')
    })
  })

  describe(`product/rental classification (${STRATEGIC_CUSTOM_BUILT_MAX_X} <= x < ${STRATEGIC_PRODUCT_RENTAL_MAX_X})`, () => {
    it(`should classify as product/rental at x=${STRATEGIC_CUSTOM_BUILT_MAX_X}`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_CUSTOM_BUILT_MAX_X)).toBe('product/rental')
    })

    it('should classify as product/rental at x=62', () => {
      expect(classifyFromStrategicPosition(62)).toBe('product/rental')
    })

    it(`should classify as product/rental at boundary x=${STRATEGIC_PRODUCT_RENTAL_MAX_X - 0.1}`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_PRODUCT_RENTAL_MAX_X - 0.1)).toBe('product/rental')
    })
  })

  describe(`commodity/utility classification (x >= ${STRATEGIC_PRODUCT_RENTAL_MAX_X})`, () => {
    it(`should classify as commodity/utility at x=${STRATEGIC_PRODUCT_RENTAL_MAX_X}`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_PRODUCT_RENTAL_MAX_X)).toBe('commodity/utility')
    })

    it('should classify as commodity/utility at x=87', () => {
      expect(classifyFromStrategicPosition(87)).toBe('commodity/utility')
    })

    it('should classify as commodity/utility at x=100', () => {
      expect(classifyFromStrategicPosition(100)).toBe('commodity/utility')
    })
  })

  describe('boundary conditions', () => {
    it(`should handle x=${STRATEGIC_GENESIS_MAX_X} boundary correctly`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_GENESIS_MAX_X - 0.01)).toBe('genesis')
      expect(classifyFromStrategicPosition(STRATEGIC_GENESIS_MAX_X)).toBe('custom-built')
      expect(classifyFromStrategicPosition(STRATEGIC_GENESIS_MAX_X + 0.01)).toBe('custom-built')
    })

    it(`should handle x=${STRATEGIC_CUSTOM_BUILT_MAX_X} boundary correctly`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_CUSTOM_BUILT_MAX_X - 0.01)).toBe('custom-built')
      expect(classifyFromStrategicPosition(STRATEGIC_CUSTOM_BUILT_MAX_X)).toBe('product/rental')
      expect(classifyFromStrategicPosition(STRATEGIC_CUSTOM_BUILT_MAX_X + 0.01)).toBe('product/rental')
    })

    it(`should handle x=${STRATEGIC_PRODUCT_RENTAL_MAX_X} boundary correctly`, () => {
      expect(classifyFromStrategicPosition(STRATEGIC_PRODUCT_RENTAL_MAX_X - 0.01)).toBe('product/rental')
      expect(classifyFromStrategicPosition(STRATEGIC_PRODUCT_RENTAL_MAX_X)).toBe('commodity/utility')
      expect(classifyFromStrategicPosition(STRATEGIC_PRODUCT_RENTAL_MAX_X + 0.01)).toBe('commodity/utility')
    })

    it('should handle extreme values', () => {
      expect(classifyFromStrategicPosition(0)).toBe('genesis')
      expect(classifyFromStrategicPosition(100)).toBe('commodity/utility')
    })
  })
})
