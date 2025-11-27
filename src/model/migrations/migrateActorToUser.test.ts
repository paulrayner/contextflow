import { describe, it, expect } from 'vitest'
import { migrateActorToUser } from './migrateActorToUser'

describe('migrateActorToUser', () => {
  describe('actors array migration', () => {
    it('renames actors array to users', () => {
      const input = {
        actors: [
          { id: 'actor-1', name: 'Shopper', position: 20 }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.users).toEqual([
        { id: 'actor-1', name: 'Shopper', position: 20 }
      ])
      expect(result).not.toHaveProperty('actors')
    })

    it('preserves all actor properties when renaming to user', () => {
      const input = {
        actors: [
          { id: 'actor-1', name: 'Admin', description: 'System admin', position: 50, isExternal: false }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.users).toEqual([
        { id: 'actor-1', name: 'Admin', description: 'System admin', position: 50, isExternal: false }
      ])
    })

    it('handles multiple actors', () => {
      const input = {
        actors: [
          { id: 'actor-1', name: 'Shopper', position: 20 },
          { id: 'actor-2', name: 'Admin', position: 50 },
          { id: 'actor-3', name: 'Guest', position: 80, isExternal: true }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.users).toHaveLength(3)
      expect(result.users[0].name).toBe('Shopper')
      expect(result.users[2].isExternal).toBe(true)
    })

    it('handles empty actors array', () => {
      const input = { actors: [] }

      const result = migrateActorToUser(input)

      expect(result.users).toEqual([])
      expect(result).not.toHaveProperty('actors')
    })
  })

  describe('actorNeedConnections migration', () => {
    it('renames actorNeedConnections to userNeedConnections', () => {
      const input = {
        actorNeedConnections: [
          { id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.userNeedConnections).toBeDefined()
      expect(result).not.toHaveProperty('actorNeedConnections')
    })

    it('renames actorId to userId in connections', () => {
      const input = {
        actorNeedConnections: [
          { id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.userNeedConnections[0]).toEqual({
        id: 'conn-1',
        userId: 'actor-1',
        userNeedId: 'need-1'
      })
      expect(result.userNeedConnections[0]).not.toHaveProperty('actorId')
    })

    it('preserves notes in connections', () => {
      const input = {
        actorNeedConnections: [
          { id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1', notes: 'Important connection' }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.userNeedConnections[0].notes).toBe('Important connection')
    })

    it('handles multiple connections', () => {
      const input = {
        actorNeedConnections: [
          { id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' },
          { id: 'conn-2', actorId: 'actor-2', userNeedId: 'need-2', notes: 'Note' }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.userNeedConnections).toHaveLength(2)
      expect(result.userNeedConnections[0].userId).toBe('actor-1')
      expect(result.userNeedConnections[1].userId).toBe('actor-2')
    })

    it('handles empty actorNeedConnections array', () => {
      const input = { actorNeedConnections: [] }

      const result = migrateActorToUser(input)

      expect(result.userNeedConnections).toEqual([])
    })
  })

  describe('legacy actorConnections cleanup', () => {
    it('removes legacy actorConnections array', () => {
      const input = {
        actorConnections: [
          { id: 'conn-1', actorId: 'actor-1', contextId: 'ctx-1' }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result).not.toHaveProperty('actorConnections')
    })
  })

  describe('already migrated data', () => {
    it('does not modify data that already has users array', () => {
      const input = {
        users: [
          { id: 'user-1', name: 'Shopper', position: 20 }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.users).toEqual([
        { id: 'user-1', name: 'Shopper', position: 20 }
      ])
    })

    it('does not modify data that already has userNeedConnections', () => {
      const input = {
        userNeedConnections: [
          { id: 'conn-1', userId: 'user-1', userNeedId: 'need-1' }
        ]
      }

      const result = migrateActorToUser(input)

      expect(result.userNeedConnections).toEqual([
        { id: 'conn-1', userId: 'user-1', userNeedId: 'need-1' }
      ])
    })

    it('prefers existing users over actors if both present', () => {
      const input = {
        actors: [{ id: 'actor-1', name: 'Old', position: 10 }],
        users: [{ id: 'user-1', name: 'New', position: 20 }]
      }

      const result = migrateActorToUser(input)

      expect(result.users).toEqual([{ id: 'user-1', name: 'New', position: 20 }])
      expect(result).not.toHaveProperty('actors')
    })
  })

  describe('combined migration', () => {
    it('migrates complete old-format project', () => {
      const input = {
        id: 'project-1',
        name: 'Test Project',
        actors: [
          { id: 'actor-1', name: 'Shopper', position: 20, isExternal: true },
          { id: 'actor-2', name: 'Admin', position: 50 }
        ],
        actorNeedConnections: [
          { id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' },
          { id: 'conn-2', actorId: 'actor-2', userNeedId: 'need-2', notes: 'Admin access' }
        ],
        userNeeds: [
          { id: 'need-1', name: 'Browse Products', position: 30 }
        ],
        contexts: []
      }

      const result = migrateActorToUser(input)

      expect(result.users).toHaveLength(2)
      expect(result.userNeedConnections).toHaveLength(2)
      expect(result.userNeedConnections[0].userId).toBe('actor-1')
      expect(result.userNeedConnections[1].notes).toBe('Admin access')
      expect(result).not.toHaveProperty('actors')
      expect(result).not.toHaveProperty('actorNeedConnections')
      // Preserve other properties
      expect(result.id).toBe('project-1')
      expect(result.name).toBe('Test Project')
      expect(result.userNeeds).toHaveLength(1)
    })
  })

  describe('immutability', () => {
    it('does not mutate the input object', () => {
      const input = {
        actors: [{ id: 'actor-1', name: 'Shopper', position: 20 }],
        actorNeedConnections: [{ id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' }]
      }
      const inputCopy = JSON.parse(JSON.stringify(input))

      migrateActorToUser(input)

      expect(input).toEqual(inputCopy)
    })
  })
})
