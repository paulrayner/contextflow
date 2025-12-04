import type { Project } from './types'
import demoProject from '../../examples/sample.project.json'
import cbioportalProject from '../../examples/cbioportal.project.json'
import emptyProject from '../../examples/empty.project.json'
import elanWarrantyProject from '../../examples/elan-warranty.project.json'
import { saveProject, loadProject, migrateProject } from './persistence'
import { classifyFromStrategicPosition } from './classification'

// ============================================================================
// BUILT-IN PROJECTS
// ============================================================================
// To add a new built-in project:
// 1. Import the JSON file at the top: import newProject from '../../examples/new.project.json'
// 2. Add it to this array: BUILT_IN_PROJECTS.push(newProject as Project)
//
// The project will automatically be:
// - Initialized with backwards-compatible fields
// - Migrated for distillation/evolution if needed
// - Saved to IndexedDB
// - Loaded from IndexedDB on startup
// - Available in the project dropdown
// ============================================================================
export const BUILT_IN_PROJECTS = [
  demoProject as Project,
  cbioportalProject as Project,
  emptyProject as Project,
  elanWarrantyProject as Project,
]

// For backwards compatibility, create named references
export const [sampleProject, cbioportal, empty, elanWarranty] = BUILT_IN_PROJECTS

// Ensure all projects have required arrays (for backwards compatibility)
BUILT_IN_PROJECTS.forEach(project => {
  if (!project.users) project.users = []
  if (!project.userNeeds) project.userNeeds = []
  if (!project.userNeedConnections) project.userNeedConnections = []
  if (!project.needContextConnections) project.needContextConnections = []
  // Ensure viewConfig exists with flowStages array
  if (!project.viewConfig) {
    project.viewConfig = { flowStages: [] }
  } else if (!project.viewConfig.flowStages) {
    project.viewConfig.flowStages = []
  }
})

// Migrate contexts to include distillation position and evolution stage if missing
BUILT_IN_PROJECTS.forEach(project => {
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
})

async function saveProjectIfNew(project: Project): Promise<void> {
  const existingProject = await loadProject(project.id)
  if (isBuiltInNewer(project, existingProject)) {
    await saveProject(project)
  }
}

BUILT_IN_PROJECTS.forEach(project => {
  saveProjectIfNew(project).catch(err => {
    console.error(`Failed to check/save ${project.name}:`, err)
  })
})

// Build initial projects map from array
export const initialProjects = BUILT_IN_PROJECTS.reduce((acc, project) => {
  acc[project.id] = project
  return acc
}, {} as Record<string, Project>)

// Get last active project from localStorage, validating it exists in initial projects
const storedProjectId = localStorage.getItem('contextflow.activeProjectId')
const storedProjectExistsLocally = storedProjectId && initialProjects[storedProjectId]
export const initialActiveProjectId = storedProjectExistsLocally ? storedProjectId : sampleProject.id

type ProjectOrigin = 'sample' | 'empty' | 'imported' | 'continued'

export function determineProjectOrigin(
  projectId: string,
  isFirstLoad: boolean
): ProjectOrigin {
  if (projectId === 'acme-ecommerce' || projectId === 'cbioportal' || projectId === 'elan-warranty') {
    return 'sample'
  } else if (projectId === 'empty-project') {
    return 'empty'
  } else if (isFirstLoad) {
    return 'imported'
  }
  return 'continued'
}

const DEFAULT_PROJECT_VERSION = 1

export function isBuiltInNewer(
  builtInProject: { version?: number },
  savedProject: { version?: number } | null
): boolean {
  if (!savedProject) return true

  const builtInVersion = builtInProject.version ?? DEFAULT_PROJECT_VERSION
  const savedVersion = savedProject.version ?? DEFAULT_PROJECT_VERSION

  return builtInVersion > savedVersion
}

export function initializeBuiltInProjects(
  setState: (state: { projects: Record<string, Project> }) => void
): void {
  Promise.all(
    BUILT_IN_PROJECTS.map(project => loadProject(project.id))
  ).then((savedProjects) => {
    const projects: Record<string, Project> = {}

    BUILT_IN_PROJECTS.forEach((builtInProject, index) => {
      const savedProject = savedProjects[index]
      if (isBuiltInNewer(builtInProject, savedProject)) {
        projects[builtInProject.id] = builtInProject
      } else {
        // Migrate saved project to handle schema changes (e.g., actors → users)
        const migratedProject = migrateProject(savedProject!)
        projects[migratedProject.id] = migratedProject
      }
    })

    setState({ projects })
  }).catch(err => {
    console.error('Failed to load projects from IndexedDB:', err)
  })
}
