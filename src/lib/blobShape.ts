import { polygonHull } from 'd3-polygon'
import { curveCatmullRom, line } from 'd3-shape'
import ClipperLib from 'clipper-lib'

export interface Point {
  x: number
  y: number
  width: number
  height: number
}

export interface BlobMetadata {
  path: string
  translateX: number
  translateY: number
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

const CLIPPER_SCALE = 100

export function generateBlobPath(points: Point[], padding: number): string
export function generateBlobPath(points: Point[], padding: number, returnMetadata?: false): string
export function generateBlobPath(points: Point[], padding: number, returnMetadata: true): BlobMetadata
export function generateBlobPath(points: Point[], padding: number, returnMetadata: boolean = false): string | BlobMetadata {
  if (points.length === 0) {
    return returnMetadata
      ? { path: '', translateX: 0, translateY: 0, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
      : ''
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

    const path = lineGenerator(circlePoints) || ''

    if (returnMetadata) {
      const pathCoords = path.match(/-?[\d.]+/g)?.map(parseFloat) || []
      const xCoords = pathCoords.filter((_, i) => i % 2 === 0)
      const yCoords = pathCoords.filter((_, i) => i % 2 === 1)
      return {
        path,
        translateX: 0,
        translateY: 0,
        bounds: {
          minX: Math.min(...xCoords),
          maxX: Math.max(...xCoords),
          minY: Math.min(...yCoords),
          maxY: Math.max(...yCoords)
        }
      }
    }

    return path
  }

  // Generate corner points for all rectangles
  const cornerPoints: [number, number][] = []
  for (const point of points) {
    const halfWidth = point.width / 2
    const halfHeight = point.height / 2
    const left = point.x - halfWidth
    const right = point.x + halfWidth
    const top = point.y - halfHeight
    const bottom = point.y + halfHeight

    cornerPoints.push([left, top])
    cornerPoints.push([right, top])
    cornerPoints.push([right, bottom])
    cornerPoints.push([left, bottom])
  }

  // Get convex hull of all corners
  const hull = polygonHull(cornerPoints)
  if (!hull || hull.length < 3) {
    return returnMetadata
      ? { path: '', translateX: 0, translateY: 0, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
      : ''
  }

  // Convert hull to ClipperLib format (scaled integers)
  const clipperPath: ClipperLib.IntPoint[] = hull.map(([x, y]) => ({
    X: Math.round(x * CLIPPER_SCALE),
    Y: Math.round(y * CLIPPER_SCALE)
  }))

  // Create ClipperOffset and add path
  // Use over-padding to compensate for Catmull-Rom inward pull on corners
  // Catmull-Rom curves cut corners significantly, need ~85% extra padding
  const CATMULL_ROM_COMPENSATION = 1.85
  const co = new ClipperLib.ClipperOffset(2, 0.25)
  co.AddPath(clipperPath, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)

  // Execute offset (expand by padding with compensation)
  const offsetSolution = new ClipperLib.Paths()
  co.Execute(offsetSolution, padding * CATMULL_ROM_COMPENSATION * CLIPPER_SCALE)

  if (offsetSolution.length === 0) {
    return returnMetadata
      ? { path: '', translateX: 0, translateY: 0, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
      : ''
  }

  // Convert back to float coordinates
  const offsetPolygon: [number, number][] = offsetSolution[0].map((pt: ClipperLib.IntPoint) => [
    pt.X / CLIPPER_SCALE,
    pt.Y / CLIPPER_SCALE
  ])

  // Close the polygon
  const closedPolygon = [...offsetPolygon, offsetPolygon[0]]

  // Apply gentle Catmull-Rom smoothing for organic appearance
  const lineGenerator = line()
    .curve(curveCatmullRom.alpha(0.5))

  const rawPath = lineGenerator(closedPolygon) || ''

  // Find the bounds of the generated smoothed path
  const coords = rawPath.match(/-?[\d.]+/g)?.map(parseFloat) || []
  if (coords.length === 0) {
    return returnMetadata
      ? { path: '', translateX: 0, translateY: 0, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
      : rawPath
  }

  const xCoords = coords.filter((_, i) => i % 2 === 0)
  const yCoords = coords.filter((_, i) => i % 2 === 1)
  const pathMinX = Math.min(...xCoords)
  const pathMinY = Math.min(...yCoords)
  const pathMaxX = Math.max(...xCoords)
  const pathMaxY = Math.max(...yCoords)

  // Translate path so it starts at SVG (0,0)
  const translatedPath = translateSVGPath(rawPath, -pathMinX, -pathMinY)

  if (returnMetadata) {
    return {
      path: translatedPath,
      translateX: -pathMinX,
      translateY: -pathMinY,
      bounds: {
        minX: pathMinX,
        maxX: pathMaxX,
        minY: pathMinY,
        maxY: pathMaxY
      }
    }
  }

  return rawPath
}

// Helper function to translate all coordinates in an SVG path string
function translateSVGPath(pathString: string, dx: number, dy: number): string {
  // Match all numbers in the path and translate them
  let isX = true
  return pathString.replace(/-?[\d.]+/g, (match) => {
    const value = parseFloat(match)
    const translated = isX ? value + dx : value + dy
    isX = !isX
    return translated.toString()
  })
}

