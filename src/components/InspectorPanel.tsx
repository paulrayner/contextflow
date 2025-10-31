import React from 'react'
import { useEditorStore } from '../model/store'
import { ExternalLink } from 'lucide-react'

export function InspectorPanel() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)

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

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">{context.name}</h3>
      </div>

      {/* Purpose */}
      {context.purpose && (
        <Section label="Purpose">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{context.purpose}</p>
        </Section>
      )}

      {/* Strategic Classification */}
      {context.strategicClassification && (
        <Section label="Strategic Classification">
          <Badge color={getClassificationColor(context.strategicClassification)}>
            {context.strategicClassification}
          </Badge>
        </Section>
      )}

      {/* Boundary Integrity */}
      {context.boundaryIntegrity && (
        <Section label="Boundary Integrity">
          <Badge color={getIntegrityColor(context.boundaryIntegrity)}>
            {context.boundaryIntegrity}
          </Badge>
          {context.boundaryNotes && (
            <p className="text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
              {context.boundaryNotes}
            </p>
          )}
        </Section>
      )}

      {/* Code Size */}
      {context.codeSize?.bucket && (
        <Section label="Code Size">
          <Badge color="neutral">{context.codeSize.bucket}</Badge>
        </Section>
      )}

      {/* Evolution Stage */}
      {context.evolutionStage && (
        <Section label="Evolution Stage">
          <Badge color="neutral">{context.evolutionStage}</Badge>
        </Section>
      )}

      {/* Flags */}
      <Section label="Attributes">
        <div className="flex gap-2">
          {context.isLegacy && <Badge color="amber">Legacy</Badge>}
          {context.isExternal && <Badge color="gray">External</Badge>}
          {!context.isLegacy && !context.isExternal && (
            <span className="text-neutral-500 dark:text-neutral-400 text-xs">None</span>
          )}
        </div>
      </Section>

      {/* Notes */}
      {context.notes && (
        <Section label="Notes">
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {context.notes}
          </p>
        </Section>
      )}

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
