import React from 'react'
import { useEditorStore } from '../model/store'
import { ExternalLink, Trash2, X, Users, Plus, ArrowRight, ArrowLeftRight, GitBranch, Clock, ChevronDown, ChevronRight, HelpCircle, BookOpen, AlertTriangle, AlertOctagon, Info } from 'lucide-react'
import { RelationshipCreateDialog } from './RelationshipCreateDialog'
import { PatternsGuideModal } from './PatternsGuideModal'
import { Switch } from './Switch'
import { config } from '../config'
import { interpolatePosition, classifyFromStrategicPosition } from '../lib/temporal'
import { classifyFromStrategicPosition as getEvolutionStage } from '../model/classification'
import {
  PATTERN_DEFINITIONS,
  POWER_DYNAMICS_ICONS,
  getPatternDefinition,
} from '../model/patternDefinitions'
import { InfoTooltip } from './InfoTooltip'
import { SimpleTooltip } from './SimpleTooltip'
import { EVOLUTION_STAGES, STRATEGIC_CLASSIFICATIONS, BOUNDARY_INTEGRITY, CODE_SIZE_TIERS, EXTERNAL_CONTEXT, LEGACY_CONTEXT, EXTERNAL_USER, POWER_DYNAMICS, COMMUNICATION_MODE, OWNERSHIP_DEFINITIONS } from '../model/conceptDefinitions'
import type { ContextOwnership } from '../model/types'

// Shared input styles for consistency across all inspector panels
const INPUT_TITLE_CLASS = "w-full font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-0.5 -ml-2 outline-none"

const INPUT_TEXT_CLASS = "w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"

const TEXTAREA_CLASS = "w-full text-xs text-slate-700 dark:text-slate-300 leading-normal bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1 outline-none resize-none"

