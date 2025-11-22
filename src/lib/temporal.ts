// Temporal evolution utilities for interpolation and date conversion

import type { TemporalKeyframe, BoundedContext } from '../model/types'

/**
 * Convert a date string (year or year-quarter) to a numeric value for calculations
 * @param date - Format: "2027" or "2027-Q2"
 * @returns Numeric representation (e.g., "2027" -> 2027.375, "2027-Q2" -> 2027.25)
 */
export function dateToNumeric(date: string | null | undefined): number {
  // Handle null/undefined dates gracefully (without logging - too noisy)
  if (!date || typeof date !== 'string') {
    return new Date().getFullYear() // Fallback to current year
  }

  const match = date.match(/^(\d{4})(?:-Q([1-4]))?$/)
  if (!match) {
    // Invalid format, fallback silently
    return new Date().getFullYear()
  }

  const year = parseInt(match[1], 10)
  const quarter = match[2] ? parseInt(match[2], 10) : null

  // If no quarter specified, treat as mid-year (Q2.5 = 0.375)
  // If quarter specified: Q1=0, Q2=0.25, Q3=0.5, Q4=0.75
  const quarterOffset = quarter !== null ? (quarter - 1) / 4 : 0.375

  return year + quarterOffset
}

/**
 * Calculate progress (0.0 to 1.0) between two dates
 * @param target - Current date to calculate progress for
 * @param start - Start date
 * @param end - End date
 * @returns Progress value between 0 and 1
 */
