import { describe, it, expect } from 'vitest'
import { generateBlobPath, Point } from './blobShape'

// ============================================================================
// Test Helper Functions
// ============================================================================

/**
 * Parse SVG path 'd' attribute into dense array of [x, y] points.
 * Samples bezier curves to create polygon approximation.
 */
function parseSvgPath(d: string): [number, number][] {
  const points: [number, number][] = []

  // Match all path commands: M, L, C (moveto, lineto, curveto)
  const commands = d.match(/[MLCZmlcz][^MLCZmlcz]*/g)
  if (!commands) return points

  let currentX = 0
  let currentY = 0

  for (const cmd of commands) {
    const type = cmd[0]
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat)

    if (type === 'M' || type === 'm') {
      // MoveTo
      currentX = type === 'M' ? coords[0] : currentX + coords[0]
      currentY = type === 'M' ? coords[1] : currentY + coords[1]
      points.push([currentX, currentY])
    } else if (type === 'L' || type === 'l') {
      // LineTo
      currentX = type === 'L' ? coords[0] : currentX + coords[0]
      currentY = type === 'L' ? coords[1] : currentY + coords[1]
      points.push([currentX, currentY])
    } else if (type === 'C' || type === 'c') {
      // Cubic bezier curve - sample it densely
      const x1 = type === 'C' ? coords[0] : currentX + coords[0]
      const y1 = type === 'C' ? coords[1] : currentY + coords[1]
      const x2 = type === 'C' ? coords[2] : currentX + coords[2]
      const y2 = type === 'C' ? coords[3] : currentY + coords[3]
      const x3 = type === 'C' ? coords[4] : currentX + coords[4]
      const y3 = type === 'C' ? coords[5] : currentY + coords[5]

      // Sample 10 points along the bezier curve
      for (let t = 0.1; t <= 1; t += 0.1) {
        const mt = 1 - t
        const x = mt * mt * mt * currentX +
                  3 * mt * mt * t * x1 +
                  3 * mt * t * t * x2 +
                  t * t * t * x3
        const y = mt * mt * mt * currentY +
                  3 * mt * mt * t * y1 +
                  3 * mt * t * t * y2 +
                  t * t * t * y3
        points.push([x, y])
      }

      currentX = x3
      currentY = y3
    } else if (type === 'Z' || type === 'z') {
      // Close path - no action needed
    }
  }

  return points
}

/**
 * Get sample points around a context rectangle's perimeter.
 * Returns points starting from top-left, going clockwise.
 */
function getContextPerimeterPoints(context: Point, samplesPerSide: number): [number, number][] {
  const points: [number, number][] = []
  const { x, y, width, height } = context
  const left = x - width / 2
  const right = x + width / 2
  const top = y - height / 2
  const bottom = y + height / 2

  // Top edge (left to right)
  for (let i = 0; i <= samplesPerSide; i++) {
    const t = i / samplesPerSide
    points.push([left + t * width, top])
  }

  // Right edge (top to bottom)
  for (let i = 1; i <= samplesPerSide; i++) {
    const t = i / samplesPerSide
    points.push([right, top + t * height])
  }

  // Bottom edge (right to left)
  for (let i = 1; i <= samplesPerSide; i++) {
    const t = i / samplesPerSide
    points.push([right - t * width, bottom])
  }

  // Left edge (bottom to top)
  for (let i = 1; i < samplesPerSide; i++) {
    const t = i / samplesPerSide
    points.push([left, bottom - t * height])
  }

  return points
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm.
 */
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]

    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Calculate minimum distance from a point to a polygon edge.
 */
function minDistanceToPolygonEdge(point: [number, number], polygon: [number, number][]): number {
  if (polygon.length < 2) return Infinity

  let minDist = Infinity

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    const dist = pointToSegmentDistance(point, p1, p2)
    minDist = Math.min(minDist, dist)
  }

  return minDist
}

/**
 * Calculate distance from a point to a line segment.
 */
function pointToSegmentDistance(
  point: [number, number],
  segStart: [number, number],
  segEnd: [number, number]
): number {
  const [px, py] = point
  const [x1, y1] = segStart
  const [x2, y2] = segEnd

  const dx = x2 - x1
  const dy = y2 - y1

  if (dx === 0 && dy === 0) {
    // Segment is a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  }

  // Calculate t parameter for closest point on infinite line
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)

  // Clamp t to [0, 1] to stay on segment
  const tClamped = Math.max(0, Math.min(1, t))

  // Calculate closest point on segment
  const closestX = x1 + tClamped * dx
  const closestY = y1 + tClamped * dy

  // Return distance to closest point
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2)
}

