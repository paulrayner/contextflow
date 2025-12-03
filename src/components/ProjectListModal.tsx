import React from 'react'
import { X, Layers, Plus, Trash2, Copy, Pencil, Link2, Check, Search } from 'lucide-react'
import type { Project } from '../model/types'
import { formatRelativeTime, getProjectMetadata, sortProjectsByLastModified } from '../model/projectUtils'
import { isBuiltInProject } from '../model/projectUtils'
import { ProjectCreateDialog } from './ProjectCreateDialog'
import { ProjectDeleteDialog } from './ProjectDeleteDialog'

function getShareUrl(projectId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/p/${projectId}`
}

interface ProjectListModalProps {
  projects: Record<string, Project>
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
  onCreateProject: (name: string) => void
  onDeleteProject: (projectId: string) => void
  onRenameProject: (projectId: string, newName: string) => void
  onDuplicateProject: (projectId: string) => void
  onClose: () => void
}

export function ProjectListModal({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onDuplicateProject,
  onClose,
}: ProjectListModalProps) {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null)
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [copiedProjectId, setCopiedProjectId] = React.useState<string | null>(null)
  const editInputRef = React.useRef<HTMLInputElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const sortedProjects = React.useMemo(() => {
    const allProjects = sortProjectsByLastModified(Object.values(projects))
    if (!searchQuery.trim()) return allProjects
    const query = searchQuery.toLowerCase()
    return allProjects.filter(p => p.name.toLowerCase().includes(query))
  }, [projects, searchQuery])

  const projectCount = Object.keys(projects).length
  const canDeleteAny = projectCount > 1

  React.useEffect(() => {
    if (editingProjectId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingProjectId])

  const handleSelectProject = (projectId: string) => {
    if (editingProjectId) return
    onSelectProject(projectId)
    onClose()
  }

  const handleCreateProject = (name: string) => {
    onCreateProject(name)
    setShowCreateDialog(false)
    onClose()
  }

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    setDeleteTarget({ id: project.id, name: project.name })
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteProject(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    setEditingProjectId(project.id)
    setEditingName(project.name)
  }

  const handleSaveRename = () => {
    if (editingProjectId && editingName.trim()) {
      onRenameProject(editingProjectId, editingName.trim())
    }
    setEditingProjectId(null)
    setEditingName('')
  }

  const handleCancelRename = () => {
    setEditingProjectId(null)
    setEditingName('')
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelRename()
    }
  }

  const handleDuplicateClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    onDuplicateProject(projectId)
    onClose()
  }

  const handleQuickShare = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    const shareUrl = getShareUrl(projectId)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedProjectId(projectId)
      setTimeout(() => setCopiedProjectId(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedProjectId(projectId)
      setTimeout(() => setCopiedProjectId(null), 2000)
    }
  }

  if (deleteTarget) {
    return (
      <ProjectDeleteDialog
        projectName={deleteTarget.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    )
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

        {/* Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full text-sm pl-9 pr-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {sortedProjects.length === 0 && searchQuery.trim() && (
            <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
              No projects match "{searchQuery}"
            </div>
          )}
          <div className="space-y-2">
            {sortedProjects.map((project) => {
              const metadata = getProjectMetadata(project)
              const isActive = project.id === activeProjectId
              const isBuiltIn = isBuiltInProject(project.id)
              const canDelete = canDeleteAny && !isBuiltIn
              const isEditing = editingProjectId === project.id

              return (
                <div
                  key={project.id}
                  className="group relative"
                >
                  <button
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
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleSaveRename}
                              onKeyDown={handleRenameKeyDown}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-medium px-1 py-0.5 -ml-1 rounded border border-blue-500 bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-200 outline-none w-full max-w-[200px]"
                            />
                          ) : (
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {project.name}
                            </span>
                          )}
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
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Quick share button */}
                    <button
                      onClick={(e) => handleQuickShare(e, project.id)}
                      className={`p-1.5 rounded transition-colors ${
                        copiedProjectId === project.id
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'
                      }`}
                      title={copiedProjectId === project.id ? 'Link copied!' : 'Copy share link'}
                    >
                      {copiedProjectId === project.id ? <Check size={14} /> : <Link2 size={14} />}
                    </button>
                    {!isBuiltIn && (
                      <button
                        onClick={(e) => handleEditClick(e, project)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Rename project"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDuplicateClick(e, project.id)}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Duplicate project"
                    >
                      <Copy size={14} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteClick(e, project)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
