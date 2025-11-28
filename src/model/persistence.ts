// IndexedDB persistence for ContextFlow projects
import type { Project } from './types'
import { classifyFromStrategicPosition } from './classification'
import { migrateActorToUser } from './migrations/migrateActorToUser'

const DB_NAME = 'contextflow'
const DB_VERSION = 1
const STORE_NAME = 'projects'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })

  return dbPromise
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(project)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function loadProject(projectId: string): Promise<Project | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(projectId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function loadAllProjects(): Promise<Project[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(projectId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function autosaveIfNeeded(
  projectId: string | null,
  projects: Record<string, Project> | undefined
): void {
  if (projectId && projects) {
    saveProject(projects[projectId]).catch((err) => {
      console.error('Failed to autosave project:', err)
    })
  }
}

export function migrateProject(project: Project): Project {
  // Apply actor→user migration
  const migrated = migrateActorToUser(project)
  Object.assign(project, migrated)

  if (!project.users) project.users = []
  if (!project.userNeedConnections) project.userNeedConnections = []

  // Ensure viewConfig exists with flowStages array
  if (!project.viewConfig) {
    project.viewConfig = { flowStages: [] }
  } else if (!project.viewConfig.flowStages) {
    project.viewConfig.flowStages = []
  }

  project.contexts = project.contexts.map(context => {
    const needsDistillation = !context.positions.distillation
    const needsEvolution = !context.evolutionStage

    if (needsDistillation || needsEvolution) {
      return {
        ...context,
        positions: {
          ...context.positions,
          distillation: context.positions.distillation || { x: 50, y: 50 },
        },
        strategicClassification: context.strategicClassification || 'supporting',
        evolutionStage: context.evolutionStage || classifyFromStrategicPosition(context.positions.strategic.x),
      }
    }
    return context
  })

  return project
}
