import { describe, it, expect } from 'vitest'
import { classifyFromDistillationPosition, classifyFromStrategicPosition } from './classification'

describe('classifyFromDistillationPosition', () => {
  describe('generic classification (x < 33)', () => {
    it('should classify as generic at x=0', () => {
      expect(classifyFromDistillationPosition(0, 50)).toBe('generic')
    })

    it('should classify as generic at x=32', () => {
      expect(classifyFromDistillationPosition(32, 50)).toBe('generic')
    })

    it('should classify as generic at boundary x=32.9', () => {
      expect(classifyFromDistillationPosition(32.9, 50)).toBe('generic')
    })

    it('should classify as generic regardless of y value', () => {
      expect(classifyFromDistillationPosition(20, 0)).toBe('generic')
      expect(classifyFromDistillationPosition(20, 50)).toBe('generic')
      expect(classifyFromDistillationPosition(20, 100)).toBe('generic')
    })
  })

  describe('core classification (x >= 67 && y >= 50)', () => {
    it('should classify as core at x=67, y=50', () => {
      expect(classifyFromDistillationPosition(67, 50)).toBe('core')
    })

    it('should classify as core at x=100, y=100', () => {
      expect(classifyFromDistillationPosition(100, 100)).toBe('core')
    })

    it('should classify as core at x=80, y=75', () => {
      expect(classifyFromDistillationPosition(80, 75)).toBe('core')
    })

    it('should NOT classify as core if y < 50', () => {
      expect(classifyFromDistillationPosition(67, 49)).toBe('supporting')
      expect(classifyFromDistillationPosition(100, 0)).toBe('supporting')
    })

    it('should NOT classify as core if x < 67', () => {
      expect(classifyFromDistillationPosition(66, 50)).toBe('supporting')
      expect(classifyFromDistillationPosition(66, 100)).toBe('supporting')
    })
  })

  describe('supporting classification (middle + bottom-right)', () => {
    it('should classify as supporting at x=33, y=50', () => {
      expect(classifyFromDistillationPosition(33, 50)).toBe('supporting')
    })

    it('should classify as supporting at x=50, y=25', () => {
      expect(classifyFromDistillationPosition(50, 25)).toBe('supporting')
    })

    it('should classify as supporting at x=66, y=75', () => {
      expect(classifyFromDistillationPosition(66, 75)).toBe('supporting')
    })

    it('should classify as supporting at x=67, y=49', () => {
      expect(classifyFromDistillationPosition(67, 49)).toBe('supporting')
    })

    it('should classify as supporting in middle range', () => {
      expect(classifyFromDistillationPosition(40, 30)).toBe('supporting')
      expect(classifyFromDistillationPosition(50, 60)).toBe('supporting')
    })
  })

  describe('boundary conditions', () => {
    it('should handle x=33 boundary correctly', () => {
      expect(classifyFromDistillationPosition(32.99, 50)).toBe('generic')
      expect(classifyFromDistillationPosition(33, 50)).toBe('supporting')
      expect(classifyFromDistillationPosition(33.01, 50)).toBe('supporting')
    })

    it('should handle x=67 boundary correctly', () => {
      expect(classifyFromDistillationPosition(66.99, 50)).toBe('supporting')
      expect(classifyFromDistillationPosition(67, 50)).toBe('core')
      expect(classifyFromDistillationPosition(67.01, 50)).toBe('core')
    })

    it('should handle y=50 boundary correctly for high x', () => {
      expect(classifyFromDistillationPosition(67, 49.99)).toBe('supporting')
      expect(classifyFromDistillationPosition(67, 50)).toBe('core')
      expect(classifyFromDistillationPosition(67, 50.01)).toBe('core')
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
  describe('genesis classification (x < 25)', () => {
    it('should classify as genesis at x=0', () => {
      expect(classifyFromStrategicPosition(0)).toBe('genesis')
    })

    it('should classify as genesis at x=24', () => {
      expect(classifyFromStrategicPosition(24)).toBe('genesis')
    })

    it('should classify as genesis at boundary x=24.9', () => {
      expect(classifyFromStrategicPosition(24.9)).toBe('genesis')
    })
  })

  describe('custom-built classification (25 <= x < 50)', () => {
    it('should classify as custom-built at x=25', () => {
      expect(classifyFromStrategicPosition(25)).toBe('custom-built')
    })

    it('should classify as custom-built at x=37', () => {
      expect(classifyFromStrategicPosition(37)).toBe('custom-built')
    })

    it('should classify as custom-built at boundary x=49.9', () => {
      expect(classifyFromStrategicPosition(49.9)).toBe('custom-built')
    })
  })

  describe('product/rental classification (50 <= x < 75)', () => {
    it('should classify as product/rental at x=50', () => {
      expect(classifyFromStrategicPosition(50)).toBe('product/rental')
    })

    it('should classify as product/rental at x=62', () => {
      expect(classifyFromStrategicPosition(62)).toBe('product/rental')
    })

    it('should classify as product/rental at boundary x=74.9', () => {
      expect(classifyFromStrategicPosition(74.9)).toBe('product/rental')
    })
  })

  describe('commodity/utility classification (x >= 75)', () => {
    it('should classify as commodity/utility at x=75', () => {
      expect(classifyFromStrategicPosition(75)).toBe('commodity/utility')
    })

    it('should classify as commodity/utility at x=87', () => {
      expect(classifyFromStrategicPosition(87)).toBe('commodity/utility')
    })

    it('should classify as commodity/utility at x=100', () => {
      expect(classifyFromStrategicPosition(100)).toBe('commodity/utility')
    })
  })

  describe('boundary conditions', () => {
    it('should handle x=25 boundary correctly', () => {
      expect(classifyFromStrategicPosition(24.99)).toBe('genesis')
      expect(classifyFromStrategicPosition(25)).toBe('custom-built')
      expect(classifyFromStrategicPosition(25.01)).toBe('custom-built')
    })

    it('should handle x=50 boundary correctly', () => {
      expect(classifyFromStrategicPosition(49.99)).toBe('custom-built')
      expect(classifyFromStrategicPosition(50)).toBe('product/rental')
      expect(classifyFromStrategicPosition(50.01)).toBe('product/rental')
    })

    it('should handle x=75 boundary correctly', () => {
      expect(classifyFromStrategicPosition(74.99)).toBe('product/rental')
      expect(classifyFromStrategicPosition(75)).toBe('commodity/utility')
      expect(classifyFromStrategicPosition(75.01)).toBe('commodity/utility')
    })

    it('should handle extreme values', () => {
      expect(classifyFromStrategicPosition(0)).toBe('genesis')
      expect(classifyFromStrategicPosition(100)).toBe('commodity/utility')
    })
  })
})
