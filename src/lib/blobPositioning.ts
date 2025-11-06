import { Point, BlobMetadata } from './blobShape'

export interface ContextWithSize {
  x: number
  y: number
  width: number
  height: number
}

export interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface BlobPositionResult {
  containerX: number
  containerY: number
  containerWidth: number
  containerHeight: number
  blobPath: string
}

export function calculateBoundingBox(contexts: ContextWithSize[]): BoundingBox {
  // React Flow positions nodes by their TOP-LEFT corner (not center)
  // So position.x is the left edge, position.x + width is the right edge
  const minX = Math.min(...contexts.map(c => c.x))
  const maxX = Math.max(...contexts.map(c => c.x + c.width))
  const minY = Math.min(...contexts.map(c => c.y))
  const maxY = Math.max(...contexts.map(c => c.y + c.height))

  return { minX, maxX, minY, maxY }
}

export function translateContextsToRelative(
  contexts: ContextWithSize[],
  boundingBox: BoundingBox
): Point[] {
  return contexts.map(c => ({
    x: c.x - boundingBox.minX,
    y: c.y - boundingBox.minY,
    width: c.width,
    height: c.height
  }))
}

export function calculateBlobPosition(
  absoluteContexts: ContextWithSize[],
  blobMetadata: BlobMetadata,
  boundingBox: BoundingBox
): BlobPositionResult {
  // Container dimensions = blob dimensions
  const containerWidth = blobMetadata.bounds.maxX - blobMetadata.bounds.minX
  const containerHeight = blobMetadata.bounds.maxY - blobMetadata.bounds.minY

  // The blob path was translated so its leftmost/topmost point is at SVG (0,0)
  // Original blob extended from blobMinX (e.g., -180) to blobMaxX (e.g., 965) in relative coords
  // After translation by -blobMinX, it now extends from 0 to (blobMaxX - blobMinX)

  // Container position in absolute coords (top-left corner)
  // React Flow positions ALL nodes by their TOP-LEFT corner
  const containerX = boundingBox.minX + blobMetadata.bounds.minX
  const containerY = boundingBox.minY + blobMetadata.bounds.minY

  return {
    containerX,
    containerY,
    containerWidth,
    containerHeight,
    blobPath: blobMetadata.path
  }
}
