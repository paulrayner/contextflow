import { polygonHull } from 'd3-polygon'
import { curveCatmullRom, line } from 'd3-shape'

export interface Point {
  x: number
  y: number
  width: number
  height: number
}

export function generateBlobPath(points: Point[], padding: number): string {
  if (points.length === 0) {
    return ''
  }

  if (points.length === 1) {
    const { x, y, width, height } = points[0]
    const halfWidth = width / 2 + padding
    const halfHeight = height / 2 + padding
    const segments = 16

    const circlePoints: [number, number][] = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI
      circlePoints.push([
        x + halfWidth * Math.cos(angle),
        y + halfHeight * Math.sin(angle)
      ])
    }

    const lineGenerator = line()
      .curve(curveCatmullRom.alpha(0.5))

    return lineGenerator(circlePoints) || ''
  }

  const paddedPoints: [number, number][] = []
  for (const point of points) {
    const halfWidth = point.width / 2
    const halfHeight = point.height / 2

    const left = point.x - halfWidth
    const right = point.x + halfWidth
    const top = point.y - halfHeight
    const bottom = point.y + halfHeight

    const edgeSamples = 24

    for (let i = 0; i <= edgeSamples; i++) {
      const t = i / edgeSamples
      paddedPoints.push([left - padding, top + t * point.height])
      paddedPoints.push([right + padding, top + t * point.height])
      paddedPoints.push([left + t * point.width, top - padding])
      paddedPoints.push([left + t * point.width, bottom + padding])
    }

    const cornerSamples = 12
    const corners = [
      { x: left, y: top, startAngle: Math.PI, endAngle: Math.PI * 1.5 },
      { x: right, y: top, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },
      { x: right, y: bottom, startAngle: 0, endAngle: Math.PI * 0.5 },
      { x: left, y: bottom, startAngle: Math.PI * 0.5, endAngle: Math.PI },
    ]

    for (const corner of corners) {
      for (let i = 0; i <= cornerSamples; i++) {
        const t = i / cornerSamples
        const angle = corner.startAngle + t * (corner.endAngle - corner.startAngle)
        paddedPoints.push([
          corner.x + padding * Math.cos(angle),
          corner.y + padding * Math.sin(angle)
        ])
      }
    }
  }

  const hull = polygonHull(paddedPoints)
  if (!hull || hull.length < 3) {
    return ''
  }

  const closedHull = [...hull, hull[0]]

  const lineGenerator = line()
    .curve(curveCatmullRom.alpha(0.5))

  const rawPath = lineGenerator(closedHull) || ''

  // Find the bounds of the generated smoothed path (may extend beyond hull due to curve interpolation)
  const coords = rawPath.match(/-?[\d.]+/g)?.map(parseFloat) || []
  if (coords.length === 0) return rawPath

  const xCoords = coords.filter((_, i) => i % 2 === 0)
  const yCoords = coords.filter((_, i) => i % 2 === 1)
  const pathMinX = Math.min(...xCoords)
  const pathMinY = Math.min(...yCoords)

  // Always translate to ensure path starts at (0, 0) for SVG viewport compatibility
  // Use the actual smoothed path bounds, not hull bounds (curves can overshoot hull)
  const translateX = -pathMinX
  const translateY = -pathMinY

  if (translateX !== 0 || translateY !== 0) {
    // Translate the hull points
    const translatedHull = closedHull.map(([x, y]) => [x + translateX, y + translateY] as [number, number])

    // Regenerate the path with translated coordinates
    return lineGenerator(translatedHull) || ''
  }

  return rawPath
}
