interface OldActorNeedConnection {
  id: string
  actorId: string
  userNeedId: string
  notes?: string
}

interface NewUserNeedConnection {
  id: string
  userId: string
  userNeedId: string
  notes?: string
}

/**
 * Pure migration function to rename actor → user in project data.
 *
 * Handles:
 * - actors[] → users[]
 * - actorNeedConnections[] → userNeedConnections[] (with actorId → userId)
 * - Removes legacy actorConnections[] if present
 *
 * @param project - Project data (possibly in old actor format)
 * @returns Project data with user terminology
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateActorToUser(project: any): any {
  const result = { ...project }

  // Migrate actors → users (only if users doesn't already exist)
  if (result.actors && !result.users) {
    result.users = result.actors
  }
  delete result.actors

  // Migrate actorNeedConnections → userNeedConnections (only if userNeedConnections doesn't already exist)
  if (result.actorNeedConnections && !result.userNeedConnections) {
    result.userNeedConnections = result.actorNeedConnections.map(
      (conn: OldActorNeedConnection): NewUserNeedConnection => {
        const newConn: NewUserNeedConnection = {
          id: conn.id,
          userId: conn.actorId,
          userNeedId: conn.userNeedId,
        }
        if (conn.notes !== undefined) {
          newConn.notes = conn.notes
        }
        return newConn
      }
    )
  }
  delete result.actorNeedConnections

  // Remove legacy actorConnections if present
  delete result.actorConnections

  return result
}
