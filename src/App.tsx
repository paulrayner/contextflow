import React from 'react'
import { useEditorStore } from './model/store'

function App() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const viewMode = useEditorStore(s => s.activeViewMode)

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <header className="flex items-center gap-3 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <div className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">
          ContextFlow {project ? `– ${project.name}` : ''}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
          <span>{viewMode === 'flow' ? 'Flow View' : 'Strategic View'}</span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-[240px_1fr_320px] overflow-hidden">
        {/* Repo Sidebar */}
        <aside className="border-r border-neutral-200 dark:border-neutral-700 p-3 text-xs overflow-y-auto">
          <div className="font-semibold mb-2">Unassigned Repos</div>
          <div className="text-neutral-500 dark:text-neutral-400">
            {/* TODO RepoSidebar list */}
            (coming soon)
          </div>
        </aside>

        {/* Canvas Area */}
        <section className="relative bg-neutral-100 dark:bg-neutral-800">
          {/* TODO CanvasArea (React Flow) */}
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs">
            CanvasArea placeholder
          </div>
        </section>

        {/* Inspector Panel */}
        <aside className="border-l border-neutral-200 dark:border-neutral-700 p-3 text-xs overflow-y-auto">
          <div className="font-semibold mb-2">Inspector</div>
          <div className="text-neutral-500 dark:text-neutral-400">
            {/* TODO InspectorPanel */}
            Select a context to edit details
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
