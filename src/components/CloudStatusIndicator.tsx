import { useCollabStore, ConnectionState } from '../model/collabStore'
import { SimpleTooltip } from './SimpleTooltip'
import {
  Cloud,
  CloudOff,
  Loader2,
  WifiOff,
  AlertCircle,
  CloudCog,
} from 'lucide-react'

interface StatusConfig {
  icon: React.ReactNode
  label: string
  tooltip: string
  color: string
  animate?: boolean
}

const STATUS_CONFIG: Record<ConnectionState, StatusConfig> = {
  disconnected: {
    icon: <CloudOff size={14} />,
    label: '',
    tooltip: 'Not connected to cloud sync',
    color: 'text-slate-400 dark:text-slate-500',
  },
  connecting: {
    icon: <Loader2 size={14} />,
    label: '',
    tooltip: 'Connecting to cloud sync...',
    color: 'text-blue-500',
    animate: true,
  },
  connected: {
    icon: <Cloud size={14} />,
    label: '',
    tooltip: 'Connected - changes sync automatically',
    color: 'text-green-500',
  },
  syncing: {
    icon: <CloudCog size={14} />,
    label: '',
    tooltip: 'Syncing changes...',
    color: 'text-blue-500',
    animate: true,
  },
  offline: {
    icon: <WifiOff size={14} />,
    label: '',
    tooltip: 'Offline - changes will sync when reconnected',
    color: 'text-amber-500',
  },
  error: {
    icon: <AlertCircle size={14} />,
    label: '',
    tooltip: 'Connection error',
    color: 'text-red-500',
  },
}

export function CloudStatusIndicator() {
  const connectionState = useCollabStore((s) => s.connectionState)
  const error = useCollabStore((s) => s.error)

  const config = STATUS_CONFIG[connectionState]
  const tooltipText = error ? `${config.tooltip}: ${error}` : config.tooltip

  return (
    <SimpleTooltip text={tooltipText}>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded ${config.color}`}
      >
        <span className={config.animate ? 'animate-spin' : ''}>
          {config.icon}
        </span>
        {config.label && (
          <span className="text-xs font-medium">{config.label}</span>
        )}
      </div>
    </SimpleTooltip>
  )
}
