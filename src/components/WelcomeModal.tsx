import React from 'react'
import { X, Layers, Network, Users, TrendingUp, Plus } from 'lucide-react'
import { ProjectCreateDialog } from './ProjectCreateDialog'

interface SampleProject {
  id: string
  name: string
  description: string
}

const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'acme-ecommerce',
    name: 'ACME E-Commerce',
    description: 'A complete online store with 20+ systems',
  },
  {
    id: 'elan-warranty',
    name: 'Elan Warranty',
    description: 'Extended warranty service (has tutorial)',
  },
  {
    id: 'cbioportal',
    name: 'cBioPortal',
    description: 'Genomics research platform',
  },
]

interface WelcomeModalProps {
  onSelectProject: (projectId: string) => void
  onCreateProject: (name: string) => void
  onClose: () => void
}

export function WelcomeModal({ onSelectProject, onCreateProject, onClose }: WelcomeModalProps) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)

  const handleExplore = () => {
    if (selectedProjectId) {
      onSelectProject(selectedProjectId)
    }
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
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[520px] max-w-[90vw] max-h-[90vh] border border-slate-200 dark:border-neutral-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Welcome to ContextFlow
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Intro */}
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            ContextFlow helps you map your software systems visually — showing how different
            parts of your architecture connect and serve your users.
          </p>

          {/* Features */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <FeatureItem
              icon={<Layers size={16} />}
              text="Map your system's major parts"
            />
            <FeatureItem
              icon={<Network size={16} />}
              text="Show how they depend on each other"
            />
            <FeatureItem
              icon={<Users size={16} />}
              text="Connect systems to user needs"
            />
            <FeatureItem
              icon={<TrendingUp size={16} />}
              text="Identify which parts are most important"
            />
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-slate-200 dark:border-neutral-700" />

          {/* Getting Started */}
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
            How would you like to start?
          </h3>

          {/* Create New Project - Primary CTA */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Create New Project
          </button>

          {/* Divider with "or" */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white dark:bg-neutral-800 text-xs text-slate-400 dark:text-slate-500">
                or explore a sample
              </span>
            </div>
          </div>

          {/* Sample Projects Section - Secondary */}
          <div className="space-y-2">
            {SAMPLE_PROJECTS.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedProjectId === project.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-750'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedProjectId === project.id
                        ? 'border-blue-500'
                        : 'border-slate-300 dark:border-neutral-600'
                    }`}
                  >
                    {selectedProjectId === project.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {project.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {project.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Explore Button */}
          {selectedProjectId && (
            <button
              onClick={handleExplore}
              className="w-full mt-3 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Explore {SAMPLE_PROJECTS.find(p => p.id === selectedProjectId)?.name}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
      <span className="text-blue-500 dark:text-blue-400">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
