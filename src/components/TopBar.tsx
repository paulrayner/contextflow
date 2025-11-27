import React, { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../model/store'
import { Undo2, Redo2, Plus, Download, Upload, Sun, Moon, User, Settings, Box, Hash, Target } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { InfoTooltip } from './InfoTooltip'
import { VIEW_DESCRIPTIONS, STAGE_DEFINITION } from '../model/conceptDefinitions'

export function TopBar() {
  const settingsRef = useRef<HTMLDivElement>(null)
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const projects = useEditorStore(s => s.projects)
  const viewMode = useEditorStore(s => s.activeViewMode)
  const setViewMode = useEditorStore(s => s.setViewMode)
  const setActiveProject = useEditorStore(s => s.setActiveProject)
  const canUndo = useEditorStore(s => s.undoStack.length > 0)
  const canRedo = useEditorStore(s => s.redoStack.length > 0)
  const undo = useEditorStore(s => s.undo)
  const redo = useEditorStore(s => s.redo)
  const addContext = useEditorStore(s => s.addContext)
  const addActor = useEditorStore(s => s.addActor)
  const addUserNeed = useEditorStore(s => s.addUserNeed)
  const addFlowStage = useEditorStore(s => s.addFlowStage)
  const exportProject = useEditorStore(s => s.exportProject)
  const importProject = useEditorStore(s => s.importProject)
  const showGroups = useEditorStore(s => s.showGroups)
  const showRelationships = useEditorStore(s => s.showRelationships)
  const toggleShowGroups = useEditorStore(s => s.toggleShowGroups)
  const toggleShowRelationships = useEditorStore(s => s.toggleShowRelationships)
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const toggleHelpTooltips = useEditorStore(s => s.toggleHelpTooltips)
  const groupOpacity = useEditorStore(s => s.groupOpacity)
  const setGroupOpacity = useEditorStore(s => s.setGroupOpacity)
  const toggleTemporalMode = useEditorStore(s => s.toggleTemporalMode)
  const temporalEnabled = project?.temporal?.enabled || false

  const { theme, toggleTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
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
          importProject(json)
        } catch (err) {
          alert('Failed to import project: Invalid JSON file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleAddContext = () => {
    const name = prompt('Context name:')
    if (!name) return
    addContext(name)
  }

  const handleAddActor = () => {
    const name = prompt('Actor name:')
    if (!name) return
    addActor(name)
  }

  const handleAddUserNeed = () => {
    const name = prompt('User need name:')
    if (!name) return
    addUserNeed(name)
  }

  const handleAddStage = () => {
    const label = prompt('Stage label:')
    if (!label) return

    try {
      addFlowStage(label.trim())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add stage')
    }
  }

  return (
    <header className="flex items-center gap-4 px-5 py-3 border-b border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      {/* Logo */}
      <div className="font-semibold text-base text-slate-800 dark:text-slate-100">
        ContextFlow
      </div>

      {/* Project Selector */}
      {project && (
        <>
          <div className="text-slate-400 dark:text-slate-500">•</div>
          <select
            value={projectId || ''}
            onChange={(e) => setActiveProject(e.target.value)}
            className="text-sm text-slate-600 dark:text-slate-300 font-medium bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1 pr-6 outline-none cursor-pointer max-w-[220px] truncate"
          >
            {Object.values(projects)
              .sort((a, b) => {
                // Order: Empty Project, Elan Warranty, ACME, cBioPortal
                const order = { 'empty-project': 0, 'elan-warranty': 1, 'acme-ecommerce': 2, 'cbioportal': 3 }
                return (order[a.id as keyof typeof order] ?? 999) - (order[b.id as keyof typeof order] ?? 999)
              })
              .map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
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

          {/* Actor/Need buttons: Strategic and Value Stream views (not Distillation) */}
          {viewMode !== 'distillation' && (
            <>
              <AddButton
                onClick={handleAddActor}
                icon={<User size={14} />}
                label="Actor"
                tooltip="Add new actor"
              />
              <AddButton
                onClick={handleAddUserNeed}
                icon={<Target size={14} />}
                label="Need"
                tooltip="Add new user need"
              />
            </>
          )}

          <AddButton
            onClick={handleAddContext}
            icon={<Box size={14} />}
            label="Context"
            tooltip="Add new bounded context"
          />
        </div>

        {/* Temporal Mode toggle - only visible in Strategic View */}
        {viewMode === 'strategic' && (
          <>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Temporal</span>
              <button
                onClick={toggleTemporalMode}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                style={{ backgroundColor: temporalEnabled ? '#3b82f6' : '#cbd5e1' }}
                title="Enable temporal mode"
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: temporalEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </>
        )}

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <IconButton
          onClick={undo}
          icon={<Undo2 size={16} />}
          disabled={!canUndo}
          tooltip="Undo (⌘Z)"
        />
        <IconButton
          onClick={redo}
          icon={<Redo2 size={16} />}
          disabled={!canRedo}
          tooltip="Redo (⌘⇧Z)"
        />

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <IconButton
          onClick={handleExport}
          icon={<Download size={16} />}
          tooltip="Export project JSON"
        />
        <IconButton
          onClick={handleImport}
          icon={<Upload size={16} />}
          tooltip="Import project JSON"
        />

        <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />

        <div className="relative" ref={settingsRef}>
          <IconButton
            onClick={() => setShowSettings(!showSettings)}
            icon={<Settings size={16} />}
            tooltip="Settings"
          />

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 z-50">
              <div className="space-y-4">
                {/* Appearance Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Appearance</h3>
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

                {/* Help Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Help</h3>
                  <div className="flex items-center justify-between">
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

                {/* View Filters Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">View Filters</h3>
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

                <div className="border-t border-slate-200 dark:border-neutral-700" />

                {/* Display Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Display</h3>
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
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

interface IconButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  disabled?: boolean
  tooltip?: string
}

function IconButton({ onClick, icon, label, disabled, tooltip }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
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
  tooltip?: string
}

function AddButton({ onClick, icon, label, tooltip }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm"
    >
      <Plus size={12} className="text-slate-400 dark:text-slate-500" />
      {icon}
      <span>{label}</span>
    </button>
  )
}
