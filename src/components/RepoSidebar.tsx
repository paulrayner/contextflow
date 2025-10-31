import React from 'react'
import { ExternalLink } from 'lucide-react'
import type { Repo, Team } from '../model/types'

interface RepoSidebarProps {
  repos: Repo[]
  teams: Team[]
  onRepoAssign: (repoId: string, contextId: string) => void
}

export function RepoSidebar({ repos, teams, onRepoAssign }: RepoSidebarProps) {
  const getTeamsForRepo = (repo: Repo): Team[] => {
    return teams.filter(t => repo.teamIds.includes(t.id))
  }

  const handleDragStart = (e: React.DragEvent, repoId: string) => {
    e.dataTransfer.setData('application/contextflow-repo', repoId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="space-y-2">
      {repos.map(repo => {
        const repoTeams = getTeamsForRepo(repo)

        return (
          <div
            key={repo.id}
            draggable
            onDragStart={(e) => handleDragStart(e, repo.id)}
            className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded p-2.5 cursor-move hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            {/* Repo name */}
            <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
              {repo.name}
            </div>

            {/* Remote URL */}
            {repo.remoteUrl && (
              <a
                href={repo.remoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-1 hover:underline mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate">{repo.remoteUrl}</span>
                <ExternalLink size={10} className="flex-shrink-0" />
              </a>
            )}

            {/* Team chips */}
            {repoTeams.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {repoTeams.map(team => (
                  <span
                    key={team.id}
                    className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-medium"
                    title={team.topologyType ? `${team.name} (${team.topologyType})` : team.name}
                  >
                    {team.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
