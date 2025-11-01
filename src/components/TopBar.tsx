import React from 'react'
import { useEditorStore } from '../model/store'
import { Undo2, Redo2, ZoomIn, Plus, Download, Upload, Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export function TopBar() {
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
  const fitToMap = useEditorStore(s => s.fitToMap)
  const addContext = useEditorStore(s => s.addContext)
  const exportProject = useEditorStore(s => s.exportProject)
  const importProject = useEditorStore(s => s.importProject)

  const { theme, toggleTheme } = useTheme()

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
            className="text-sm text-slate-600 dark:text-slate-300 font-medium bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1 outline-none cursor-pointer"
          >
            {Object.values(projects).map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* View Toggle */}
      <div className="ml-8 flex items-center bg-slate-100 dark:bg-neutral-900 rounded-lg p-1">
        <button
          onClick={() => setViewMode('flow')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            viewMode === 'flow'
              ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Flow View
        </button>
        <button
          onClick={() => setViewMode('strategic')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            viewMode === 'strategic'
              ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Strategic View
        </button>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <IconButton
          onClick={handleAddContext}
          icon={<Plus size={16} />}
          label="Add Context"
          tooltip="Add new bounded context"
        />

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
          onClick={fitToMap}
          icon={<ZoomIn size={16} />}
          label="Fit to Map"
          tooltip="Fit all contexts to view"
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

        <IconButton
          onClick={toggleTheme}
          icon={theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          tooltip={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        />
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
