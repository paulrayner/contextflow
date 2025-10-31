import React from 'react'
import { useEditorStore } from './model/store'
import { CanvasArea } from './components/CanvasArea'
import { InspectorPanel } from './components/InspectorPanel'
import { TopBar } from './components/TopBar'
import { RepoSidebar } from './components/RepoSidebar'
import { GroupCreateDialog } from './components/GroupCreateDialog'
import { Users, X } from 'lucide-react'

function App() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)
  const selectedGroupId = useEditorStore(s => s.selectedGroupId)
  const selectedContextIds = useEditorStore(s => s.selectedContextIds)
  const clearContextSelection = useEditorStore(s => s.clearContextSelection)
  const createGroup = useEditorStore(s => s.createGroup)

  const [showGroupDialog, setShowGroupDialog] = React.useState(false)

  const unassignedRepos = React.useMemo(() => {
    return project?.repos?.filter(r => !r.contextId) || []
  }, [project?.repos])

  const [isRepoSidebarCollapsed, setIsRepoSidebarCollapsed] = React.useState(() => {
    const stored = localStorage.getItem('contextflow.repoSidebar.collapsed')
    return stored === 'true'
  })

  const hasUnassignedRepos = unassignedRepos.length > 0
  const showRepoSidebar = hasUnassignedRepos && !isRepoSidebarCollapsed
  const hasRightSidebar = !!selectedContextId || !!selectedGroupId

  const gridCols = showRepoSidebar && hasRightSidebar ? 'grid-cols-[240px_1fr_320px]'
                 : showRepoSidebar ? 'grid-cols-[240px_1fr]'
                 : hasRightSidebar ? 'grid-cols-[1fr_320px]'
                 : 'grid-cols-[1fr]'

  const toggleRepoSidebar = () => {
    setIsRepoSidebarCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem('contextflow.repoSidebar.collapsed', String(newValue))
      return newValue
    })
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-neutral-900 dark:text-neutral-100">
      <TopBar />

      {/* Multi-select floating panel */}
      {selectedContextIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-4">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {selectedContextIds.length} context{selectedContextIds.length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={() => setShowGroupDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            <Users size={14} />
            Create Group
          </button>
          <button
            onClick={clearContextSelection}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Group creation dialog */}
      {showGroupDialog && (
        <GroupCreateDialog
          contextCount={selectedContextIds.length}
          onConfirm={(label, color, notes) => {
            createGroup(label, color, notes)
            setShowGroupDialog(false)
          }}
          onCancel={() => setShowGroupDialog(false)}
        />
      )}

      <main className={`flex-1 grid ${gridCols} overflow-hidden`}>
        {/* Repo Sidebar - collapsible */}
        {showRepoSidebar && (
          <aside className="border-r border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col">
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Unassigned Repos ({unassignedRepos.length})
              </div>
              <button
                onClick={toggleRepoSidebar}
                className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Hide sidebar"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 3L3 9M3 3l6 6" />
                </svg>
              </button>
            </div>
            <div className="flex-1 px-4 pb-4 text-xs overflow-y-auto">
              <RepoSidebar
                repos={unassignedRepos}
                teams={project?.teams || []}
                onRepoAssign={(repoId, contextId) => {
                  // Will be implemented with drag-and-drop
                }}
              />
            </div>
          </aside>
        )}

        {/* Canvas Area */}
        <section className="relative bg-slate-100 dark:bg-neutral-800">
          {/* Show button when sidebar is collapsed */}
          {hasUnassignedRepos && isRepoSidebarCollapsed && (
            <button
              onClick={toggleRepoSidebar}
              className="absolute left-2 top-2 z-10 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded px-2 py-1.5 text-xs text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-slate-300 shadow-sm"
              title="Show unassigned repos"
            >
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 9l3-3-3-3" />
                </svg>
                <span className="font-medium">Repos ({unassignedRepos.length})</span>
              </div>
            </button>
          )}
          <CanvasArea />
        </section>

        {/* Inspector Panel - shown when context or group is selected */}
        {(selectedContextId || selectedGroupId) && (
          <aside className="border-l border-slate-200 dark:border-neutral-700 p-4 text-xs overflow-y-auto bg-white dark:bg-neutral-800">
            <InspectorPanel />
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
