export interface KeyframeTransitionResult {
  activeKeyframeId: string | null
  showGroups?: boolean
  showRelationships?: boolean
  savedShowGroups?: boolean
  savedShowRelationships?: boolean
}

export function calculateKeyframeTransition(
  keyframeId: string | null,
  currentKeyframeId: string | null,
  showGroups: boolean,
  showRelationships: boolean,
  savedShowGroups?: boolean,
  savedShowRelationships?: boolean
): KeyframeTransitionResult {
  if (keyframeId && !currentKeyframeId) {
    return {
      activeKeyframeId: keyframeId,
      savedShowGroups: showGroups,
      savedShowRelationships: showRelationships,
      showGroups: false,
      showRelationships: false,
    }
  } else if (!keyframeId && currentKeyframeId) {
    return {
      activeKeyframeId: keyframeId,
      showGroups: savedShowGroups ?? showGroups,
      showRelationships: savedShowRelationships ?? showRelationships,
    }
  } else {
    return {
      activeKeyframeId: keyframeId,
    }
  }
}
