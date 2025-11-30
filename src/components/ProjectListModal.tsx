import React from 'react'
import { X, Layers, Plus } from 'lucide-react'
import type { Project } from '../model/types'
import { formatRelativeTime, getProjectMetadata, sortProjectsByLastModified } from '../model/projectUtils'
import { isBuiltInProject } from '../model/projectUtils'
import { ProjectCreateDialog } from './ProjectCreateDialog'

interface ProjectListModalProps {
  projects: Record<string, Project>
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
  onCreateProject: (name: string) => void
  onClose: () => void
}

export function ProjectListModal({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onClose,
}: ProjectListModalProps) {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)

  const sortedProjects = React.useMemo(() => {
    return sortProjectsByLastModified(Object.values(projects))
  }, [projects])

  const handleSelectProject = (projectId: string) => {
    onSelectProject(projectId)
    onClose()
  }

  const handleCreateProject = (name: string) => {
    onCreateProject(name)
    setShowCreateDialog(false)
    onClose()
  }

  if (showCreateDialog) {
    return (
      <ProjectCreateDialog
        onConfirm={handleCreateProject}
        onCancel={() => setShowCreateDialog(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[520px] max-w-[90vw] max-h-[80vh] border border-slate-200 dark:border-neutral-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Projects
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus size={14} />
              New Project
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {sortedProjects.map((project) => {
              const metadata = getProjectMetadata(project)
              const isActive = project.id === activeProjectId
              const isBuiltIn = isBuiltInProject(project.id)

              return (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-750'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {project.name}
                        </span>
                        {isBuiltIn && (
                          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-slate-400">
                            Sample
                          </span>
                        )}
                        {isActive && (
                          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Layers size={12} />
                          {metadata.contextCount} context{metadata.contextCount !== 1 ? 's' : ''}
                        </span>
                        <span>
                          {formatRelativeTime(metadata.lastModified)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
