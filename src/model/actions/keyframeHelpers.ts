import type { TemporalKeyframe, BoundedContext } from '../types'

const DATE_REGEX = /^\d{4}(-Q[1-4])?$/
const FAR_FUTURE_THRESHOLD_YEARS = 10

export function validateKeyframeDate(date: string): { valid: boolean; error?: string } {
  if (!DATE_REGEX.test(date)) {
    return { valid: false, error: `Invalid keyframe date format: ${date}` }
  }
  return { valid: true }
}

export function checkDuplicateKeyframe(date: string, existingKeyframes: TemporalKeyframe[]): boolean {
  return existingKeyframes.some(kf => kf.date === date)
}

export function shouldWarnFarFuture(date: string): { shouldWarn: boolean; message?: string } {
  const currentYear = new Date().getFullYear()
  const keyframeYear = parseInt(date.split('-')[0])
  if (keyframeYear - currentYear > FAR_FUTURE_THRESHOLD_YEARS) {
    return {
      shouldWarn: true,
      message: `Keyframe date ${date} is more than 10 years in the future`
    }
  }
  return { shouldWarn: false }
}

export function captureContextPositions(contexts: BoundedContext[]): { [contextId: string]: { x: number; y: number } } {
  const positions: { [contextId: string]: { x: number; y: number } } = {}
  contexts.forEach(context => {
    positions[context.id] = {
      x: context.positions.strategic.x,
      y: context.positions.shared.y,
    }
  })
  return positions
}

export function shouldAutoCreateCurrentKeyframe(existingKeyframes: TemporalKeyframe[], keyframeYear: number, currentYear: number, date: string): boolean {
  const currentYearStr = currentYear.toString()
  const isFirstKeyframe = existingKeyframes.length === 0
  const isFutureKeyframe = keyframeYear > currentYear
  const needsCurrentYearKeyframe = isFirstKeyframe && isFutureKeyframe && date !== currentYearStr
  return needsCurrentYearKeyframe
}

export function createCurrentKeyframe(currentYear: number, positions: { [contextId: string]: { x: number; y: number } }, activeContextIds: string[]): TemporalKeyframe {
  const currentYearStr = currentYear.toString()
  return {
    id: `keyframe-${Date.now()}-now`,
    date: currentYearStr,
    label: 'Current',
    positions: { ...positions },
    activeContextIds,
  }
}

export function sortKeyframes(keyframes: TemporalKeyframe[]): TemporalKeyframe[] {
  return [...keyframes].sort((a, b) => {
    return a.date.localeCompare(b.date)
  })
}