export function calculateDateProgress(target: string, start: string, end: string): number {
  const t = dateToNumeric(target)
  const s = dateToNumeric(start)
  const e = dateToNumeric(end)

  if (e === s) return 0
  return (t - s) / (e - s)
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Find the keyframe immediately before the target date
 */
export function findKeyframeBefore(
  targetDate: string,
  keyframes: TemporalKeyframe[]
): TemporalKeyframe | null {
  const targetNumeric = dateToNumeric(targetDate)

  let closest: TemporalKeyframe | null = null
  let closestNumeric = -Infinity

  for (const kf of keyframes) {
    const kfNumeric = dateToNumeric(kf.date)
    if (kfNumeric <= targetNumeric && kfNumeric > closestNumeric) {
      closest = kf
      closestNumeric = kfNumeric
    }
  }

  return closest
}

/**
 * Find the keyframe immediately after the target date
 */
export function findKeyframeAfter(
  targetDate: string,
  keyframes: TemporalKeyframe[]
): TemporalKeyframe | null {
  const targetNumeric = dateToNumeric(targetDate)

  let closest: TemporalKeyframe | null = null
  let closestNumeric = Infinity

  for (const kf of keyframes) {
    const kfNumeric = dateToNumeric(kf.date)
    if (kfNumeric >= targetNumeric && kfNumeric < closestNumeric) {
      closest = kf
      closestNumeric = kfNumeric
    }
  }

  return closest
}

/**
 * Find the nearest keyframe to the target date (for snapping)
 */
export function findNearestKeyframe(
  targetDate: string,
  keyframes: TemporalKeyframe[]
): TemporalKeyframe | null {
  if (keyframes.length === 0) return null

  const targetNumeric = dateToNumeric(targetDate)

  let nearest: TemporalKeyframe = keyframes[0]
  let minDistance = Math.abs(dateToNumeric(keyframes[0].date) - targetNumeric)

  for (const kf of keyframes) {
    const distance = Math.abs(dateToNumeric(kf.date) - targetNumeric)
    if (distance < minDistance) {
      nearest = kf
      minDistance = distance
    }
  }

  return nearest
}

const TEMPORAL_SNAP_THRESHOLD_BASE = 0.05
const TEMPORAL_SNAP_MULTIPLIER = 5

/**
 * Check if target date is close enough to snap to a keyframe
 * @param targetDate - Current slider date
 * @param keyframe - Keyframe to check
 * @param threshold - Snap threshold as a percentage (default 0.05 = 5%)
 * @returns true if should snap
 */
export function shouldSnapToKeyframe(
  targetDate: string,
  keyframe: TemporalKeyframe,
  threshold: number = TEMPORAL_SNAP_THRESHOLD_BASE
): boolean {
  const targetNumeric = dateToNumeric(targetDate)
  const keyframeNumeric = dateToNumeric(keyframe.date)

  const distance = Math.abs(targetNumeric - keyframeNumeric)

  return distance < threshold * TEMPORAL_SNAP_MULTIPLIER
}

/**
 * Interpolate position for a context at a given date
 * @param contextId - ID of the context
 * @param targetDate - Date to interpolate position for
 * @param keyframes - Sorted array of keyframes
 * @param basePosition - Fallback base position if no keyframes apply
 * @returns Interpolated position {x, y}
 */
export function interpolatePosition(
  contextId: string,
  targetDate: string,
  keyframes: TemporalKeyframe[],
  basePosition: { x: number; y: number }
): { x: number; y: number } {
  // Edge case: no keyframes
  if (keyframes.length === 0) {
    return basePosition
  }

  const before = findKeyframeBefore(targetDate, keyframes)
  const after = findKeyframeAfter(targetDate, keyframes)

  // Edge cases
  if (!before && !after) {
    // No keyframes (shouldn't happen due to length check above)
    return basePosition
  }

  if (!before) {
    // Before first keyframe: use base position
    return basePosition
  }

  if (!after || before === after) {
    // After last keyframe or exactly on a keyframe: use that keyframe's position
    const pos = before.positions[contextId]
    return pos || basePosition
  }

  // Between two keyframes: interpolate
  const beforePos = before.positions[contextId] || basePosition
  const afterPos = after.positions[contextId] || basePosition

  const progress = calculateDateProgress(targetDate, before.date, after.date)

  return {
    x: lerp(beforePos.x, afterPos.x, progress),
    y: lerp(beforePos.y, afterPos.y, progress),
  }
}

/**
 * Check if a context should be visible at the target date based on keyframe activeContextIds
 * @param contextId - ID of the context
 * @param targetDate - Date to check visibility for
 * @param keyframes - Sorted array of keyframes
 * @returns true if context should be visible
 */
export function isContextVisibleAtDate(
  contextId: string,
  targetDate: string,
  keyframes: TemporalKeyframe[]
): boolean {
  if (keyframes.length === 0) {
    // No keyframes: all contexts visible (base state)
    return true
  }

  const before = findKeyframeBefore(targetDate, keyframes)
  const after = findKeyframeAfter(targetDate, keyframes)

  // If we're before all keyframes, show all contexts (base state)
  if (!before) {
    return true
  }

  // If we're on or after a keyframe, check its activeContextIds
  if (before && (!after || before === after)) {
    return before.activeContextIds.includes(contextId)
  }

  // Between two keyframes: visible if in either keyframe
  const inBefore = before.activeContextIds.includes(contextId)
  const inAfter = after.activeContextIds.includes(contextId)

  return inBefore || inAfter
}

/**
 * Calculate opacity for a context that's appearing or disappearing
 * @param contextId - ID of the context
 * @param targetDate - Date to calculate opacity for
 * @param keyframes - Sorted array of keyframes
 * @returns Opacity value between 0 and 1
 */
export function getContextOpacity(
  contextId: string,
  targetDate: string,
  keyframes: TemporalKeyframe[]
): number {
  if (keyframes.length === 0) {
    return 1
  }

  const before = findKeyframeBefore(targetDate, keyframes)
  const after = findKeyframeAfter(targetDate, keyframes)

  if (!before) {
    // Before all keyframes: full opacity
    return 1
  }

  if (!after || before === after) {
    // On or after last keyframe: check if visible
    return before.activeContextIds.includes(contextId) ? 1 : 0
  }

  // Between two keyframes
  const inBefore = before.activeContextIds.includes(contextId)
  const inAfter = after.activeContextIds.includes(contextId)

  if (inBefore && inAfter) {
    // Visible in both: full opacity
    return 1
  }

  if (!inBefore && !inAfter) {
    // Hidden in both: zero opacity
    return 0
  }

  // Appearing or disappearing: fade based on progress
  const progress = calculateDateProgress(targetDate, before.date, after.date)

  if (inBefore && !inAfter) {
    // Fading out
    return 1 - progress
  } else {
    // Fading in
    return progress
  }
}
