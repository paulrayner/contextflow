import React from 'react'
import { useEditorStore } from '../model/store'
import { ExternalLink, Trash2 } from 'lucide-react'

export function InspectorPanel() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)
  const updateContext = useEditorStore(s => s.updateContext)
  const deleteContext = useEditorStore(s => s.deleteContext)

  if (!project || !selectedContextId) {
    return null
  }

  const context = project.contexts.find(c => c.id === selectedContextId)
  if (!context) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400">
        Context not found.
      </div>
    )
  }

  // Find assigned repos
  const assignedRepos = project.repos.filter(r => r.contextId === context.id)

  // Get team names from repos
  const teamIds = new Set(assignedRepos.flatMap(r => r.teamIds))
  const teams = project.teams.filter(t => teamIds.has(t.id))

  const handleUpdate = (updates: Partial<typeof context>) => {
    updateContext(context.id, updates)
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${context.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
      deleteContext(context.id)
    }
  }

  return (
    <div className="space-y-5">
      {/* Name and Delete Button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={context.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="flex-1 font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1 -ml-2 outline-none"
        />
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Delete context"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Purpose */}
      <Section label="Purpose">
        <textarea
          value={context.purpose || ''}
          onChange={(e) => handleUpdate({ purpose: e.target.value })}
          placeholder="What does this context do for the business?"
          rows={3}
          className="w-full text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1.5 outline-none resize-none"
        />
      </Section>

      {/* Strategic Classification */}
      <Section label="Strategic Classification">
        <select
          value={context.strategicClassification || ''}
          onChange={(e) => handleUpdate({ strategicClassification: e.target.value as any })}
          className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">Not set</option>
          <option value="core">Core</option>
          <option value="supporting">Supporting</option>
          <option value="generic">Generic</option>
        </select>
      </Section>

      {/* Boundary Integrity */}
      <Section label="Boundary Integrity">
        <select
          value={context.boundaryIntegrity || ''}
          onChange={(e) => handleUpdate({ boundaryIntegrity: e.target.value as any })}
          className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">Not set</option>
          <option value="strong">Strong</option>
          <option value="moderate">Moderate</option>
          <option value="weak">Weak</option>
        </select>
        <textarea
          value={context.boundaryNotes || ''}
          onChange={(e) => handleUpdate({ boundaryNotes: e.target.value })}
          placeholder="Why is the boundary strong or weak?"
          rows={2}
          className="w-full mt-2 text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1.5 outline-none resize-none"
        />
      </Section>

      {/* Code Size */}
      <Section label="Code Size">
        <select
          value={context.codeSize?.bucket || ''}
          onChange={(e) => handleUpdate({ codeSize: { ...context.codeSize, bucket: e.target.value as any } })}
          className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">Not set</option>
          <option value="tiny">Tiny</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
        </select>
      </Section>

      {/* Evolution Stage */}
      <Section label="Evolution Stage">
        <select
          value={context.evolutionStage || ''}
          onChange={(e) => handleUpdate({ evolutionStage: e.target.value as any })}
          className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">Not set</option>
          <option value="genesis">Genesis</option>
          <option value="custom-built">Custom-built</option>
          <option value="product/rental">Product/Rental</option>
          <option value="commodity/utility">Commodity/Utility</option>
        </select>
      </Section>

      {/* Flags */}
      <Section label="Attributes">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={context.isLegacy || false}
              onChange={(e) => handleUpdate({ isLegacy: e.target.checked })}
              className="rounded border-slate-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">Legacy system</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={context.isExternal || false}
              onChange={(e) => handleUpdate({ isExternal: e.target.checked })}
              className="rounded border-slate-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">External context</span>
          </label>
        </div>
      </Section>

      {/* Notes */}
      <Section label="Notes">
        <textarea
          value={context.notes || ''}
          onChange={(e) => handleUpdate({ notes: e.target.value })}
          placeholder="Assumptions, politics, bottlenecks, risks..."
          rows={4}
          className="w-full text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1.5 outline-none resize-none"
        />
      </Section>

      {/* Assigned Repos */}
      {assignedRepos.length > 0 && (
        <Section label="Assigned Repositories">
          <div className="space-y-2">
            {assignedRepos.map(repo => (
              <div key={repo.id} className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
                <div className="font-medium text-xs">{repo.name}</div>
                {repo.remoteUrl && (
                  <a
                    href={repo.remoteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1 mt-1 hover:underline"
                  >
                    {repo.remoteUrl}
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Teams */}
      {teams.length > 0 && (
        <Section label="Teams">
          <div className="space-y-1">
            {teams.map(team => (
              <div key={team.id} className="text-neutral-700 dark:text-neutral-300">
                {team.name}
                {team.topologyType && (
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs ml-2">
                    ({team.topologyType})
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// Helper components
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-[13px]">{children}</div>
    </div>
  )
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const colorClasses = {
    core: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    supporting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    generic: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    strong: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    weak: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  }

  const className = colorClasses[color as keyof typeof colorClasses] || colorClasses.neutral

  return (
    <span className={`${className} px-2.5 py-1 rounded-md text-xs font-medium inline-block`}>
      {children}
    </span>
  )
}

function getClassificationColor(classification: string): string {
  switch (classification) {
    case 'core': return 'core'
    case 'supporting': return 'supporting'
    case 'generic': return 'generic'
    default: return 'neutral'
  }
}

function getIntegrityColor(integrity: string): string {
  switch (integrity) {
    case 'strong': return 'strong'
    case 'moderate': return 'moderate'
    case 'weak': return 'weak'
    default: return 'neutral'
  }
}