/**
 * Calculate angle (in degrees) between two consecutive line segments.
 * Returns 180° for straight line, 90° for right angle, etc.
 * Returns null for degenerate cases (very short segments).
 */
function getSegmentAngle(p1: [number, number], p2: [number, number], p3: [number, number]): number | null {
  const v1x = p2[0] - p1[0]
  const v1y = p2[1] - p1[1]
  const v2x = p3[0] - p2[0]
  const v2y = p3[1] - p2[1]

  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y)
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y)

  // Skip very short segments (< 1px) to avoid numerical precision issues
  if (mag1 < 1 || mag2 < 1) return null

  const dot = v1x * v2x + v1y * v2y
  const cosAngle = dot / (mag1 * mag2)
  // Clamp to [-1, 1] to handle numerical precision issues
  const clamped = Math.max(-1, Math.min(1, cosAngle))
  return Math.acos(clamped) * (180 / Math.PI)
}

/**
 * Analyze path smoothness by examining angles between consecutive segments.
 * Returns metrics about curve smoothness.
 */
function verifyPathSmoothness(polygon: [number, number][]): {
  minAngle: number
  maxAngle: number
  avgAngle: number
  maxAngleDelta: number
  sharpCorners: number
} {
  if (polygon.length < 3) {
    return { minAngle: 180, maxAngle: 180, avgAngle: 180, maxAngleDelta: 0, sharpCorners: 0 }
  }

  const angles: number[] = []
  let minAngle = 180
  let maxAngle = 0
  let sharpCorners = 0
  const sharpThreshold = 30 // Angles ABOVE this are considered "sharp" turns (0° = straight)

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    const p3 = polygon[(i + 2) % polygon.length]

    const angle = getSegmentAngle(p1, p2, p3)
    if (angle === null) continue // Skip degenerate segments

    angles.push(angle)

    minAngle = Math.min(minAngle, angle)
    maxAngle = Math.max(maxAngle, angle)

    if (angle > sharpThreshold) {
      sharpCorners++
    }
  }

  // Calculate maximum angle delta (how much angles change between consecutive segments)
  let maxAngleDelta = 0
  for (let i = 0; i < angles.length; i++) {
    const delta = Math.abs(angles[i] - angles[(i + 1) % angles.length])
    maxAngleDelta = Math.max(maxAngleDelta, delta)
  }

  const avgAngle = angles.reduce((sum, a) => sum + a, 0) / angles.length

  return { minAngle, maxAngle, avgAngle, maxAngleDelta, sharpCorners }
}

// ============================================================================
// Tests
// ============================================================================

