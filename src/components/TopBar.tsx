import React, { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../model/store'
import { Undo2, Redo2, Plus, Download, Upload, Sun, Moon, User, Settings, Box, Hash, Target, ChevronDown, Share2 } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { InfoTooltip } from './InfoTooltip'
import { SimpleTooltip } from './SimpleTooltip'
import { CloudStatusIndicator } from './CloudStatusIndicator'
import { ShareProjectDialog } from './ShareProjectDialog'
import { GettingStartedGuideModal } from './GettingStartedGuideModal'
import { ProjectListModal } from './ProjectListModal'
import { ImportConflictDialog } from './ImportConflictDialog'
import { VIEW_DESCRIPTIONS, STAGE_DEFINITION, USER_DEFINITION, USER_NEED_DEFINITION, BOUNDED_CONTEXT_DEFINITION, TEMPORAL_MODE } from '../model/conceptDefinitions'
import { checkImportConflict, importProjectAsNew, validateImportedProject } from '../model/actions/projectActions'
import type { Project } from '../model/types'
import { version } from '../../package.json'

export function TopBar() {
  const settingsRef = useRef<HTMLDivElement>(null)
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const projects = useEditorStore(s => s.projects)
  const viewMode = useEditorStore(s => s.activeViewMode)
  const setViewMode = useEditorStore(s => s.setViewMode)
  const setActiveProject = useEditorStore(s => s.setActiveProject)
  const createProject = useEditorStore(s => s.createProject)
  const deleteProject = useEditorStore(s => s.deleteProject)
  const renameProject = useEditorStore(s => s.renameProject)
  const duplicateProject = useEditorStore(s => s.duplicateProject)
  const canUndo = useEditorStore(s => s.undoStack.length > 0)
  const canRedo = useEditorStore(s => s.redoStack.length > 0)
  const undo = useEditorStore(s => s.undo)
  const redo = useEditorStore(s => s.redo)
  const addContext = useEditorStore(s => s.addContext)
  const addUser = useEditorStore(s => s.addUser)
  const addUserNeed = useEditorStore(s => s.addUserNeed)
  const addFlowStage = useEditorStore(s => s.addFlowStage)
  const exportProject = useEditorStore(s => s.exportProject)
  const importProject = useEditorStore(s => s.importProject)
  const showGroups = useEditorStore(s => s.showGroups)
  const showRelationships = useEditorStore(s => s.showRelationships)
  const showIssueLabels = useEditorStore(s => s.showIssueLabels)
  const showTeamLabels = useEditorStore(s => s.showTeamLabels)
  const toggleShowGroups = useEditorStore(s => s.toggleShowGroups)
  const toggleShowRelationships = useEditorStore(s => s.toggleShowRelationships)
  const toggleIssueLabels = useEditorStore(s => s.toggleIssueLabels)
  const toggleTeamLabels = useEditorStore(s => s.toggleTeamLabels)
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const toggleHelpTooltips = useEditorStore(s => s.toggleHelpTooltips)
  const resetWelcome = useEditorStore(s => s.resetWelcome)
  const groupOpacity = useEditorStore(s => s.groupOpacity)
  const setGroupOpacity = useEditorStore(s => s.setGroupOpacity)
  const colorByMode = useEditorStore(s => s.colorByMode)
  const setColorByMode = useEditorStore(s => s.setColorByMode)
  const toggleTemporalMode = useEditorStore(s => s.toggleTemporalMode)
  const temporalEnabled = project?.temporal?.enabled || false

  const { theme, toggleTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const [showGettingStartedGuide, setShowGettingStartedGuide] = useState(false)
  const [showProjectList, setShowProjectList] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [importConflict, setImportConflict] = useState<{
    importedProject: Project
    existingProject: Project
  } | null>(null)
  const [useCodeCohesionAPI, setUseCodeCohesionAPI] = useState(() => {
    const stored = localStorage.getItem('contextflow.useCodeCohesionAPI')
    return stored === 'true'
  })

  // Close settings popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

  const handleExport = () => {
    if (!project) return
    const json = JSON.stringify(project, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.project.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          const validation = validateImportedProject(json)
          if (!validation.valid) {
            alert(`Failed to import project: ${validation.error}`)
            return
          }
          const project = json as Project
          const conflict = checkImportConflict(project, projects)
          if (conflict.hasConflict && conflict.existingProject) {
            setImportConflict({
              importedProject: project,
              existingProject: conflict.existingProject,
            })
          } else {
            importProject(project)
          }
        } catch (err) {
          alert('Failed to import project: Invalid JSON file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleImportReplace = () => {
    if (importConflict) {
      importProject(importConflict.importedProject)
      setImportConflict(null)
    }
  }

  const handleImportAsNew = () => {
    if (importConflict) {
      const existingNames = Object.values(projects).map((p) => p.name)
      const newProject = importProjectAsNew(importConflict.importedProject, existingNames)
      importProject(newProject)
      setImportConflict(null)
    }
  }

  const handleAddContext = () => {
    const name = prompt('Context name:')
    if (!name) return
    addContext(name)
  }

  const handleAddUser = () => {
    const name = prompt('User name:')
    if (!name) return
    addUser(name)
  }

  const handleAddUserNeed = () => {
    const name = prompt('User need name:')
    if (!name) return
    addUserNeed(name)
  }

  const handleAddStage = () => {
    const name = prompt('Stage name:')
    if (!name) return

    try {
      addFlowStage(name.trim())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add stage')
    }
  }

  return (
    <header className="flex items-center gap-4 px-5 py-3 border-b border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      {/* Logo */}
      <SimpleTooltip text={`v${version}`}>
        <div className="font-semibold text-base text-slate-800 dark:text-slate-100">
          ContextFlow
        </div>
      </SimpleTooltip>

      {/* Project Selector */}
      {project && (
        <>
          <div className="text-slate-400 dark:text-slate-500">•</div>
          <button
            onClick={() => setShowProjectList(true)}
            className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 font-medium bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 rounded px-2 py-1 outline-none cursor-pointer max-w-[220px]"
          >
            <span className="truncate">{project.name}</span>
            <ChevronDown size={14} className="shrink-0 text-slate-400" />
          </button>
        </>
      )}

      {/* View Toggle */}
      <div className="ml-8 flex items-center bg-slate-100 dark:bg-neutral-900 rounded-lg p-1">
        <InfoTooltip content={VIEW_DESCRIPTIONS.flow}>
          <button
            onClick={() => setViewMode('flow')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'flow'
                ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Value Stream
          </button>
        </InfoTooltip>
        <InfoTooltip content={VIEW_DESCRIPTIONS.distillation}>
          <button
            onClick={() => setViewMode('distillation')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'distillation'
                ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Distillation
          </button>
        </InfoTooltip>
        <InfoTooltip content={VIEW_DESCRIPTIONS.strategic}>
          <button
            onClick={() => setViewMode('strategic')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'strategic'
                ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Strategic
          </button>
        </InfoTooltip>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Add buttons - primary creation CTAs */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-neutral-900 rounded-lg px-1.5 py-1">
          {/* Add Stage button - only in Value Stream View */}
          {viewMode === 'flow' && (
            <InfoTooltip content={STAGE_DEFINITION} position="bottom">
              <AddButton
                onClick={handleAddStage}
                icon={<Hash size={14} />}
                label="Stage"
              />
            </InfoTooltip>
          )}

          {/* User/Need buttons: Strategic and Value Stream views (not Distillation) */}
          {viewMode !== 'distillation' && (
            <>
              <InfoTooltip content={USER_DEFINITION} position="bottom">
                <AddButton
                  onClick={handleAddUser}
                  icon={<User size={14} />}
                  label="User"
                />
              </InfoTooltip>
              <InfoTooltip content={USER_NEED_DEFINITION} position="bottom">
                <AddButton
                  onClick={handleAddUserNeed}
                  icon={<Target size={14} />}
                  label="Need"
                />
              </InfoTooltip>
            </>
          )}

          <InfoTooltip content={BOUNDED_CONTEXT_DEFINITION} position="bottom">
            <AddButton
              onClick={handleAddContext}
              icon={<Box size={14} />}
              label="Context"
            />
          </InfoTooltip>
        </div>

        {/* Temporal Mode toggle - only visible in Strategic View */}
        {viewMode === 'strategic' && (
          <>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <InfoTooltip content={TEMPORAL_MODE} position="bottom">
              <div className="flex items-center gap-2 cursor-help">
                <span className="text-xs text-slate-600 dark:text-slate-400">Temporal</span>
                <button
                  onClick={toggleTemporalMode}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                  style={{ backgroundColor: temporalEnabled ? '#3b82f6' : '#cbd5e1' }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: temporalEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            </InfoTooltip>
          </>
        )}

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <SimpleTooltip text="Undo (⌘Z)">
          <IconButton
            onClick={undo}
            icon={<Undo2 size={16} />}
            disabled={!canUndo}
          />
        </SimpleTooltip>
        <SimpleTooltip text="Redo (⌘⇧Z)">
          <IconButton
            onClick={redo}
            icon={<Redo2 size={16} />}
            disabled={!canRedo}
          />
        </SimpleTooltip>

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <SimpleTooltip text="Share project">
          <IconButton
            onClick={() => setShowShareDialog(true)}
            icon={<Share2 size={16} />}
          />
        </SimpleTooltip>
        <SimpleTooltip text="Export project JSON">
          <IconButton
            onClick={handleExport}
            icon={<Download size={16} />}
          />
        </SimpleTooltip>
        <SimpleTooltip text="Import project JSON">
          <IconButton
            onClick={handleImport}
            icon={<Upload size={16} />}
          />
        </SimpleTooltip>

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <CloudStatusIndicator />

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <div className="relative" ref={settingsRef}>
          <SimpleTooltip text="Settings">
            <IconButton
              onClick={() => setShowSettings(!showSettings)}
              icon={<Settings size={16} />}
            />
          </SimpleTooltip>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 z-50">
              <div className="space-y-4">
                {/* View Options Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">View Options</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Context Colors
                      </label>
                      <div className="flex gap-1 bg-slate-100 dark:bg-neutral-700 rounded-md p-1">
                        <button
                          onClick={() => setColorByMode('ownership')}
                          className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                            colorByMode === 'ownership'
                              ? 'bg-white dark:bg-neutral-600 text-slate-900 dark:text-slate-100 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Ownership
                        </button>
                        <button
                          onClick={() => setColorByMode('strategic')}
                          className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                            colorByMode === 'strategic'
                              ? 'bg-white dark:bg-neutral-600 text-slate-900 dark:text-slate-100 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Strategic
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Show Groups</span>
                        <button
                          onClick={toggleShowGroups}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                          style={{ backgroundColor: showGroups ? '#3b82f6' : '#cbd5e1' }}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: showGroups ? 'translateX(18px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Show Relationships</span>
                        <button
                          onClick={toggleShowRelationships}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                          style={{ backgroundColor: showRelationships ? '#3b82f6' : '#cbd5e1' }}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: showRelationships ? 'translateX(18px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                        Available in Flow & Strategic views
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Show Issue Labels</span>
                        <button
                          onClick={toggleIssueLabels}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                          style={{ backgroundColor: showIssueLabels ? '#3b82f6' : '#cbd5e1' }}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: showIssueLabels ? 'translateX(18px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                        Display issue titles on canvas
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Show Team Labels</span>
                        <button
                          onClick={toggleTeamLabels}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                          style={{ backgroundColor: showTeamLabels ? '#3b82f6' : '#cbd5e1' }}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: showTeamLabels ? 'translateX(18px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                        Display team names on canvas
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Group Opacity: {Math.round(groupOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={groupOpacity * 100}
                        onChange={(e) => setGroupOpacity(parseInt(e.target.value) / 100)}
                        className="w-full h-2 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                          accentColor: theme === 'light' ? '#3b82f6' : '#60a5fa'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-neutral-700" />

                {/* Help Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Help</h3>

                  {/* Welcome Guide */}
                  <button
                    onClick={() => {
                      resetWelcome()
                      setShowSettings(false)
                    }}
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Welcome Guide
                  </button>

                  {/* Getting Started Guide */}
                  <button
                    onClick={() => {
                      setShowGettingStartedGuide(true)
                      setShowSettings(false)
                    }}
                    className="block mt-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Getting Started Guide
                  </button>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Show concept tooltips</span>
                    <button
                      onClick={toggleHelpTooltips}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                      style={{ backgroundColor: showHelpTooltips ? '#3b82f6' : '#cbd5e1' }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{ transform: showHelpTooltips ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                    Hover explanations for DDD & Wardley concepts
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-neutral-700" />

                {/* Display Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Display</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {theme === 'light' ? <Sun size={14} className="text-slate-600 dark:text-slate-400" /> : <Moon size={14} className="text-slate-600 dark:text-slate-400" />}
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                      </span>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                      style={{ backgroundColor: theme === 'dark' ? '#3b82f6' : '#cbd5e1' }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{ transform: theme === 'dark' ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-neutral-700" />

                {/* Integrations Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Integrations</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Use CodeCohesion API</span>
                    <button
                      onClick={() => {
                        const newValue = !useCodeCohesionAPI
                        setUseCodeCohesionAPI(newValue)
                        localStorage.setItem('contextflow.useCodeCohesionAPI', String(newValue))
                      }}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                      style={{ backgroundColor: useCodeCohesionAPI ? '#3b82f6' : '#cbd5e1' }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{ transform: useCodeCohesionAPI ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                    Enable live repository stats and contributors
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Guide Modal */}
      {showGettingStartedGuide && (
        <GettingStartedGuideModal
          onClose={() => setShowGettingStartedGuide(false)}
          onViewSample={() => {
            setActiveProject('acme-ecommerce')
            setShowGettingStartedGuide(false)
          }}
        />
      )}

      {/* Project List Modal */}
      {showProjectList && (
        <ProjectListModal
          projects={projects}
          activeProjectId={projectId}
          onSelectProject={setActiveProject}
          onCreateProject={createProject}
          onDeleteProject={deleteProject}
          onRenameProject={renameProject}
          onDuplicateProject={duplicateProject}
          onClose={() => setShowProjectList(false)}
        />
      )}

      {/* Import Conflict Dialog */}
      {importConflict && (
        <ImportConflictDialog
          importedProjectName={importConflict.importedProject.name}
          existingProjectName={importConflict.existingProject.name}
          onReplace={handleImportReplace}
          onImportAsNew={handleImportAsNew}
          onCancel={() => setImportConflict(null)}
        />
      )}

      {/* Share Project Dialog */}
      {showShareDialog && projectId && project && (
        <ShareProjectDialog
          projectId={projectId}
          projectName={project.name}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </header>
  )
}

interface IconButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  disabled?: boolean
}

function IconButton({ onClick, icon, label, disabled }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
        disabled
          ? 'text-slate-300 dark:text-neutral-600 cursor-not-allowed'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}

interface AddButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function AddButton({ onClick, icon, label }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm"
    >
      <Plus size={12} className="text-slate-400 dark:text-slate-500" />
      {icon}
      <span>{label}</span>
    </button>
  )
}
