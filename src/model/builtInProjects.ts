import type { Project } from './types'
import demoProject from '../../examples/sample.project.json'
import cbioportalProject from '../../examples/cbioportal.project.json'
import emptyProject from '../../examples/empty.project.json'
import elanWarrantyProject from '../../examples/elan-warranty.project.json'
import { saveProject, loadProject } from './persistence'
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
const BUILT_IN_PROJECTS = [
  demoProject as Project,
  cbioportalProject as Project,
  emptyProject as Project,
  elanWarrantyProject as Project,
]

// For backwards compatibility, create named references
const [sampleProject, cbioportal, empty, elanWarranty] = BUILT_IN_PROJECTS

// Ensure all projects have required arrays (for backwards compatibility)
BUILT_IN_PROJECTS.forEach(project => {
  if (!project.actors) project.actors = []
  if (!project.userNeeds) project.userNeeds = []
  if (!project.actorNeedConnections) project.actorNeedConnections = []
  if (!project.needContextConnections) project.needContextConnections = []
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
  if (!existingProject) {
    await saveProject(project)
  }
}

BUILT_IN_PROJECTS.forEach(project => {
  saveProjectIfNew(project).catch(err => {
    console.error(`Failed to check/save ${project.name}:`, err)
  })
})

// Get last active project from localStorage, or default to sample
const storedProjectId = localStorage.getItem('contextflow.activeProjectId')
export const initialActiveProjectId = storedProjectId || sampleProject.id

// Build initial projects map from array
export const initialProjects = BUILT_IN_PROJECTS.reduce((acc, project) => {
  acc[project.id] = project
  return acc
}, {} as Record<string, Project>)
