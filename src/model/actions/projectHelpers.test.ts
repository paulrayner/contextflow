import { describe, it, expect } from 'vitest'
import { isProjectEmpty, isSampleProject, shouldShowGettingStartedGuide } from './projectHelpers'
import { createBaseMockProject, createMockContext } from './__testFixtures__/mockState'
import type { User } from '../types'

const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  name: 'Test User',
  position: 50,
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
  it('returns true for built-in project that is not Empty Project', () => {
    const project = {
      ...createBaseMockProject(),
      name: 'ACME E-Commerce',
      isBuiltIn: true,
    }
    expect(isSampleProject(project)).toBe(true)
  })

  it('returns true for cbioportal built-in project', () => {
    const project = {
      ...createBaseMockProject(),
      name: 'cBioPortal',
      isBuiltIn: true,
    }
    expect(isSampleProject(project)).toBe(true)
  })

  it('returns false for Empty Project even when built-in', () => {
    const project = {
      ...createBaseMockProject(),
      name: 'Empty Project',
      isBuiltIn: true,
    }
    expect(isSampleProject(project)).toBe(false)
  })

  it('returns false for user-created projects', () => {
    const project = {
      ...createBaseMockProject(),
      name: 'My Custom Project',
      isBuiltIn: false,
    }
    expect(isSampleProject(project)).toBe(false)
  })

  it('returns false for projects without isBuiltIn flag', () => {
    const project = {
      ...createBaseMockProject(),
      name: 'Some Project',
    }
    expect(isSampleProject(project)).toBe(false)
  })
})

describe('shouldShowGettingStartedGuide', () => {
  it('returns true when manually opened (even if welcome not dismissed)', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'my-project',
      contexts: [createMockContext()],
    }

    expect(shouldShowGettingStartedGuide(project, new Set(), true, false, false)).toBe(true)
  })

  it('returns false when welcome modal not yet dismissed', () => {
    const project = createBaseMockProject()

    expect(shouldShowGettingStartedGuide(project, new Set(), false, false, false)).toBe(false)
  })

  it('returns true when project is empty and welcome dismissed', () => {
    const project = createBaseMockProject()

    expect(shouldShowGettingStartedGuide(project, new Set(), false, true, false)).toBe(true)
  })

  it('returns false when project is empty but guide was dismissed', () => {
    const project = createBaseMockProject()

    expect(shouldShowGettingStartedGuide(project, new Set(), false, true, true)).toBe(false)
  })

  it('returns true for unseen sample project after welcome dismissed', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'unique-id-123',
      name: 'ACME E-Commerce',
      isBuiltIn: true,
      contexts: [createMockContext()],
    }

    expect(shouldShowGettingStartedGuide(project, new Set(), false, true, false)).toBe(true)
  })

  it('returns false for already-seen sample project', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'unique-id-123',
      name: 'ACME E-Commerce',
      isBuiltIn: true,
      contexts: [createMockContext()],
    }
    const seenProjects = new Set(['unique-id-123'])

    expect(shouldShowGettingStartedGuide(project, seenProjects, false, true, false)).toBe(false)
  })

  it('returns false for non-empty user project', () => {
    const project = {
      ...createBaseMockProject(),
      id: 'my-project',
      contexts: [createMockContext()],
    }

    expect(shouldShowGettingStartedGuide(project, new Set(), false, true, false)).toBe(false)
  })
})