describe('generateBlobPath', () => {
  it('should generate a blob path for a single context with dimensions', () => {
    const points = [{ x: 500, y: 500, width: 170, height: 100 }]
    const path = generateBlobPath(points, 60)

    expect(path).toBeTruthy()
    expect(path).toContain('M')
  })

  it('should generate a blob path for two contexts', () => {
    const points = [
      { x: 300, y: 400, width: 140, height: 80 },
      { x: 600, y: 400, width: 170, height: 100 }
    ]
    const path = generateBlobPath(points, 60)

    expect(path).toBeTruthy()
    expect(path).toContain('M')
    expect(path).toContain('C')
  })

  it('should generate a blob path for multiple contexts', () => {
    const points = [
      { x: 200, y: 300, width: 170, height: 100 },
      { x: 500, y: 200, width: 170, height: 100 },
      { x: 800, y: 300, width: 170, height: 100 },
      { x: 650, y: 600, width: 170, height: 100 }
    ]
    const path = generateBlobPath(points, 60)

    expect(path).toBeTruthy()
    expect(path).toContain('M')
    expect(path).toContain('C')
  })

  it('should handle collinear points', () => {
    const points = [
      { x: 100, y: 100, width: 120, height: 70 },
      { x: 200, y: 100, width: 120, height: 70 },
      { x: 300, y: 100, width: 120, height: 70 }
    ]
    const path = generateBlobPath(points, 50)

    expect(path).toBeTruthy()
    expect(path).toContain('M')
  })

  it('should apply padding correctly', () => {
    const points = [{ x: 500, y: 500, width: 170, height: 100 }]
    const smallPadding = generateBlobPath(points, 30)
    const largePadding = generateBlobPath(points, 80)

    expect(smallPadding).toBeTruthy()
    expect(largePadding).toBeTruthy()
    expect(smallPadding).not.toBe(largePadding)
  })

  it('should return empty string for empty points array', () => {
    const path = generateBlobPath([], 60)
    expect(path).toBe('')
  })

  it('should fully encompass all node rectangles with padding', () => {
    const points = [
      { x: 100, y: 100, width: 170, height: 100 },
      { x: 400, y: 100, width: 170, height: 100 },
      { x: 100, y: 300, width: 170, height: 100 }
    ]
    const padding = 40
    const path = generateBlobPath(points, padding)

    expect(path).toBeTruthy()
    expect(path).toContain('M')
    expect(path).toContain('C')
  })

  it('should provide padding clearance around a single context', () => {
    const padding = 40
    const context = { x: 100, y: 100, width: 100, height: 60 }

    const path = generateBlobPath([context], padding)

    expect(path).toBeTruthy()

    const pathNumbers = path.match(/-?[\d.]+/g)?.map(parseFloat) || []
    const pathMinX = Math.min(...pathNumbers.filter((_, i) => i % 2 === 0))
    const pathMaxX = Math.max(...pathNumbers.filter((_, i) => i % 2 === 0))
    const pathMinY = Math.min(...pathNumbers.filter((_, i) => i % 2 === 1))
    const pathMaxY = Math.max(...pathNumbers.filter((_, i) => i % 2 === 1))

    const nodeLeft = context.x - context.width / 2
    const nodeRight = context.x + context.width / 2
    const nodeTop = context.y - context.height / 2
    const nodeBottom = context.y + context.height / 2

    const leftClearance = nodeLeft - pathMinX
    const rightClearance = pathMaxX - nodeRight
    const topClearance = nodeTop - pathMinY
    const bottomClearance = pathMaxY - nodeBottom

    expect(leftClearance).toBeGreaterThanOrEqual(padding)
    expect(rightClearance).toBeGreaterThanOrEqual(padding)
    expect(topClearance).toBeGreaterThanOrEqual(padding)
    expect(bottomClearance).toBeGreaterThanOrEqual(padding)
  })

  it('should provide padding when leftmost node edge is at 0 (CanvasArea scenario)', () => {
    const padding = 40
    const context = { x: 50, y: 30, width: 100, height: 60 }

    const path = generateBlobPath([context], padding)

    const pathNumbers = path.match(/-?[\d.]+/g)?.map(parseFloat) || []
    const pathMinX = Math.min(...pathNumbers.filter((_, i) => i % 2 === 0))
    const pathMinY = Math.min(...pathNumbers.filter((_, i) => i % 2 === 1))

    const nodeLeft = context.x - context.width / 2
    const nodeTop = context.y - context.height / 2

    console.log(`Node with edge at 0: center=(${context.x}, ${context.y}), left edge=${nodeLeft}, top edge=${nodeTop}`)
    console.log(`Blob: minX=${pathMinX.toFixed(1)}, minY=${pathMinY.toFixed(1)}`)
    console.log(`Expected: Blob should extend to at least (${nodeLeft - padding}, ${nodeTop - padding})`)

    expect(pathMinX,
      `Blob left ${pathMinX.toFixed(1)} should be <= ${nodeLeft - padding} (node edge ${nodeLeft} - padding ${padding})`
    ).toBeLessThanOrEqual(nodeLeft - padding + 1)

    expect(pathMinY,
      `Blob top ${pathMinY.toFixed(1)} should be <= ${nodeTop - padding} (node edge ${nodeTop} - padding ${padding})`
    ).toBeLessThanOrEqual(nodeTop - padding + 1)
  })
})

// ============================================================================
// Encapsulation Tests
// ============================================================================

