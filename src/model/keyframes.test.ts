import { describe, it, expect } from 'vitest'
import { calculateKeyframeTransition } from './keyframes'

describe('calculateKeyframeTransition', () => {
  it('entering keyframe mode saves current state and hides groups/relationships', () => {
    const result = calculateKeyframeTransition('kf1', null, true, false, undefined, undefined)

    expect(result).toEqual({
      activeKeyframeId: 'kf1',
      savedShowGroups: true,
      savedShowRelationships: false,
      showGroups: false,
      showRelationships: false,
    })
  })

  it('exiting keyframe mode restores saved state', () => {
    const result = calculateKeyframeTransition(null, 'kf1', false, false, true, true)

    expect(result).toEqual({
      activeKeyframeId: null,
      showGroups: true,
      showRelationships: true,
    })
  })

  it('exiting keyframe mode uses current state when saved state is undefined', () => {
    const result = calculateKeyframeTransition(null, 'kf1', false, true, undefined, undefined)

    expect(result).toEqual({
      activeKeyframeId: null,
      showGroups: false,
      showRelationships: true,
    })
  })

  it('switching between keyframes only updates activeKeyframeId', () => {
    const result = calculateKeyframeTransition('kf2', 'kf1', false, false, true, true)

    expect(result).toEqual({
      activeKeyframeId: 'kf2',
    })
  })

  it('redundant call with no active keyframe only updates activeKeyframeId', () => {
    const result = calculateKeyframeTransition(null, null, true, true, undefined, undefined)

    expect(result).toEqual({
      activeKeyframeId: null,
    })
  })
})
