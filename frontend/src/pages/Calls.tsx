import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { 
  Phone, 
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ArrowRightLeft
} from 'lucide-react'
import { callApi, businessApi, Call } from '../services/api'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  in_progress: { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  transferred: { icon: ArrowRightLeft, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  voicemail: { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  missed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
}

export default function Calls() {
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null)
  const [expandedCall, setExpandedCall] = useState<number | null>(null)

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessApi.list
  })

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['calls', selectedBusiness],
    queryFn: () => callApi.list(selectedBusiness || undefined)
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getBusinessName = (businessId: number) => {
    return businesses.find(b => b.id === businessId)?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Call History</h1>
          <p className="text-surface-400 mt-1">View and analyze all incoming calls</p>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <label className="text-surface-400 text-sm block mb-2">Filter by business</label>
          <select
            value={selectedBusiness || ''}
            onChange={(e) => setSelectedBusiness(e.target.value ? parseInt(e.target.value) : null)}
            className="input-field"
          >
            <option value="">All businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-surface-400 mb-1">
            <PhoneIncoming className="w-4 h-4" />
            <span className="text-sm">Total Calls</span>
          </div>
          <p className="font-display text-2xl font-bold text-white">{calls.length}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-surface-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="font-display text-2xl font-bold text-white">
            {calls.filter(c => c.status === 'completed').length}
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-surface-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Avg Duration</span>
          </div>
          <p className="font-display text-2xl font-bold text-white">
            {calls.length > 0 
              ? formatDuration(Math.round(calls.reduce((acc, c) => acc + c.duration_seconds, 0) / calls.length))
              : '0m 0s'
            }
          </p>
        </div>
      </div>

      {/* Calls List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-surface-700 rounded w-48 mb-2" />
                  <div className="h-4 bg-surface-700 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : calls.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <Phone className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No calls yet</h3>
          <p className="text-surface-400 max-w-md mx-auto">
            When your AI receptionist starts receiving calls, they'll appear here with full transcripts and analytics.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {calls.map((call) => {
            const status = statusConfig[call.status] || statusConfig.completed
            const StatusIcon = status.icon
            const isExpanded = expandedCall === call.id

            return (
              <motion.div
                key={call.id}
                variants={itemVariants}
                className="card overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-surface-800/30 transition-colors"
                  onClick={() => setExpandedCall(isExpanded ? null : call.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bg}`}>
                      <StatusIcon className={`w-6 h-6 ${status.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">
                          {call.caller_number || 'Unknown Caller'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {call.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-surface-400">
                        <span>{getBusinessName(call.business_id)}</span>
                        <span>•</span>
                        <span>{format(new Date(call.started_at), 'MMM d, yyyy h:mm a')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(call.duration_seconds)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {call.caller_intent && (
                        <span className="hidden sm:inline-flex px-3 py-1 bg-surface-800 text-surface-300 rounded-full text-sm">
                          {call.caller_intent}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-surface-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-surface-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-700/50"
                  >
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Call Summary */}
                      {call.call_summary && (
                        <div className="lg:col-span-2">
                          <h4 className="text-sm font-medium text-surface-400 mb-2">Call Summary</h4>
                          <p className="text-surface-200 bg-surface-800/50 p-4 rounded-lg">
                            {call.call_summary}
                          </p>
                        </div>
                      )}

                      {/* Transcript */}
                      {call.transcript && (
                        <div className="lg:col-span-2">
                          <h4 className="text-sm font-medium text-surface-400 mb-2">Transcript</h4>
                          <div className="bg-surface-800/50 p-4 rounded-lg max-h-64 overflow-y-auto">
                            <pre className="text-surface-300 text-sm whitespace-pre-wrap font-sans">
                              {call.transcript}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Collected Info */}
                      {call.collected_info && Object.keys(call.collected_info).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-surface-400 mb-2">Collected Information</h4>
                          <div className="bg-surface-800/50 p-4 rounded-lg space-y-2">
                            {Object.entries(call.collected_info).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-surface-400 capitalize">{key.replace('_', ' ')}:</span>
                                <span className="text-surface-200">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Taken */}
                      {call.action_taken && (
                        <div>
                          <h4 className="text-sm font-medium text-surface-400 mb-2">Action Taken</h4>
                          <div className="bg-surface-800/50 p-4 rounded-lg">
                            <span className="text-surface-200 capitalize">
                              {call.action_taken.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Recording */}
                      {call.recording_url && (
                        <div>
                          <h4 className="text-sm font-medium text-surface-400 mb-2">Recording</h4>
                          <button className="flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-lg text-surface-300 transition-colors">
                            <PlayCircle className="w-5 h-5" />
                            Play Recording
                          </button>
                        </div>
                      )}

                      {/* Sentiment */}
                      {call.sentiment && (
                        <div>
                          <h4 className="text-sm font-medium text-surface-400 mb-2">Caller Sentiment</h4>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            call.sentiment === 'positive' 
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : call.sentiment === 'negative'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-surface-700 text-surface-300'
                          }`}>
                            {call.sentiment}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