export function InspectorPanel() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)
  const selectedGroupId = useEditorStore(s => s.selectedGroupId)
  const selectedUserId = useEditorStore(s => s.selectedUserId)
  const selectedUserNeedId = useEditorStore(s => s.selectedUserNeedId)
  const selectedRelationshipId = useEditorStore(s => s.selectedRelationshipId)
  const selectedUserNeedConnectionId = useEditorStore(s => s.selectedUserNeedConnectionId)
  const selectedNeedContextConnectionId = useEditorStore(s => s.selectedNeedContextConnectionId)
  const selectedStageIndex = useEditorStore(s => s.selectedStageIndex)
  const selectedTeamId = useEditorStore(s => s.selectedTeamId)
  const viewMode = useEditorStore(s => s.activeViewMode)
  const updateContext = useEditorStore(s => s.updateContext)
  const deleteContext = useEditorStore(s => s.deleteContext)
  const updateGroup = useEditorStore(s => s.updateGroup)
  const deleteGroup = useEditorStore(s => s.deleteGroup)
  const removeContextFromGroup = useEditorStore(s => s.removeContextFromGroup)
  const addContextToGroup = useEditorStore(s => s.addContextToGroup)
  const addContextsToGroup = useEditorStore(s => s.addContextsToGroup)
  const unassignRepo = useEditorStore(s => s.unassignRepo)
  const addRelationship = useEditorStore(s => s.addRelationship)
  const deleteRelationship = useEditorStore(s => s.deleteRelationship)
  const updateRelationship = useEditorStore(s => s.updateRelationship)
  const swapRelationshipDirection = useEditorStore(s => s.swapRelationshipDirection)
  const updateUser = useEditorStore(s => s.updateUser)
  const setViewMode = useEditorStore(s => s.setViewMode)
  const deleteUser = useEditorStore(s => s.deleteUser)
  const createUserConnection = useEditorStore(s => s.createUserConnection)
  const deleteUserConnection = useEditorStore(s => s.deleteUserConnection)
  const updateUserNeed = useEditorStore(s => s.updateUserNeed)
  const deleteUserNeed = useEditorStore(s => s.deleteUserNeed)
  const createUserNeedConnection = useEditorStore(s => s.createUserNeedConnection)
  const deleteUserNeedConnection = useEditorStore(s => s.deleteUserNeedConnection)
  const updateUserNeedConnection = useEditorStore(s => s.updateUserNeedConnection)
  const createNeedContextConnection = useEditorStore(s => s.createNeedContextConnection)
  const deleteNeedContextConnection = useEditorStore(s => s.deleteNeedContextConnection)
  const updateNeedContextConnection = useEditorStore(s => s.updateNeedContextConnection)
  const updateFlowStage = useEditorStore(s => s.updateFlowStage)
  const deleteFlowStage = useEditorStore(s => s.deleteFlowStage)
  const setSelectedStage = useEditorStore(s => s.setSelectedStage)
  const setSelectedTeam = useEditorStore(s => s.setSelectedTeam)
  const updateTeam = useEditorStore(s => s.updateTeam)
  const addTeam = useEditorStore(s => s.addTeam)
  const deleteTeam = useEditorStore(s => s.deleteTeam)
  const addContextIssue = useEditorStore(s => s.addContextIssue)
  const updateContextIssue = useEditorStore(s => s.updateContextIssue)
  const deleteContextIssue = useEditorStore(s => s.deleteContextIssue)
  const assignTeamToContext = useEditorStore(s => s.assignTeamToContext)
  const unassignTeamFromContext = useEditorStore(s => s.unassignTeamFromContext)

  // Temporal state
  const currentDate = useEditorStore(s => s.temporal.currentDate)
  const activeKeyframeId = useEditorStore(s => s.temporal.activeKeyframeId)

  const [expandedTeamId, setExpandedTeamId] = React.useState<string | null>(null)
  const [expandedRepoId, setExpandedRepoId] = React.useState<string | null>(null)
  const [showRelationshipDialog, setShowRelationshipDialog] = React.useState(false)
  const [showPatternDetails, setShowPatternDetails] = React.useState(false)
  const [showPatternsGuide, setShowPatternsGuide] = React.useState(false)
  const [useCodeCohesionAPI, setUseCodeCohesionAPI] = React.useState(() => {
    const stored = localStorage.getItem('contextflow.useCodeCohesionAPI')
    return stored === null ? true : stored === 'true' // Default to true if not set
  })

  const handleToggleAPI = (checked: boolean) => {
    setUseCodeCohesionAPI(checked)
    localStorage.setItem('contextflow.useCodeCohesionAPI', String(checked))
  }

  if (!project) {
    return null
  }

  // Show group details if group is selected
  if (selectedGroupId) {
    const group = project.groups.find(g => g.id === selectedGroupId)
    if (!group) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          Group not found.
        </div>
      )
    }

    const handleDeleteGroup = () => {
      if (window.confirm(`Delete group "${group.label}"? Member contexts will not be deleted. This can be undone with Cmd/Ctrl+Z.`)) {
        deleteGroup(group.id)
      }
    }

    const memberContexts = project.contexts.filter(c => group.contextIds.includes(c.id))
    const availableContexts = project.contexts.filter(c => !group.contextIds.includes(c.id))

    const handleAddAllContexts = () => {
      if (availableContexts.length > 0) {
        addContextsToGroup(group.id, availableContexts.map(c => c.id))
      }
    }

    return (
      <div className="space-y-5">
        {/* Label */}
        <div>
          <input
            type="text"
            value={group.label}
            onChange={(e) => updateGroup(group.id, { label: e.target.value })}
            className={INPUT_TITLE_CLASS}
          />
        </div>

        {/* Notes */}
        <Section label="Notes">
          <textarea
            value={group.notes || ''}
            onChange={(e) => updateGroup(group.id, { notes: e.target.value })}
            placeholder="Describe this group..."
            rows={2}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* Member Contexts */}
        <Section label={`Member Contexts (${memberContexts.length})`}>
          <div className="space-y-1">
            {memberContexts.map(context => (
              <div
                key={context.id}
                className="flex items-center gap-2 group"
              >
                <button
                  onClick={() => useEditorStore.setState({ selectedContextId: context.id, selectedGroupId: null })}
                  className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                >
                  {context.name}
                </button>
                <button
                  onClick={() => removeContextFromGroup(group.id, context.id)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from group"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Add Contexts to Group */}
        {availableContexts.length > 0 && (
          <Section label={`Add Contexts (${availableContexts.length} available)`}>
            <div className="space-y-2">
              <div className="space-y-1">
                {availableContexts.map(context => (
                  <button
                    key={context.id}
                    onClick={() => addContextToGroup(group.id, context.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 text-xs transition-colors text-left"
                  >
                    <Plus size={12} className="flex-shrink-0" />
                    {context.name}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddAllContexts}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors border border-blue-200 dark:border-blue-800"
              >
                <Plus size={12} />
                Add All Available
              </button>
            </div>
          </Section>
        )}

        {/* Delete Group - at bottom to avoid confusion with close button */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleDeleteGroup}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={14} />
            Delete Group
          </button>
        </div>
      </div>
    )
  }

  // Show user details if user is selected
  if (selectedUserId) {
    const user = project.users?.find(u => u.id === selectedUserId)
    if (!user) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          User not found.
        </div>
      )
    }

    // Find connections for this user (User → User Need)
    const connections = (project.userNeedConnections || []).filter(uc => uc.userId === user.id)
    const connectedUserNeeds = connections.map(conn => {
      const userNeed = project.userNeeds?.find(un => un.id === conn.userNeedId)
      return { connection: conn, userNeed }
    }).filter(item => item.userNeed)

    const handleUpdate = (updates: Partial<typeof user>) => {
      updateUser(user.id, updates)
    }

    const handleDelete = () => {
      if (window.confirm(`Delete user "${user.name}"? This will also delete all connections to user needs. This can be undone with Cmd/Ctrl+Z.`)) {
        deleteUser(user.id)
      }
    }

    return (
      <div className="space-y-5">
        {/* Name */}
        <div>
          <input
            type="text"
            value={user.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className={INPUT_TITLE_CLASS}
          />
        </div>

        {/* Description */}
        <Section label="Description">
          <textarea
            value={user.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            placeholder="Describe this user type..."
            rows={2}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* External Toggle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Switch
              label="External"
              checked={user.isExternal || false}
              onCheckedChange={(checked) => handleUpdate({ isExternal: checked })}
            />
            <InfoTooltip content={EXTERNAL_USER} position="bottom">
              <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
            </InfoTooltip>
          </div>
        </div>

        {/* Connected User Needs */}
        <Section label={`Connected User Needs (${connectedUserNeeds.length})`}>
          <div className="space-y-1">
            {connectedUserNeeds.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 text-xs italic">
                No connections yet
              </div>
            ) : (
              connectedUserNeeds.map(({ connection, userNeed }) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => useEditorStore.setState({ selectedUserNeedId: userNeed!.id, selectedUserId: null })}
                    className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                  >
                    {userNeed!.name}
                  </button>
                  <button
                    onClick={() => deleteUserNeedConnection(connection.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                    title="Remove connection"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Delete User */}
        <div className="pt-4 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded text-xs font-medium"
          >
            <Trash2 size={14} />
            Delete User
          </button>
        </div>
      </div>
    )
  }

  // Show user need details if userNeed is selected
  if (selectedUserNeedId) {
    const userNeed = project.userNeeds?.find(n => n.id === selectedUserNeedId)
    if (!userNeed) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          User Need not found.
        </div>
      )
    }

    // Find connections for this user need
    const userConnections = (project.userNeedConnections || []).filter(c => c.userNeedId === userNeed.id)
    const connectedUsers = userConnections.map(conn => {
      const user = project.users?.find(u => u.id === conn.userId)
      return { connection: conn, user }
    }).filter(item => item.user)

    const contextConnections = (project.needContextConnections || []).filter(c => c.userNeedId === userNeed.id)
    const connectedContexts = contextConnections.map(conn => {
      const context = project.contexts.find(c => c.id === conn.contextId)
      return { connection: conn, context }
    }).filter(item => item.context)

    const handleUpdate = (updates: Partial<typeof userNeed>) => {
      updateUserNeed(userNeed.id, updates)
    }

    const handleDelete = () => {
      if (confirm(`Delete user need "${userNeed.name}"?`)) {
        deleteUserNeed(userNeed.id)
      }
    }

    return (
      <div className="space-y-4">
        {/* Name */}
        <Section label="User Need">
          <input
            type="text"
            value={userNeed.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className={INPUT_TITLE_CLASS}
          />
        </Section>

        {/* Description */}
        <Section label="Description">
          <textarea
            value={userNeed.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            placeholder="Describe this user need..."
            rows={2}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* Connected Users */}
        <Section label={`Users (${connectedUsers.length})`}>
          <div className="space-y-1">
            {connectedUsers.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 text-xs italic">
                No users connected
              </div>
            ) : (
              connectedUsers.map(({ connection, user }) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => useEditorStore.setState({ selectedUserId: user!.id, selectedUserNeedId: null })}
                    className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                  >
                    {user!.name}
                  </button>
                  <button
                    onClick={() => deleteUserNeedConnection(connection.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                    title="Remove connection"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Connected Contexts */}
        <Section label={`Contexts (${connectedContexts.length})`}>
          <div className="space-y-1">
            {connectedContexts.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 text-xs italic">
                No contexts connected
              </div>
            ) : (
              connectedContexts.map(({ connection, context }) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => useEditorStore.setState({ selectedContextId: context!.id, selectedUserNeedId: null })}
                    className="flex-1 text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                  >
                    {context!.name}
                  </button>
                  <button
                    onClick={() => deleteNeedContextConnection(connection.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                    title="Remove connection"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Delete User Need */}
        <div className="pt-4 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded text-xs font-medium"
          >
            <Trash2 size={14} />
            Delete User Need
          </button>
        </div>
      </div>
    )
  }

  // Show relationship details if relationship is selected
  if (selectedRelationshipId) {
    const relationship = project.relationships.find(r => r.id === selectedRelationshipId)
    if (!relationship) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          Relationship not found.
        </div>
      )
    }

    const fromContext = project.contexts.find(c => c.id === relationship.fromContextId)
    const toContext = project.contexts.find(c => c.id === relationship.toContextId)
    const patternDef = getPatternDefinition(relationship.pattern)

    const handleDeleteRelationship = () => {
      if (window.confirm(`Delete relationship from "${fromContext?.name}" to "${toContext?.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
        deleteRelationship(relationship.id)
      }
    }

    const handlePatternChange = (newPattern: string) => {
      updateRelationship(relationship.id, { pattern: newPattern as any })
    }

    const handleCommunicationModeChange = (e: React.FocusEvent<HTMLInputElement>) => {
      const newValue = e.target.value.trim()
      if (newValue !== relationship.communicationMode) {
        updateRelationship(relationship.id, { communicationMode: newValue || undefined })
      }
    }

    const handleDescriptionChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value.trim()
      if (newValue !== relationship.description) {
        updateRelationship(relationship.id, { description: newValue || undefined })
      }
    }

    return (
      <div className="space-y-5">
        {/* Relationship Title */}
        <div className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
          Relationship
        </div>

        {/* From/To Contexts */}
        <Section label={patternDef?.powerDynamics === 'mutual' || patternDef?.powerDynamics === 'none' ? "Contexts" : "Direction"}>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => useEditorStore.setState({ selectedContextId: fromContext?.id, selectedRelationshipId: null })}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {fromContext?.name || 'Unknown'}
            </button>
            {patternDef?.powerDynamics === 'mutual' ? (
              <ArrowLeftRight size={14} className="text-slate-400" />
            ) : patternDef?.powerDynamics === 'none' ? (
              <span className="text-slate-400 text-sm">·</span>
            ) : (
              <ArrowRight size={14} className="text-slate-400" />
            )}
            <button
              onClick={() => useEditorStore.setState({ selectedContextId: toContext?.id, selectedRelationshipId: null })}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {toContext?.name || 'Unknown'}
            </button>
            {patternDef?.powerDynamics !== 'mutual' && patternDef?.powerDynamics !== 'none' && (
              <button
                onClick={() => swapRelationshipDirection(relationship.id)}
                className="ml-auto p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Swap direction"
              >
                <ArrowLeftRight size={14} />
              </button>
            )}
          </div>
        </Section>

        {/* Pattern (undoable) */}
        <Section label="DDD Pattern">
          <select
            value={relationship.pattern}
            onChange={(e) => handlePatternChange(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
            {PATTERN_DEFINITIONS.map(p => (
              <option key={p.value} value={p.value}>
                {POWER_DYNAMICS_ICONS[p.powerDynamics]} {p.label}
              </option>
            ))}
          </select>
          <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
            {getPatternDefinition(relationship.pattern)?.shortDescription}
          </div>

          {/* Collapsible pattern details */}
          {(() => {
            const patternDef = getPatternDefinition(relationship.pattern)
            if (!patternDef) return null
            return (
              <div className="mt-3">
                <button
                  onClick={() => setShowPatternDetails(!showPatternDetails)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {showPatternDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <HelpCircle size={12} />
                  <span>About this pattern</span>
                </button>

                {showPatternDetails && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-neutral-800 rounded-md border border-slate-200 dark:border-neutral-700 space-y-3">
                    {/* Power dynamics */}
                    <div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Power Dynamics
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="text-base">{POWER_DYNAMICS_ICONS[patternDef.powerDynamics]}</span>
                        {patternDef.powerDynamics === 'upstream' && 'Upstream team has control'}
                        {patternDef.powerDynamics === 'downstream' && 'Downstream team protects itself'}
                        {patternDef.powerDynamics === 'mutual' && 'Shared control between teams'}
                        {patternDef.powerDynamics === 'none' && 'No integration or dependency'}
                      </div>
                    </div>

                    {/* Detailed description */}
                    <div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {patternDef.detailedDescription}
                      </div>
                    </div>

                    {/* When to use */}
                    <div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        When to Use
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-3">
                        {patternDef.whenToUse.map((item, i) => (
                          <li key={i} className="list-disc">{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Example */}
                    <div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Example
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                        {patternDef.example}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* View all patterns link */}
          <button
            onClick={() => setShowPatternsGuide(true)}
            className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <BookOpen size={12} />
            <span>View all patterns</span>
          </button>
        </Section>

        {/* Communication Mode (autosaves) */}
        <Section label={
          <div className="flex items-center gap-1.5">
            <span>Communication Mode</span>
            <InfoTooltip content={COMMUNICATION_MODE} position="bottom">
              <HelpCircle size={12} className="text-slate-400 dark:text-slate-500 cursor-help" />
            </InfoTooltip>
          </div>
        }>
          <input
            type="text"
            defaultValue={relationship.communicationMode || ''}
            onBlur={handleCommunicationModeChange}
            placeholder="e.g., REST API, gRPC, Event Bus..."
            className={INPUT_TEXT_CLASS}
          />
        </Section>

        {/* Description (autosaves) */}
        <Section label="Description">
          <textarea
            defaultValue={relationship.description || ''}
            onBlur={handleDescriptionChange}
            placeholder="Additional details about this relationship..."
            rows={3}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* Delete Relationship */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleDeleteRelationship}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={14} />
            Delete Relationship
          </button>
        </div>

        {/* Patterns Guide Modal */}
        {showPatternsGuide && (
          <PatternsGuideModal onClose={() => setShowPatternsGuide(false)} />
        )}
      </div>
    )
  }

  // Show user-need connection details if connection is selected
  if (selectedUserNeedConnectionId) {
    const connection = project.userNeedConnections?.find(c => c.id === selectedUserNeedConnectionId)
    if (!connection) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          Connection not found.
        </div>
      )
    }

    const user = project.users?.find(u => u.id === connection.userId)
    const userNeed = project.userNeeds?.find(n => n.id === connection.userNeedId)

    const handleDeleteConnection = () => {
      if (window.confirm(`Delete connection from "${user?.name}" to "${userNeed?.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
        deleteUserNeedConnection(connection.id)
      }
    }

    const handleNotesChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value.trim()
      if (newValue !== connection.notes) {
        updateUserNeedConnection(connection.id, { notes: newValue || undefined })
      }
    }

    return (
      <div className="space-y-5">
        {/* Connection Title */}
        <div className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
          User → Need Connection
        </div>

        {/* From/To - User and User Need */}
        <Section label="Connection">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => useEditorStore.setState({ selectedUserId: user?.id, selectedUserNeedConnectionId: null })}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {user?.name || 'Unknown'}
            </button>
            <ArrowRight size={14} className="text-slate-400" />
            <button
              onClick={() => useEditorStore.setState({ selectedUserNeedId: userNeed?.id, selectedUserNeedConnectionId: null })}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {userNeed?.name || 'Unknown'}
            </button>
          </div>
        </Section>

        {/* Notes (autosaves) */}
        <Section label="Notes">
          <textarea
            defaultValue={connection.notes || ''}
            onBlur={handleNotesChange}
            placeholder="Additional details about this connection..."
            rows={3}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* Delete Connection */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleDeleteConnection}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={14} />
            Delete Connection
          </button>
        </div>
      </div>
    )
  }

  // Show need-context connection details if connection is selected
  if (selectedNeedContextConnectionId) {
    const connection = project.needContextConnections?.find(c => c.id === selectedNeedContextConnectionId)
    if (!connection) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          Connection not found.
        </div>
      )
    }

    const userNeed = project.userNeeds?.find(n => n.id === connection.userNeedId)
    const context = project.contexts?.find(c => c.id === connection.contextId)

    const handleDeleteConnection = () => {
      if (window.confirm(`Delete connection from "${userNeed?.name}" to "${context?.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
        deleteNeedContextConnection(connection.id)
      }
    }

    const handleNotesChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value.trim()
      if (newValue !== connection.notes) {
        updateNeedContextConnection(connection.id, { notes: newValue || undefined })
      }
    }

    return (
      <div className="space-y-5">
        {/* Connection Title */}
        <div className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
          Need → Context Connection
        </div>

        {/* From/To - User Need and Context */}
        <Section label="Connection">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => useEditorStore.setState({ selectedUserNeedId: userNeed?.id, selectedNeedContextConnectionId: null })}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {userNeed?.name || 'Unknown'}
            </button>
            <ArrowRight size={14} className="text-slate-400" />
            <button
              onClick={() => useEditorStore.setState({ selectedContextId: context?.id, selectedNeedContextConnectionId: null })}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {context?.name || 'Unknown'}
            </button>
          </div>
        </Section>

        {/* Notes (autosaves) */}
        <Section label="Notes">
          <textarea
            defaultValue={connection.notes || ''}
            onBlur={handleNotesChange}
            placeholder="Additional details about this connection..."
            rows={3}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* Delete Connection */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleDeleteConnection}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={14} />
            Delete Connection
          </button>
        </div>
      </div>
    )
  }

  // Show flow stage details if stage is selected
  if (selectedStageIndex !== null) {
    const stages = project.viewConfig?.flowStages || []
    const stage = stages[selectedStageIndex]
    if (!stage) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          Stage not found.
        </div>
      )
    }

    const handleStageUpdate = (updates: Partial<{ name: string; description: string; owner: string; notes: string }>) => {
      updateFlowStage(selectedStageIndex, updates)
    }

    const handleDeleteStage = () => {
      if (window.confirm(`Delete stage "${stage.name}"? This can be undone with Cmd/Ctrl+Z.`)) {
        deleteFlowStage(selectedStageIndex)
        setSelectedStage(null)
      }
    }

    // Find users and user needs whose positions fall within this stage's boundary
    // Calculate stage boundaries (midpoints between adjacent stages)
    const sortedStages = [...stages].sort((a, b) => a.position - b.position)
    const stageIdx = sortedStages.findIndex(s => s.position === stage.position)
    const prevPosition = stageIdx > 0 ? sortedStages[stageIdx - 1].position : 0
    const nextPosition = stageIdx < sortedStages.length - 1 ? sortedStages[stageIdx + 1].position : 100
    const startBound = stageIdx === 0 ? 0 : (prevPosition + stage.position) / 2
    const endBound = stageIdx === sortedStages.length - 1 ? 100 : (stage.position + nextPosition) / 2

    // Find users in this stage
    const usersInStage = (project.users || []).filter(user => {
      const userPosition = user.position ?? 0
      return userPosition >= startBound && userPosition < endBound
    })

    // Find user needs in this stage
    const userNeedsInStage = (project.userNeeds || []).filter(need => {
      const needPosition = need.position ?? 0
      return needPosition >= startBound && needPosition < endBound
    })

    return (
      <div className="space-y-5">
        {/* Name */}
        <div>
          <input
            type="text"
            value={stage.name}
            onChange={(e) => handleStageUpdate({ name: e.target.value })}
            className={INPUT_TITLE_CLASS}
          />
        </div>

        {/* Description */}
        <Section label="Description">
          <textarea
            value={stage.description || ''}
            onChange={(e) => handleStageUpdate({ description: e.target.value })}
            placeholder="Describe this stage in the user journey..."
            rows={2}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* Owner */}
        <Section label="Owner">
          <input
            type="text"
            value={stage.owner || ''}
            onChange={(e) => handleStageUpdate({ owner: e.target.value })}
            placeholder="Team or person responsible..."
            className={INPUT_TEXT_CLASS}
          />
        </Section>

        {/* Users in Stage */}
        {usersInStage.length > 0 && (
          <Section label={`Users in Stage (${usersInStage.length})`}>
            <div className="space-y-1">
              {usersInStage.map(user => (
                <button
                  key={user.id}
                  onClick={() => useEditorStore.setState({ selectedUserId: user.id, selectedStageIndex: null })}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2"
                >
                  <Users size={12} className="text-blue-500 flex-shrink-0" />
                  {user.name}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* User Needs in Stage */}
        {userNeedsInStage.length > 0 && (
          <Section label={`User Needs in Stage (${userNeedsInStage.length})`}>
            <div className="space-y-1">
              {userNeedsInStage.map(need => (
                <button
                  key={need.id}
                  onClick={() => useEditorStore.setState({ selectedUserNeedId: need.id, selectedStageIndex: null })}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs"
                >
                  {need.name}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        <Section label="Notes">
          <textarea
            value={stage.notes || ''}
            onChange={(e) => handleStageUpdate({ notes: e.target.value })}
            placeholder="Additional notes about this stage..."
            rows={3}
            className={TEXTAREA_CLASS}
          />
        </Section>

        {/* Delete Stage */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleDeleteStage}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={14} />
            Delete Stage
          </button>
        </div>
      </div>
    )
  }

  // Show team details if team is selected
  if (selectedTeamId) {
    const team = project.teams?.find(t => t.id === selectedTeamId)
    if (!team) {
      return (
        <div className="text-neutral-500 dark:text-neutral-400">
          Team not found.
        </div>
      )
    }

    // Find contexts assigned to this team
    const assignedContexts = project.contexts.filter(c => c.teamId === selectedTeamId)

    // Get Team Topology type label
    const topologyLabels: Record<string, string> = {
      'stream-aligned': 'Stream-aligned',
      'platform': 'Platform',
      'enabling': 'Enabling',
      'complicated-subsystem': 'Complicated Subsystem',
    }

    return (
      <div className="space-y-5">
        {/* Name */}
        <div>
          <input
            type="text"
            value={team.name}
            onChange={(e) => updateTeam(team.id, { name: e.target.value })}
            className={INPUT_TITLE_CLASS}
          />
        </div>

        {/* Team Topology Type */}
        <Section label="Team Topology">
          <select
            value={team.topologyType || ''}
            onChange={(e) => updateTeam(team.id, { topologyType: e.target.value as 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem' | 'unknown' || undefined })}
            className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="">Not specified</option>
            <option value="stream-aligned">Stream-aligned</option>
            <option value="platform">Platform</option>
            <option value="enabling">Enabling</option>
            <option value="complicated-subsystem">Complicated Subsystem</option>
          </select>
        </Section>

        {/* Jira Board */}
        <Section label="Jira Board">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={team.jiraBoard || ''}
              onChange={(e) => updateTeam(team.id, { jiraBoard: e.target.value })}
              placeholder="https://jira.example.com/..."
              className="flex-1 text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-neutral-500"
            />
            {team.jiraBoard && (
              <SimpleTooltip text="Open Jira Board">
                <a
                  href={team.jiraBoard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </SimpleTooltip>
            )}
          </div>
        </Section>

        {/* Assigned Contexts */}
        <Section label={`Assigned Contexts (${assignedContexts.length})`}>
          {assignedContexts.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic">
              No contexts assigned to this team
            </div>
          ) : (
            <div className="space-y-1">
              {assignedContexts.map(ctx => (
                <div
                  key={ctx.id}
                  className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-neutral-800 px-2 py-1 rounded"
                >
                  {ctx.name}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Add Team button */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={() => addTeam('New Team')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
          >
            <Plus size={12} />
            Add Team
          </button>
        </div>

        {/* Delete Team button */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (window.confirm(`Delete team "${team.name}"? ${assignedContexts.length > 0 ? `${assignedContexts.length} context${assignedContexts.length > 1 ? 's' : ''} will be unassigned.` : ''}`)) {
                deleteTeam(team.id)
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={14} />
            Delete Team
          </button>
        </div>
      </div>
    )
  }

  // Show context details if context is selected
  if (!selectedContextId) {
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

  // Find groups this context is a member of
  const memberOfGroups = project.groups.filter(g => g.contextIds.includes(context.id))

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
      {/* Name */}
      <div>
        <input
          type="text"
          value={context.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </div>

      {/* Users - between name and purpose, no heading */}
      {(() => {
        const userConns = (project.userConnections || []).filter(uc => uc.contextId === context.id)
        const usersForContext = userConns.map(conn => {
          const user = project.users?.find(u => u.id === conn.userId)
          return { connection: conn, user }
        }).filter(item => item.user)

        return usersForContext.length > 0 ? (
          <div className="space-y-1">
            {usersForContext.map(({ connection, user }) => (
              <div
                key={connection.id}
                className="flex items-center gap-2 group/user"
              >
                <button
                  onClick={() => useEditorStore.setState({ selectedUserId: user!.id, selectedContextId: null })}
                  className="flex-1 text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-400"
                >
                  <Users size={12} className="text-blue-500 flex-shrink-0" />
                  {user!.name}
                </button>
                <button
                  onClick={() => deleteUserConnection(connection.id)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover/user:opacity-100"
                  title="Remove user connection"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : null
      })()}

      {/* Purpose - no section header */}
      <textarea
        value={context.purpose || ''}
        onChange={(e) => handleUpdate({ purpose: e.target.value })}
        placeholder="What does this context do for the business?"
        rows={2}
        className={TEXTAREA_CLASS}
      />

      {/* Teams - under purpose, no heading */}
      {teams.length > 0 && (
        <div className="space-y-1">
          {teams.map(team => (
            <div key={team.id} className="text-xs text-slate-600 dark:text-slate-400">
              {team.name}
              {team.topologyType && (
                <span className="text-slate-500 dark:text-slate-500 ml-1">
                  ({team.topologyType})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ownership */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Ownership</span>
        </div>
        <div className="flex gap-1.5">
          {(['ours', 'internal', 'external'] as const).map((value) => (
            <InfoTooltip key={value} content={OWNERSHIP_DEFINITIONS[value]} position="bottom">
              <button
                onClick={() => handleUpdate({ ownership: value as ContextOwnership })}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-help ${
                  context.ownership === value || (!context.ownership && value === 'ours')
                    ? value === 'ours'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ring-1 ring-green-400'
                      : value === 'internal'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 ring-1 ring-orange-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {value === 'ours' && 'Our Team'}
                {value === 'internal' && 'Internal'}
                {value === 'external' && 'External'}
              </button>
            </InfoTooltip>
          ))}
        </div>
      </div>

      {/* Legacy toggle */}
      <div className="flex items-center gap-2">
        <Switch
          label="Legacy"
          checked={context.isLegacy || false}
          onCheckedChange={(checked) => handleUpdate({ isLegacy: checked })}
        />
        <InfoTooltip content={LEGACY_CONTEXT} position="bottom">
          <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
        </InfoTooltip>
      </div>

      {/* Team Assignment - only for non-external contexts */}
      {context.ownership !== 'external' && project.teams && project.teams.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Team</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={context.teamId || ''}
              onChange={(e) => {
                const teamId = e.target.value
                if (teamId) {
                  assignTeamToContext(context.id, teamId)
                } else {
                  unassignTeamFromContext(context.id)
                }
              }}
              className="flex-1 text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            >
              <option value="">No team assigned</option>
              {project.teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}{team.topologyType ? ` (${team.topologyType})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Member of Groups - under pills, no heading */}
      {memberOfGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {memberOfGroups.map(group => (
            <div
              key={group.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded border transition-all group/chip"
              style={{
                backgroundColor: group.color ? `${group.color}15` : '#3b82f615',
                borderColor: group.color || '#3b82f6',
              }}
            >
              <button
                onClick={() => useEditorStore.setState({ selectedGroupId: group.id, selectedContextId: null })}
                className="text-xs font-medium hover:underline"
                style={{ color: group.color || '#3b82f6' }}
              >
                {group.label}
              </button>
              <button
                onClick={() => removeContextFromGroup(group.id, context.id)}
                className="opacity-0 group-hover/chip:opacity-100 transition-opacity hover:bg-white/50 dark:hover:bg-black/20 rounded p-0.5"
                title="Remove from group"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Domain Classification - position-based, no section header */}
      <div>
        {context.strategicClassification && STRATEGIC_CLASSIFICATIONS[context.strategicClassification] ? (
          <InfoTooltip content={STRATEGIC_CLASSIFICATIONS[context.strategicClassification]} position="bottom">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md cursor-help ${
                context.strategicClassification === 'core'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                  : context.strategicClassification === 'supporting'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {context.strategicClassification === 'core' && '⚡ Core'}
              {context.strategicClassification === 'supporting' && '🔧 Supporting'}
              {context.strategicClassification === 'generic' && '📦 Generic'}
            </span>
          </InfoTooltip>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Not classified
          </span>
        )}
      </div>

      {/* Evolution Stage - position-based, no section header */}
      <div>
        {context.evolutionStage && EVOLUTION_STAGES[context.evolutionStage] ? (
          <InfoTooltip content={EVOLUTION_STAGES[context.evolutionStage]} position="bottom">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 cursor-help">
              {context.evolutionStage === 'genesis' && '🌱 Genesis'}
              {context.evolutionStage === 'custom-built' && '🔨 Custom-Built'}
              {context.evolutionStage === 'product/rental' && '📦 Product'}
              {context.evolutionStage === 'commodity/utility' && '⚡ Commodity'}
            </span>
          </InfoTooltip>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300">
            {context.evolutionStage === 'genesis' && '🌱 Genesis'}
            {context.evolutionStage === 'custom-built' && '🔨 Custom-Built'}
            {context.evolutionStage === 'product/rental' && '📦 Product'}
            {context.evolutionStage === 'commodity/utility' && '⚡ Commodity'}
          </span>
        )}
      </div>

      {/* Temporal Position (only in Strategic View with temporal mode enabled) */}
      {viewMode === 'strategic' && project.temporal?.enabled && currentDate && (
        <Section label={<div className="flex items-center gap-1"><Clock size={14} /> Position at {currentDate}</div>}>
          <div className="space-y-2">
            {(() => {
              const keyframes = project.temporal.keyframes || []
              const activeKeyframe = activeKeyframeId
                ? keyframes.find(kf => kf.id === activeKeyframeId)
                : null

              // Calculate interpolated position
              const basePosition = {
                x: context.positions.strategic.x,
                y: context.positions.shared.y,
              }
              const position = interpolatePosition(context.id, currentDate, keyframes, basePosition)
              const evolutionStage = getEvolutionStage(position.x)

              return (
                <>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    <div>Evolution: {position.x.toFixed(1)}% ({evolutionStage.replace('-', ' ')})</div>
                    <div>Value Chain: {position.y.toFixed(1)}%</div>
                  </div>
                  {activeKeyframe ? (
                    <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      📍 Viewing keyframe: {activeKeyframe.label || activeKeyframe.date}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      ⚡ Interpolated between keyframes
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </Section>
      )}

      {/* Assigned Repos - no heading */}
      {assignedRepos.length > 0 && (
        <div className="space-y-2">
          {assignedRepos.map(repo => {
            return (
              <RepoCard
                key={repo.id}
                repo={repo}
                project={project}
                useAPI={useCodeCohesionAPI}
                expandedTeamId={expandedTeamId}
                expandedRepoId={expandedRepoId}
                onToggleTeam={setExpandedTeamId}
                onToggleRepo={setExpandedRepoId}
                onUnassign={unassignRepo}
              />
            )
          })}
        </div>
      )}

      {/* Code */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-16">Code</span>
        <select
          value={context.codeSize?.bucket || ''}
          onChange={(e) => handleUpdate({ codeSize: { ...context.codeSize, bucket: e.target.value as any } })}
          className="w-32 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">Not set</option>
          <option value="tiny">Tiny</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
        </select>
        <InfoTooltip content={CODE_SIZE_TIERS} position="bottom">
          <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
        </InfoTooltip>
      </div>

      {/* Boundary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-16">Boundary</span>
          <select
            value={context.boundaryIntegrity || ''}
            onChange={(e) => handleUpdate({ boundaryIntegrity: e.target.value as any })}
            className="w-32 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="">Not set</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </select>
          {context.boundaryIntegrity && BOUNDARY_INTEGRITY[context.boundaryIntegrity] && (
            <InfoTooltip content={BOUNDARY_INTEGRITY[context.boundaryIntegrity]} position="bottom">
              <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />
            </InfoTooltip>
          )}
        </div>
        <textarea
          value={context.boundaryNotes || ''}
          onChange={(e) => handleUpdate({ boundaryNotes: e.target.value })}
          placeholder="Why is the boundary strong or weak?"
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </div>

      {/* Notes */}
      <Section label="Notes">
        <textarea
          value={context.notes || ''}
          onChange={(e) => handleUpdate({ notes: e.target.value })}
          placeholder="Assumptions, politics, bottlenecks, risks..."
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </Section>

      {/* Issues */}
      <Section label={`Issues${context.issues?.length ? ` (${context.issues.length})` : ''}`}>
        {context.issues && context.issues.length > 0 ? (
          <div className="space-y-1">
            {context.issues.map((issue, index) => (
              <div key={issue.id} className="group/issue flex items-center gap-1.5">
                <div className="flex-shrink-0 flex items-center gap-0.5">
                  <SimpleTooltip text="Info: General note" position="top">
                    <button
                      onClick={() => updateContextIssue(context.id, issue.id, { severity: 'info' })}
                      className={`p-0.5 rounded transition-colors ${
                        issue.severity === 'info'
                          ? 'bg-blue-100 dark:bg-blue-900/40'
                          : 'hover:bg-slate-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Info size={14} className={issue.severity === 'info' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    </button>
                  </SimpleTooltip>
                  <SimpleTooltip text="Warning: Needs attention" position="top">
                    <button
                      onClick={() => updateContextIssue(context.id, issue.id, { severity: 'warning' })}
                      className={`p-0.5 rounded transition-colors ${
                        issue.severity === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-900/40'
                          : 'hover:bg-slate-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <AlertTriangle size={14} className={issue.severity === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'} />
                    </button>
                  </SimpleTooltip>
                  <SimpleTooltip text="Critical: Urgent problem" position="top">
                    <button
                      onClick={() => updateContextIssue(context.id, issue.id, { severity: 'critical' })}
                      className={`p-0.5 rounded transition-colors ${
                        issue.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/40'
                          : 'hover:bg-slate-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <AlertOctagon size={14} className={issue.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'} />
                    </button>
                  </SimpleTooltip>
                </div>
                <input
                  type="text"
                  value={issue.title}
                  onChange={(e) => updateContextIssue(context.id, issue.id, { title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addContextIssue(context.id, '')
                    }
                  }}
                  onFocus={(e) => {
                    if (issue.title === 'New issue') {
                      e.target.select()
                    }
                  }}
                  autoFocus={index === context.issues!.length - 1 && (issue.title === '' || issue.title === 'New issue')}
                  placeholder="Issue title..."
                  className="flex-1 min-w-0 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 hover:border-slate-300 dark:hover:border-neutral-500 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-0.5 outline-none"
                />
                <button
                  onClick={() => deleteContextIssue(context.id, issue.id)}
                  className="opacity-0 group-hover/issue:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No issues marked</p>
        )}
        <button
          onClick={() => addContextIssue(context.id, 'New issue')}
          className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={12} />
          Add Issue
        </button>
      </Section>

      {/* Relationships */}
      {(() => {
        const isSymmetricPattern = (pattern: string) =>
          pattern === 'shared-kernel' || pattern === 'partnership'

        const upstream = project.relationships.filter(r =>
          r.fromContextId === context.id && !isSymmetricPattern(r.pattern))
        const downstream = project.relationships.filter(r =>
          r.toContextId === context.id && !isSymmetricPattern(r.pattern))
        const mutual = project.relationships.filter(r =>
          (r.fromContextId === context.id || r.toContextId === context.id) &&
          isSymmetricPattern(r.pattern))

        const hasRelationships = upstream.length > 0 || downstream.length > 0 || mutual.length > 0

        return (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Relationships
              </span>
              <InfoTooltip content={POWER_DYNAMICS} position="bottom">
                <HelpCircle size={12} className="text-slate-400 dark:text-slate-500 cursor-help" />
              </InfoTooltip>
            </div>
            <div className="text-[13px]">
            {upstream.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Upstream
                </div>
                <div className="space-y-2">
                  {upstream.map(rel => {
                    const targetContext = project.contexts.find(c => c.id === rel.toContextId)
                    return (
                      <div key={rel.id} className="flex items-start justify-between gap-2 group/rel">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <ArrowRight size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {targetContext?.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 ml-5 mt-0.5">
                            {rel.pattern}
                          </div>
                          {rel.description && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 ml-5 mt-1">
                              {rel.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteRelationship(rel.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover/rel:opacity-100"
                          title="Delete relationship"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {downstream.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Downstream
                </div>
                <div className="space-y-2">
                  {downstream.map(rel => {
                    const sourceContext = project.contexts.find(c => c.id === rel.fromContextId)
                    return (
                      <div key={rel.id} className="flex items-start justify-between gap-2 group/rel">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <ArrowRight size={12} className="text-slate-400 flex-shrink-0 rotate-180" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {sourceContext?.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 ml-5 mt-0.5">
                            {rel.pattern}
                          </div>
                          {rel.description && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 ml-5 mt-1">
                              {rel.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteRelationship(rel.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover/rel:opacity-100"
                          title="Delete relationship"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {mutual.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Mutual
                </div>
                <div className="space-y-2">
                  {mutual.map(rel => {
                    const otherContextId = rel.fromContextId === context.id ? rel.toContextId : rel.fromContextId
                    const otherContext = project.contexts.find(c => c.id === otherContextId)
                    return (
                      <div key={rel.id} className="flex items-start justify-between gap-2 group/rel">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400 flex-shrink-0 text-[10px]">⟷</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {otherContext?.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 ml-5 mt-0.5">
                            {rel.pattern}
                          </div>
                          {rel.description && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 ml-5 mt-1">
                              {rel.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteRelationship(rel.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover/rel:opacity-100"
                          title="Delete relationship"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add Relationship button */}
            <button
              onClick={() => setShowRelationshipDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              <Plus size={12} />
              Add Relationship
            </button>
            </div>
          </div>
        )
      })()}

      {/* Relationship Dialog */}
      {showRelationshipDialog && (
        <RelationshipCreateDialog
          fromContext={context}
          availableContexts={project.contexts.filter(c => c.id !== context.id)}
          onConfirm={(toContextId, pattern, description) => {
            addRelationship(context.id, toContextId, pattern, description)
            setShowRelationshipDialog(false)
          }}
          onCancel={() => setShowRelationshipDialog(false)}
        />
      )}

      {/* Delete Context - at bottom to avoid confusion with close button */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete Context
        </button>
      </div>
    </div>
  )
}

// Repo card component
function RepoCard({
  repo,
  project,
  useAPI,
  expandedTeamId,
  expandedRepoId,
  onToggleTeam,
  onToggleRepo,
  onUnassign,
}: {
  repo: any
  project: any
  useAPI: boolean
  expandedTeamId: string | null
  expandedRepoId: string | null
  onToggleTeam: (id: string | null) => void
  onToggleRepo: (id: string | null) => void
  onUnassign: (repoId: string) => void
}) {
  const repoTeams = project.teams.filter((t: any) => repo.teamIds.includes(t.id))
  const staticContributors = repo.contributors
    .map((c: any) => project.people.find((p: any) => p.id === c.personId))
    .filter((p: any): p is NonNullable<typeof p> => !!p)

  const isExpanded = expandedRepoId === repo.id

  // Fetch API data if enabled
  const { contributors: apiContributors, loading: loadingContributors, error: contributorsError } =
    useCodeCohesionContributors(repo.name, useAPI)
  const { stats, loading: loadingStats, error: statsError } =
    useCodeCohesionRepoStats(repo.name, useAPI)

  // Determine which contributors to display
  const contributorsToDisplay = useAPI
    ? (apiContributors || [])
    : staticContributors.map(c => c.displayName)

  const dataSource = useAPI ? 'Top 5, last 90 days' : 'Static'

  // Format stats for display
  const getPrimaryLanguage = () => {
    if (!stats?.filesByExtension) return null
    const entries = Object.entries(stats.filesByExtension) as [string, number][]
    if (entries.length === 0) return null
    const sorted = entries.sort((a, b) => b[1] - a[1])
    const [ext, count] = sorted[0]
    return { ext: ext.replace('.', '').toUpperCase(), count }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div>
      {/* Collapsed: Repo chip only (no team chips - teams shown above purpose) */}
      <div className="flex flex-wrap gap-1 items-center group">
        {/* Repo chip */}
        <button
          onClick={() => onToggleRepo(isExpanded ? null : repo.id)}
          className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1"
        >
          <GitBranch size={10} />
          {repo.name}
          {isExpanded ? ' ▼' : ' ▶'}
        </button>

        {/* Unassign button (visible on hover) */}
        <button
          onClick={() => onUnassign(repo.id)}
          className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Unassign repo"
        >
          <X size={10} />
        </button>
      </div>

      {/* Expanded: Repo details panel */}
      {isExpanded && (
        <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-600 rounded p-2.5 mt-1.5">
          {/* Remote URL */}
          {repo.remoteUrl && (
            <a
              href={repo.remoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 dark:text-blue-400 text-[11px] flex items-center gap-1 hover:underline mb-3"
            >
              <span className="truncate">{repo.remoteUrl}</span>
              <ExternalLink size={10} className="flex-shrink-0" />
            </a>
          )}

          {/* Repo Stats */}
          {useAPI && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Repository Stats
              </div>
              {loadingStats && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Loading stats...</div>
              )}
              {statsError && (
                <div className="text-[10px] text-red-600 dark:text-red-400">Error loading stats</div>
              )}
              {stats && !loadingStats && !statsError && (
                <div className="text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>• {formatNumber(stats.totalFiles)} files</div>
                  <div>• {formatNumber(stats.totalLoc)} lines of code</div>
                  {getPrimaryLanguage() && (
                    <div>• Primary: {getPrimaryLanguage()!.ext} ({formatNumber(getPrimaryLanguage()!.count)} files)</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contributors */}
          <div>
            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Contributors ({dataSource})
            </div>
            {loadingContributors && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Loading contributors...</div>
            )}
            {contributorsError && (
              <div className="text-[10px] text-red-600 dark:text-red-400">Error loading contributors</div>
            )}
            {!loadingContributors && !contributorsError && contributorsToDisplay.length > 0 && (
              <div className="text-[10px] text-slate-600 dark:text-slate-400">
                {contributorsToDisplay.join(', ')}
              </div>
            )}
          </div>

          {/* Expanded team details (if a team is selected) */}
          {expandedTeamId && repoTeams.some((t: any) => t.id === expandedTeamId) && (
            <div className="bg-slate-50 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded p-2 mt-2">
              {(() => {
                const team = repoTeams.find((t: any) => t.id === expandedTeamId)
                if (!team) return null
                return (
                  <>
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-1 text-[11px]">
                      {team.name}
                    </div>
                    {team.topologyType && (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                        Type: {team.topologyType}
                      </div>
                    )}
                    {team.jiraBoard && (
                      <a
                        href={team.jiraBoard}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 text-[10px] flex items-center gap-1 hover:underline"
                      >
                        <span className="truncate">Jira Board</span>
                        <ExternalLink size={9} className="flex-shrink-0" />
                      </a>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Hook to fetch contributors from CodeCohesion API
function useCodeCohesionContributors(repoName: string, enabled: boolean) {
  const [contributors, setContributors] = React.useState<string[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled || !repoName) {
      setContributors(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const { apiBaseUrl, contributors: { limit, days } } = config.integrations.codecohesion
    fetch(`${apiBaseUrl}/repos/${repoName}/contributors?limit=${limit}&days=${days}`)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        return res.json()
      })
      .then(data => {
        // Extract contributor names from API response
        // Assuming response format: { contributors: [...] }
        const names = Array.isArray(data.contributors)
          ? data.contributors.map((c: any) => c.name || c.login || c.email || 'Unknown')
          : []
        setContributors(names)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch contributors:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [repoName, enabled])

  return { contributors, loading, error }
}

// Hook to fetch repo stats from CodeCohesion API
function useCodeCohesionRepoStats(repoName: string, enabled: boolean) {
  const [stats, setStats] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled || !repoName) {
      setStats(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`${config.integrations.codecohesion.apiBaseUrl}/repos/${repoName}/stats`)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        return res.json()
      })
      .then(data => {
        setStats(data.stats)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch repo stats:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [repoName, enabled])

  return { stats, loading, error }
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