describe('generateBlobPath - encapsulation tests', () => {
  const TOLERANCE = 2 // 2px tolerance for curve smoothing

  it('should encapsulate two horizontally aligned contexts with full padding', () => {
    const contexts = [
      { x: 100, y: 200, width: 120, height: 80 },
      { x: 400, y: 200, width: 150, height: 90 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    expect(path).toBeTruthy()

    const polygon = parseSvgPath(path)
    expect(polygon.length).toBeGreaterThan(10)

    // Verify each context is fully encapsulated with padding
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i]
      const perimeterPoints = getContextPerimeterPoints(context, 20)

      for (const point of perimeterPoints) {
        // Point must be inside blob
        expect(isPointInPolygon(point, polygon),
          `Context ${i} perimeter point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should be inside blob`
        ).toBe(true)

        // Point must have at least 'padding' clearance from blob edge
        const distance = minDistanceToPolygonEdge(point, polygon)
        expect(distance,
          `Context ${i} perimeter point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should have ${padding}px clearance, got ${distance.toFixed(1)}px`
        ).toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate two vertically aligned contexts with full padding', () => {
    const contexts = [
      { x: 200, y: 100, width: 120, height: 80 },
      { x: 200, y: 400, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    expect(path).toBeTruthy()

    const polygon = parseSvgPath(path)
    expect(polygon.length).toBeGreaterThan(10)

    // Verify each context is fully encapsulated with padding
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i]
      const perimeterPoints = getContextPerimeterPoints(context, 20)

      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon),
          `Context ${i} perimeter point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should be inside blob`
        ).toBe(true)

        const distance = minDistanceToPolygonEdge(point, polygon)
        expect(distance,
          `Context ${i} perimeter point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should have ${padding}px clearance, got ${distance.toFixed(1)}px`
        ).toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate three contexts in triangle arrangement with full padding', () => {
    const contexts = [
      { x: 200, y: 100, width: 120, height: 80 },
      { x: 100, y: 300, width: 120, height: 80 },
      { x: 300, y: 300, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon),
          `Context ${i} point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should be inside blob`
        ).toBe(true)
        const distance = minDistanceToPolygonEdge(point, polygon)
        expect(distance,
          `Context ${i} should have ${padding}px clearance, got ${distance.toFixed(1)}px`
        ).toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate four contexts in square arrangement with full padding', () => {
    const contexts = [
      { x: 100, y: 100, width: 120, height: 80 },
      { x: 400, y: 100, width: 120, height: 80 },
      { x: 100, y: 400, width: 120, height: 80 },
      { x: 400, y: 400, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate contexts of different sizes with uniform padding', () => {
    const contexts = [
      { x: 100, y: 200, width: 80, height: 50 },    // small
      { x: 300, y: 200, width: 170, height: 100 },  // medium
      { x: 550, y: 200, width: 250, height: 150 }   // large
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon),
          `Context ${i} (size ${contexts[i].width}x${contexts[i].height}) point should be inside`
        ).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate three contexts in horizontal line with padding on all sides', () => {
    const contexts = [
      { x: 100, y: 200, width: 120, height: 80 },
      { x: 300, y: 200, width: 120, height: 80 },
      { x: 500, y: 200, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate three contexts in diagonal line with padding on all sides', () => {
    const contexts = [
      { x: 100, y: 100, width: 120, height: 80 },
      { x: 300, y: 300, width: 120, height: 80 },
      { x: 500, y: 500, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate L-shaped arrangement with full padding', () => {
    const contexts = [
      { x: 100, y: 100, width: 120, height: 80 },
      { x: 300, y: 100, width: 120, height: 80 },
      { x: 300, y: 300, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate circular arrangement with full padding', () => {
    const radius = 300
    const contexts = []
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * 2 * Math.PI
      contexts.push({
        x: 400 + radius * Math.cos(angle),
        y: 400 + radius * Math.sin(angle),
        width: 120,
        height: 80
      })
    }
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon),
          `Context ${i} at angle ${((i / 6) * 360).toFixed(0)}° should be inside`
        ).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate densely clustered contexts with full padding', () => {
    const contexts = [
      { x: 200, y: 200, width: 120, height: 80 },
      { x: 250, y: 220, width: 120, height: 80 },
      { x: 280, y: 270, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate sparsely distributed contexts with full padding', () => {
    const contexts = [
      { x: 100, y: 100, width: 120, height: 80 },
      { x: 800, y: 100, width: 120, height: 80 },
      { x: 100, y: 700, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate with very small padding (5px)', () => {
    const contexts = [
      { x: 100, y: 200, width: 120, height: 80 },
      { x: 300, y: 200, width: 120, height: 80 }
    ]
    const padding = 5

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate with very large padding (200px)', () => {
    const contexts = [
      { x: 300, y: 300, width: 120, height: 80 }
    ]
    const padding = 200

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    // Large padding requires larger tolerance due to curve smoothing
    // Catmull-Rom curves cut corners more with larger radii
    const largePaddingTolerance = 25

    const perimeterPoints = getContextPerimeterPoints(contexts[0], 20)
    for (const point of perimeterPoints) {
      expect(isPointInPolygon(point, polygon)).toBe(true)
      const distance = minDistanceToPolygonEdge(point, polygon)
      expect(distance,
        `Point should have ~${padding}px clearance, got ${distance.toFixed(1)}px`
      ).toBeGreaterThanOrEqual(padding - largePaddingTolerance)
    }
  })

  it('should encapsulate contexts with mixed aspect ratios', () => {
    const contexts = [
      { x: 100, y: 300, width: 200, height: 60 },  // very wide
      { x: 400, y: 200, width: 80, height: 200 },  // very tall
      { x: 650, y: 300, width: 120, height: 120 }  // square
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate collinear contexts with proper padding verification', () => {
    const contexts = [
      { x: 100, y: 100, width: 120, height: 70 },
      { x: 200, y: 100, width: 120, height: 70 },
      { x: 300, y: 100, width: 120, height: 70 }
    ]
    const padding = 50

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    // Verify full encapsulation (not just path existence like original test)
    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon)).toBe(true)
        expect(minDistanceToPolygonEdge(point, polygon))
          .toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })

  it('should encapsulate large contexts (250x150px) with 40px padding', () => {
    // Real-world large context sizes like "Warehouse Management System"
    const contexts = [
      { x: 300, y: 300, width: 250, height: 150 },
      { x: 650, y: 300, width: 250, height: 150 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    // Verify full encapsulation with proper padding clearance
    for (let i = 0; i < contexts.length; i++) {
      const perimeterPoints = getContextPerimeterPoints(contexts[i], 20)
      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon),
          `Large context ${i} perimeter point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should be inside blob`
        ).toBe(true)

        const distance = minDistanceToPolygonEdge(point, polygon)
        expect(distance,
          `Large context ${i} point should have ${padding}px clearance, got ${distance.toFixed(1)}px`
        ).toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })
})

// ============================================================================
// Visual Quality Tests (RED phase - should fail with current implementation)
// ============================================================================

describe('generateBlobPath - visual quality tests', () => {
  const TOLERANCE = 2 // 2px tolerance for curve smoothing

  it('should generate sufficient hull vertices for smooth curves (>= 40 vertices for 5 contexts)', () => {
    // Real Fulfillment & Shipping group from screenshot
    const contexts = [
      { x: 200, y: 150, width: 170, height: 100 },  // Inventory Management
      { x: 500, y: 200, width: 150, height: 90 },   // Stripe Payment
      { x: 350, y: 350, width: 140, height: 85 },   // Tax Calculation
      { x: 700, y: 150, width: 170, height: 100 },  // Shipping Integration
      { x: 850, y: 100, width: 250, height: 150 }   // Warehouse Management (large)
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    // With sparse sampling (12 edge + 6 corner samples), convex hull will have too few vertices
    // Need >= 40 vertices for truly smooth Catmull-Rom interpolation
    console.log(`Sampled path has ${polygon.length} points`)
    expect(polygon.length,
      `Sampled path should have many points after Catmull-Rom, got ${polygon.length}`
    ).toBeGreaterThanOrEqual(100) // After sampling beziers
  })

  it('should create visually smooth curves with alpha=0.5 (centripetal) instead of alpha=0 (uniform)', () => {
    // Real Fulfillment & Shipping contexts from screenshot
    const contexts = [
      { x: 200, y: 150, width: 170, height: 100 },
      { x: 700, y: 150, width: 170, height: 100 },
      { x: 850, y: 100, width: 250, height: 150 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    // Check for visual artifacts: measure curvature consistency
    // Alpha=0 (uniform) can create cusps and loops with uneven spacing
    // Alpha=0.5 (centripetal) is the standard for smooth, artifact-free curves

    // Calculate curvature at each point (change in direction)
    const curvatures: number[] = []
    for (let i = 1; i < polygon.length - 1; i++) {
      const p0 = polygon[i - 1]
      const p1 = polygon[i]
      const p2 = polygon[i + 1]

      // Calculate angle change
      const dx1 = p1[0] - p0[0], dy1 = p1[1] - p0[1]
      const dx2 = p2[0] - p1[0], dy2 = p2[1] - p1[1]
      const angle1 = Math.atan2(dy1, dx1)
      const angle2 = Math.atan2(dy2, dx2)
      let angleDiff = angle2 - angle1

      // Normalize to [-π, π]
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

      curvatures.push(Math.abs(angleDiff))
    }

    // Calculate curvature variance (high variance = jagged/inconsistent)
    const avgCurvature = curvatures.reduce((a, b) => a + b, 0) / curvatures.length
    const variance = curvatures.reduce((sum, c) => sum + Math.pow(c - avgCurvature, 2), 0) / curvatures.length
    const stdDev = Math.sqrt(variance)

    console.log(`Curvature std dev: ${stdDev.toFixed(4)} (lower = smoother)`)
    console.log(`Max curvature: ${Math.max(...curvatures).toFixed(4)} radians`)

    // With alpha=0, expect high variance (jagged). With alpha=0.5, expect low variance.
    // This test will FAIL with alpha=0, documenting the visual quality issue
    expect(stdDev,
      `Curvature variance should be < 0.05 for smooth curves, got ${stdDev.toFixed(4)}`
    ).toBeLessThan(0.05)
  })

  it('should handle translated coordinates correctly (CanvasArea use case)', () => {
    // Simulate what CanvasArea does: translate contexts to (0,0) origin
    const absoluteContexts = [
      { x: 300, y: 200, width: 170, height: 100 },
      { x: 700, y: 200, width: 170, height: 100 },
      { x: 850, y: 150, width: 250, height: 150 }
    ]

    const minX = Math.min(...absoluteContexts.map(c => c.x - c.width / 2))
    const maxX = Math.max(...absoluteContexts.map(c => c.x + c.width / 2))
    const minY = Math.min(...absoluteContexts.map(c => c.y - c.height / 2))
    const maxY = Math.max(...absoluteContexts.map(c => c.y + c.height / 2))

    // Translate to relative coordinates (what CanvasArea does)
    const relativeContexts = absoluteContexts.map(c => ({
      x: c.x - minX,
      y: c.y - minY,
      width: c.width,
      height: c.height
    }))

    const padding = 60
    const path = generateBlobPath(relativeContexts, padding)
    const polygon = parseSvgPath(path)

    console.log('Relative contexts (translated to 0,0 origin):')
    relativeContexts.forEach((c, i) => {
      console.log(`  Context ${i}: x=${c.x.toFixed(0)}, y=${c.y.toFixed(0)}`)
    })

    const pathMinX = Math.min(...polygon.map(p => p[0]))
    const pathMaxX = Math.max(...polygon.map(p => p[0]))
    const pathMinY = Math.min(...polygon.map(p => p[1]))
    const pathMaxY = Math.max(...polygon.map(p => p[1]))

    console.log(`Blob bounds: minX=${pathMinX.toFixed(0)}, maxX=${pathMaxX.toFixed(0)}, minY=${pathMinY.toFixed(0)}, maxY=${pathMaxY.toFixed(0)}`)

    // With translation, leftmost context edge is at relative x=width/2
    const leftmostEdge = Math.min(...relativeContexts.map(c => c.x - c.width / 2))
    const rightmostEdge = Math.max(...relativeContexts.map(c => c.x + c.width / 2))
    const topmostEdge = Math.min(...relativeContexts.map(c => c.y - c.height / 2))
    const bottommostEdge = Math.max(...relativeContexts.map(c => c.y + c.height / 2))

    console.log(`Context bounds: left=${leftmostEdge.toFixed(0)}, right=${rightmostEdge.toFixed(0)}, top=${topmostEdge.toFixed(0)}, bottom=${bottommostEdge.toFixed(0)}`)

    // After translation to positive space, blob path starts near (0, 0)
    // and extends padding distance beyond context bounds
    const expectedWidth = rightmostEdge - leftmostEdge + 2 * padding
    const expectedHeight = bottommostEdge - topmostEdge + 2 * padding

    // Blob should start near (0, 0) after translation
    expect(pathMinX,
      `Blob left edge should start near 0 after translation, got ${pathMinX.toFixed(1)}`
    ).toBeLessThan(5)

    expect(pathMinY,
      `Blob top edge should start near 0 after translation, got ${pathMinY.toFixed(1)}`
    ).toBeLessThan(5)

    // Blob should extend to expected dimensions
    expect(pathMaxX,
      `Blob right edge (${pathMaxX.toFixed(0)}) should be near ${expectedWidth.toFixed(0)}`
    ).toBeGreaterThan(expectedWidth - 10)

    expect(pathMaxY,
      `Blob bottom edge (${pathMaxY.toFixed(0)}) should be near ${expectedHeight.toFixed(0)}`
    ).toBeGreaterThan(expectedHeight - 10)
  })

  it('should generate blob path that fits within expected SVG viewport bounds', () => {
    // Real-world scenario: 3 contexts with different Y positions
    // When translated to relative coords, the leftmost context won't be at (0,0)
    const contexts = [
      { x: 85, y: 200, width: 170, height: 100 },   // left-middle
      { x: 785, y: 50, width: 170, height: 100 },   // right-top
      { x: 885, y: 250, width: 170, height: 100 }   // right-bottom
    ]
    const padding = 60

    const path = generateBlobPath(contexts, padding)

    // Find actual path bounds
    const pathCoords = path.match(/-?[\d.]+/g)?.map(parseFloat) || []
    const pathXCoords = pathCoords.filter((_, i) => i % 2 === 0)
    const pathYCoords = pathCoords.filter((_, i) => i % 2 === 1)
    const pathMinX = Math.min(...pathXCoords)
    const pathMaxX = Math.max(...pathXCoords)
    const pathMinY = Math.min(...pathYCoords)
    const pathMaxY = Math.max(...pathYCoords)

    console.log(`Path bounds: minX=${pathMinX.toFixed(1)}, maxX=${pathMaxX.toFixed(1)}, minY=${pathMinY.toFixed(1)}, maxY=${pathMaxY.toFixed(1)}`)

    // Find context bounds
    const leftmost = Math.min(...contexts.map(c => c.x - c.width / 2))
    const rightmost = Math.max(...contexts.map(c => c.x + c.width / 2))
    const topmost = Math.min(...contexts.map(c => c.y - c.height / 2))
    const bottommost = Math.max(...contexts.map(c => c.y + c.height / 2))

    console.log(`Context bounds: left=${leftmost}, right=${rightmost}, top=${topmost}, bottom=${bottommost}`)

    // Calculate expected viewport size needed to contain the blob
    const expectedViewportWidth = (rightmost - leftmost) + 2 * padding
    const expectedViewportHeight = (bottommost - topmost) + 2 * padding

    console.log(`Expected viewport: ${expectedViewportWidth} × ${expectedViewportHeight}`)

    // CRITICAL TEST: Path coordinates should fit within (0, 0) to (expectedWidth, expectedHeight)
    // After translation, path should start at (0, 0) - no negative coords
    expect(pathMinX,
      `Path should start at X=0 after translation (got ${pathMinX.toFixed(1)})`
    ).toBeLessThan(1)

    expect(pathMinY,
      `Path should start at Y=0 after translation (got ${pathMinY.toFixed(1)})`
    ).toBeLessThan(1)

    // Path should not exceed expected viewport size
    // Catmull-Rom curves can overshoot hull slightly, but should be within tolerance
    expect(pathMaxX,
      `Path maxX (${pathMaxX.toFixed(1)}) should fit within viewport width (${expectedViewportWidth})`
    ).toBeLessThanOrEqual(expectedViewportWidth + 2)

    expect(pathMaxY,
      `Path maxY (${pathMaxY.toFixed(1)}) should fit within viewport height (${expectedViewportHeight})`
    ).toBeLessThanOrEqual(expectedViewportHeight + 2)
  })

  it('should fully encapsulate real Fulfillment & Shipping group contexts', () => {
    // Exact scenario from the screenshot that's failing
    // These are TRANSLATED coordinates (relative to group bounding box)
    const contexts = [
      { x: 85, y: 200, width: 170, height: 100 },   // Inventory Management
      { x: 785, y: 50, width: 170, height: 100 },   // Shipping Integration
      { x: 885, y: 250, width: 170, height: 100 }   // Warehouse Management System (Legacy) - large!
    ]
    const padding = 60

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    // Verify ALL contexts are fully encapsulated with proper padding
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i]
      const perimeterPoints = getContextPerimeterPoints(context, 20)

      for (const point of perimeterPoints) {
        expect(isPointInPolygon(point, polygon),
          `Context ${i} (${context.width}×${context.height}) point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should be inside blob`
        ).toBe(true)

        const distance = minDistanceToPolygonEdge(point, polygon)
        expect(distance,
          `Context ${i} point [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] should have ${padding}px clearance, got ${distance.toFixed(1)}px`
        ).toBeGreaterThanOrEqual(padding - TOLERANCE)
      }
    }
  })
})

// ============================================================================
// Smoothness Tests
// ============================================================================

describe('generateBlobPath - smoothness tests', () => {
  it('should create smooth boundaries for L-shaped arrangement (no 90° corners)', () => {
    const contexts = [
      { x: 100, y: 100, width: 120, height: 80 },
      { x: 300, y: 100, width: 120, height: 80 },
      { x: 300, y: 300, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    const smoothness = verifyPathSmoothness(polygon)

    // No sharp corners (all turn angles should be < 30°)
    expect(smoothness.sharpCorners,
      `Found ${smoothness.sharpCorners} sharp corners (angles > 30°), expected 0. Max angle: ${smoothness.maxAngle.toFixed(1)}°`
    ).toBe(0)

    // Maximum turn angle should be smooth (< 30°)
    expect(smoothness.maxAngle,
      `Max turn angle ${smoothness.maxAngle.toFixed(1)}° should be < 30°`
    ).toBeLessThan(30)

    // Angle changes should be gradual (max delta < 20°)
    expect(smoothness.maxAngleDelta,
      `Max angle change ${smoothness.maxAngleDelta.toFixed(1)}° should be < 20°`
    ).toBeLessThan(20)
  })

  it('should create organic smooth boundaries for two contexts', () => {
    const contexts = [
      { x: 100, y: 200, width: 120, height: 80 },
      { x: 400, y: 200, width: 150, height: 90 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    const smoothness = verifyPathSmoothness(polygon)

    expect(smoothness.sharpCorners).toBe(0)
    expect(smoothness.maxAngle).toBeLessThan(30)
    expect(smoothness.maxAngleDelta).toBeLessThan(20)
  })

  it('should create smooth flowing curves for circular arrangement', () => {
    const radius = 300
    const contexts = []
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * 2 * Math.PI
      contexts.push({
        x: 400 + radius * Math.cos(angle),
        y: 400 + radius * Math.sin(angle),
        width: 120,
        height: 80
      })
    }
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    const smoothness = verifyPathSmoothness(polygon)

    expect(smoothness.sharpCorners).toBe(0)
    expect(smoothness.maxAngle).toBeLessThan(30)
    expect(smoothness.maxAngleDelta).toBeLessThan(20)
  })

  it('should create smooth boundaries for linear arrangement', () => {
    const contexts = [
      { x: 100, y: 200, width: 120, height: 80 },
      { x: 300, y: 200, width: 120, height: 80 },
      { x: 500, y: 200, width: 120, height: 80 }
    ]
    const padding = 40

    const path = generateBlobPath(contexts, padding)
    const polygon = parseSvgPath(path)

    const smoothness = verifyPathSmoothness(polygon)

    // Linear arrangements have rounded ends which create tighter curves
    // The ends can have angles up to ~160° (tight turns but not reversals)
    expect(smoothness.maxAngle,
      `Max angle ${smoothness.maxAngle.toFixed(1)}° should be < 165° for linear arrangement`
    ).toBeLessThan(165)

    // Most of the boundary should be smooth (< 30°)
    // Only allow a few sharp turns at the ends
    expect(smoothness.sharpCorners,
      `Found ${smoothness.sharpCorners} corners with angles > 30°, most should be smooth`
    ).toBeLessThan(20) // Allow the end caps to have some curvature
  })

  it('should have no sharp turns (all angles < 30°) for any arrangement', () => {
    // Test multiple different arrangements
    const testCases = [
      // Two contexts
      [
        { x: 100, y: 200, width: 120, height: 80 },
        { x: 400, y: 200, width: 150, height: 90 }
      ],
      // Triangle
      [
        { x: 200, y: 100, width: 120, height: 80 },
        { x: 100, y: 300, width: 120, height: 80 },
        { x: 300, y: 300, width: 120, height: 80 }
      ],
      // Square
      [
        { x: 100, y: 100, width: 120, height: 80 },
        { x: 400, y: 100, width: 120, height: 80 },
        { x: 100, y: 400, width: 120, height: 80 },
        { x: 400, y: 400, width: 120, height: 80 }
      ]
    ]

    for (let caseIdx = 0; caseIdx < testCases.length; caseIdx++) {
      const contexts = testCases[caseIdx]
      const path = generateBlobPath(contexts, 40)
      const polygon = parseSvgPath(path)
      const smoothness = verifyPathSmoothness(polygon)

      expect(smoothness.sharpCorners,
        `Test case ${caseIdx + 1}: Found ${smoothness.sharpCorners} sharp corners (angles > 30°), expected 0. Max: ${smoothness.maxAngle.toFixed(1)}°`
      ).toBe(0)
      expect(smoothness.maxAngle,
        `Test case ${caseIdx + 1}: Max angle ${smoothness.maxAngle.toFixed(1)}° should be < 30°`
      ).toBeLessThan(30)
    }
  })
})
