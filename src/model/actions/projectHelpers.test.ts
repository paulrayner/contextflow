import { describe, it, expect } from 'vitest'
import { isProjectEmpty } from './projectHelpers'
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
