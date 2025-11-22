import { describe, it, expect, vi, beforeEach } from 'vitest'

const ASYNC_INIT_TIMEOUT_MS = 100

describe('Store - Built-in Project Persistence', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should save built-in projects when they do not exist in IndexedDB', async () => {
    const persistenceModule = await import('../persistence')
    const saveProjectSpy = vi.spyOn(persistenceModule, 'saveProject')
    const loadProjectSpy = vi.spyOn(persistenceModule, 'loadProject')

    loadProjectSpy.mockResolvedValue(null)
    saveProjectSpy.mockResolvedValue(undefined)

    await import('../store')
    await new Promise(resolve => setTimeout(resolve, ASYNC_INIT_TIMEOUT_MS))

    expect(loadProjectSpy).toHaveBeenCalled()
    expect(saveProjectSpy).toHaveBeenCalled()
    const loadCallTime = loadProjectSpy.mock.invocationCallOrder[0]
    const saveCallTime = saveProjectSpy.mock.invocationCallOrder[0]
    expect(loadCallTime).toBeLessThan(saveCallTime)
  })

  it('should NOT overwrite built-in projects when they already exist in IndexedDB', async () => {
    const persistenceModule = await import('../persistence')
    const saveProjectSpy = vi.spyOn(persistenceModule, 'saveProject')
    const loadProjectSpy = vi.spyOn(persistenceModule, 'loadProject')

    const mockSavedProject = {
      id: 'sample',
      name: 'User Modified Sample',
      contexts: [],
      groups: [],
      relationships: [],
      repos: [],
      flowStages: [],
      userNeeds: []
    }

    loadProjectSpy.mockResolvedValue(mockSavedProject)
    saveProjectSpy.mockResolvedValue(undefined)

    await import('../store')
    await new Promise(resolve => setTimeout(resolve, ASYNC_INIT_TIMEOUT_MS))

    expect(loadProjectSpy).toHaveBeenCalled()
    expect(saveProjectSpy).not.toHaveBeenCalled()
  })
})
