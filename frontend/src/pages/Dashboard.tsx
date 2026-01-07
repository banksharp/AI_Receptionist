import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Phone, 
  MessageSquareText, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  PhoneIncoming,
  Calendar,
  CheckCircle2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { businessApi, callApi } from '../services/api'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessApi.list
  })

  const { data: calls = [] } = useQuery({
    queryKey: ['calls'],
    queryFn: () => callApi.list()
  })

  const stats = [
    {
      name: 'Active Businesses',
      value: businesses.filter(b => b.is_active).length,
      icon: Building2,
      color: 'from-primary-500 to-primary-600',
      change: '+2 this week'
    },
    {
      name: 'Total Calls',
      value: calls.length,
      icon: Phone,
      color: 'from-blue-500 to-blue-600',
      change: '+12% from last week'
    },
    {
      name: 'Appointments Scheduled',
      value: calls.filter(c => c.action_taken === 'appointment_scheduled').length,
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-600',
      change: 'via AI receptionist'
    },
    {
      name: 'Avg Call Duration',
      value: calls.length > 0 
        ? `${Math.round(calls.reduce((acc, c) => acc + c.duration_seconds, 0) / calls.length / 60)}m`
        : '0m',
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      change: 'per conversation'
    }
  ]

  const recentCalls = calls.slice(0, 5)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="card p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Welcome to AI Receptionist
            </h1>
            <p className="text-surface-400 max-w-2xl">
              Your intelligent virtual receptionist platform. Configure AI-powered phone agents 
              that handle calls, answer questions, and schedule appointments for your business.
            </p>
          </div>
          <Link to="/businesses" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Building2 className="w-5 h-5" />
            Add Business
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <div key={stat.name} className="card-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-display text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-surface-400 text-sm">{stat.name}</p>
            <p className="text-surface-500 text-xs mt-2">{stat.change}</p>
          </div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <PhoneIncoming className="w-5 h-5 text-primary-400" />
              Recent Calls
            </h3>
            <Link to="/calls" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {recentCalls.length > 0 ? (
            <div className="space-y-3">
              {recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-4 p-4 bg-surface-800/50 rounded-xl border border-surface-700/30"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    call.status === 'completed' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                  }`}>
                    <Phone className={`w-5 h-5 ${
                      call.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {call.caller_number || 'Unknown Caller'}
                    </p>
                    <p className="text-surface-400 text-sm">
                      {call.caller_intent || 'General inquiry'} • {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      call.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {call.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      {call.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-surface-600 mx-auto mb-4" />
              <p className="text-surface-400">No calls yet</p>
              <p className="text-surface-500 text-sm mt-1">
                Calls will appear here once your AI receptionist starts receiving them
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="card p-6">
          <h3 className="font-display text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary-400" />
            Quick Actions
          </h3>

          <div className="space-y-3">
            <Link
              to="/businesses"
              className="block p-4 bg-surface-800/50 rounded-xl border border-surface-700/30 hover:border-primary-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Add New Business</p>
                  <p className="text-surface-500 text-sm">Set up a new location</p>
                </div>
              </div>
            </Link>

            <Link
              to="/prompts"
              className="block p-4 bg-surface-800/50 rounded-xl border border-surface-700/30 hover:border-primary-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                  <MessageSquareText className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Configure Prompts</p>
                  <p className="text-surface-500 text-sm">Customize AI responses</p>
                </div>
              </div>
            </Link>

            <Link
              to="/integrations"
              className="block p-4 bg-surface-800/50 rounded-xl border border-surface-700/30 hover:border-primary-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Connect Calendar</p>
                  <p className="text-surface-500 text-sm">Sync scheduling software</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Setup Progress */}
          <div className="mt-6 p-4 bg-gradient-to-r from-primary-900/30 to-primary-800/20 rounded-xl border border-primary-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-300">Setup Progress</span>
              <span className="text-sm font-medium text-primary-400">
                {businesses.length > 0 ? '50%' : '0%'}
              </span>
            </div>
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: businesses.length > 0 ? '50%' : '0%' }}
              />
            </div>
            <p className="text-xs text-surface-500 mt-2">
              {businesses.length === 0 
                ? 'Add your first business to get started'
                : 'Configure prompts to complete setup'
              }
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

