import { describe, it, expect } from 'vitest'
import {
  calculateBoundingBox,
  translateContextsToRelative,
  calculateBlobPosition,
  type ContextWithSize
} from './blobPositioning'
import { type BlobMetadata } from './blobShape'

describe('blobPositioning', () => {
  describe('calculateBoundingBox', () => {
    it('REAL DATA: Fulfillment & Shipping contexts', () => {
      // Real data from ACME E-Commerce demo project
      // React Flow positions nodes by their TOP-LEFT corner
      const contexts: ContextWithSize[] = [
        { x: 700, y: 550, width: 200, height: 120 },   // Inventory Management
        { x: 1400, y: 400, width: 240, height: 140 },  // Warehouse Management System
        { x: 1500, y: 600, width: 170, height: 100 }   // Shipping Integration
      ]

      const result = calculateBoundingBox(contexts)

      // Inventory: L=700, R=900 (700+200), T=550, B=670 (550+120)
      // Warehouse: L=1400, R=1640 (1400+240), T=400, B=540 (400+140)
      // Shipping: L=1500, R=1670 (1500+170), T=600, B=700 (600+100)
      expect(result).toEqual({
        minX: 700,   // min(700, 1400, 1500) = 700
        maxX: 1670,  // max(900, 1640, 1670) = 1670
        minY: 400,   // min(550, 400, 600) = 400
        maxY: 700    // max(670, 540, 700) = 700
      })
    })

    it('calculates correct bounding box for single context', () => {
      const contexts: ContextWithSize[] = [
        { x: 100, y: 200, width: 50, height: 30 }
      ]

      const result = calculateBoundingBox(contexts)

      expect(result).toEqual({
        minX: 100,  // x (top-left)
        maxX: 150,  // x + width
        minY: 200,  // y (top-left)
        maxY: 230   // y + height
      })
    })

    it('calculates correct bounding box for multiple contexts', () => {
      const contexts: ContextWithSize[] = [
        { x: 100, y: 200, width: 50, height: 30 },
        { x: 300, y: 400, width: 80, height: 60 }
      ]

      const result = calculateBoundingBox(contexts)

      expect(result).toEqual({
        minX: 100, // min(100, 300) = 100
        maxX: 380, // max(100+50, 300+80) = max(150, 380) = 380
        minY: 200, // min(200, 400) = 200
        maxY: 460  // max(200+30, 400+60) = max(230, 460) = 460
      })
    })
  })

  describe('translateContextsToRelative', () => {
    it('translates contexts to relative coordinates', () => {
      const contexts: ContextWithSize[] = [
        { x: 100, y: 200, width: 50, height: 30 },
        { x: 300, y: 400, width: 80, height: 60 }
      ]
      const boundingBox = { minX: 100, maxX: 380, minY: 200, maxY: 460 }

      const result = translateContextsToRelative(contexts, boundingBox)

      expect(result).toEqual([
        { x: 0, y: 0, width: 50, height: 30 },      // (100-100, 200-200)
        { x: 200, y: 200, width: 80, height: 60 }   // (300-100, 400-200)
      ])
    })
  })

  describe('calculateBlobPosition', () => {
    it('REAL DATA: Fulfillment & Shipping group from actual console output', () => {
      // Real data from console
      const contexts: ContextWithSize[] = [
        { x: 700, y: 550, width: 200, height: 120 },   // Inventory
        { x: 1400, y: 400, width: 240, height: 140 },  // Warehouse
        { x: 1500, y: 600, width: 170, height: 100 }   // Shipping
      ]
      const boundingBox = { minX: 700, maxX: 1670, minY: 400, maxY: 700 }

      // From console: "pathMinX=-180.803, pathMaxX=1165.712"
      const blobMetadata: BlobMetadata = {
        path: 'M 0 0 ...', // Path was translated to (0,0) for SVG rendering
        translateX: 180.803,
        translateY: 181.248,
        bounds: {
          minX: -180.803,  // ORIGINAL bounds in relative space (before translation)
          maxX: 1165.712,
          minY: -181.248,
          maxY: 501.907
        }
      }

      const result = calculateBlobPosition(contexts, blobMetadata, boundingBox)

      // Container top-left at (700 + (-180.803), 400 + (-181.248)) = (519.197, 218.752)
      expect(result.containerX).toBeCloseTo(519.197, 2)
      expect(result.containerY).toBeCloseTo(218.752, 2)
      expect(result.containerWidth).toBeCloseTo(1346.515, 2) // 1165.712 - (-180.803)
      expect(result.containerHeight).toBeCloseTo(683.155, 2) // 501.907 - (-181.248)

      // CRITICAL: Verify that contexts align correctly with blob
      // Inventory at absolute (700, 550) in relative coords: (700 - 700, 550 - 400) = (0, 150)
      // In blob coordinate space (before SVG translation): (0 - (-180.803), 150 - (-181.248)) = (180.803, 331.248)
      // After SVG translation by (-180.803, -181.248), this becomes: (180.803, 331.248) in the SVG
      // When blob container is positioned at (519.197, 218.752):
      // SVG point (180.803, 331.248) appears at canvas (519.197 + 180.803, 218.752 + 331.248) = (700, 550) ✓
    })

    it('positions blob container correctly when blob has negative bounds (padding)', () => {
      const contexts: ContextWithSize[] = [
        { x: 100, y: 200, width: 50, height: 30 }
      ]
      const boundingBox = { minX: 100, maxX: 150, minY: 200, maxY: 230 }

      // Relative context at (0, 0) with size (50, 30)
      // Blob wraps with padding, extends from -60 to 110 in relative X (padding causes negative)
      const blobMetadata: BlobMetadata = {
        path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z', // Translated to (0,0)
        translateX: 60,  // We translated by +60 to move -60 to 0
        translateY: 45,
        bounds: {
          minX: -60,  // ORIGINAL bounds (before translation)
          maxX: 110,
          minY: -45,
          maxY: 75
        }
      }

      const result = calculateBlobPosition(contexts, blobMetadata, boundingBox)

      // Container top-left at (100 + (-60), 200 + (-45)) = (40, 155)
      expect(result.containerX).toBe(40)
      expect(result.containerY).toBe(155)
      expect(result.containerWidth).toBe(170) // 110 - (-60)
      expect(result.containerHeight).toBe(120) // 75 - (-45)
    })

    it('positions blob correctly with multiple contexts', () => {
      const contexts: ContextWithSize[] = [
        { x: 1000, y: 2000, width: 100, height: 80 },
        { x: 1200, y: 2100, width: 100, height: 80 }
      ]
      const boundingBox = { minX: 1000, maxX: 1300, minY: 2000, maxY: 2180 }

      // Relative contexts at (0, 0) and (200, 100)
      // With padding, blob might extend from -40 to 340 in X, -30 to 230 in Y
      const blobMetadata: BlobMetadata = {
        path: 'M 0 0 L 380 0 L 380 260 L 0 260 Z',
        translateX: 40,
        translateY: 30,
        bounds: {
          minX: -40,
          maxX: 340,
          minY: -30,
          maxY: 230
        }
      }

      const result = calculateBlobPosition(contexts, blobMetadata, boundingBox)

      expect(result.containerX).toBe(960)  // 1000 + (-40)
      expect(result.containerY).toBe(1970) // 2000 + (-30)
      expect(result.containerWidth).toBe(380)
      expect(result.containerHeight).toBe(260)
    })
  })
})
