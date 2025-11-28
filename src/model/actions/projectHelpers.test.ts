import { describe, it, expect } from 'vitest'
import { isProjectEmpty, isSampleProject, shouldShowGettingStartedGuide } from './projectHelpers'
import { createBaseMockProject, createMockContext } from './__testFixtures__/mockState'
import type { User } from '../types'

const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  name: 'Test User',
  position: { x: 100, y: 100 },
  isExternal: false,
  ...overrides,
})

describe('isProjectEmpty', () => {
  it('returns true when project has no contexts and no users', () => {
    const project = createBaseMockProject()

    expect(isProjectEmpty(project)).toBe(true)
  })

  it('returns true when project has no contexts and empty users array', () => {
    const project = {
      ...createBaseMockProject(),
      users: [],
    }

    expect(isProjectEmpty(project)).toBe(true)
  })

  it('returns false when project has contexts', () => {
    const project = {
      ...createBaseMockProject(),
      contexts: [createMockContext()],
    }

    expect(isProjectEmpty(project)).toBe(false)
  })

  it('returns false when project has users', () => {
    const project = {
      ...createBaseMockProject(),
      users: [createMockUser()],
    }

    expect(isProjectEmpty(project)).toBe(false)
  })

  it('returns false when project has both contexts and users', () => {
    const project = {
      ...createBaseMockProject(),
      contexts: [createMockContext()],
      users: [createMockUser()],
    }

    expect(isProjectEmpty(project)).toBe(false)
  })
})

describe('isSampleProject', () => {
  it('returns true for acme-ecommerce', () => {
    expect(isSampleProject('acme-ecommerce')).toBe(true)
  })

  it('returns true for cbioportal', () => {
    expect(isSampleProject('cbioportal')).toBe(true)
  })

  it('returns true for elan-warranty', () => {
    expect(isSampleProject('elan-warranty')).toBe(true)
  })

  it('returns false for empty-project', () => {
    expect(isSampleProject('empty-project')).toBe(false)
  })

  it('returns false for user-created projects', () => {
    expect(isSampleProject('my-custom-project')).toBe(false)
  })
})

describe('shouldShowGettingStartedGuide', () => {
  it('returns true when manually opened (even if welcome not dismissed)', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'my-project',
      contexts: [createMockContext()],
    }

    expect(shouldShowGettingStartedGuide(project, new Set(), true, false)).toBe(true)
  })

  it('returns false when welcome modal not yet dismissed', () => {
    const project = createBaseMockProject()

    expect(shouldShowGettingStartedGuide(project, new Set(), false, false)).toBe(false)
  })

  it('returns true when project is empty and welcome dismissed', () => {
    const project = createBaseMockProject()

    expect(shouldShowGettingStartedGuide(project, new Set(), false, true)).toBe(true)
  })

  it('returns true for unseen sample project after welcome dismissed', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'acme-ecommerce',
      contexts: [createMockContext()],
    }

    expect(shouldShowGettingStartedGuide(project, new Set(), false, true)).toBe(true)
  })

  it('returns false for already-seen sample project', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'acme-ecommerce',
      contexts: [createMockContext()],
    }
    const seenProjects = new Set(['acme-ecommerce'])

    expect(shouldShowGettingStartedGuide(project, seenProjects, false, true)).toBe(false)
  })

  it('returns false for non-empty user project', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'my-project',
      contexts: [createMockContext()],
    }

    expect(shouldShowGettingStartedGuide(project, new Set(), false, true)).toBe(false)
  })
})
