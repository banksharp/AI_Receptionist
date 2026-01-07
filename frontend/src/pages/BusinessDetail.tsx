import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessageSquareText,
  PhoneIncoming,
  Bot
} from 'lucide-react'
import { businessApi, promptApi, callApi } from '../services/api'

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>()
  const businessId = parseInt(id || '0')

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => businessApi.get(businessId),
    enabled: !!businessId
  })

  const { data: prompts = [] } = useQuery({
    queryKey: ['prompts', businessId],
    queryFn: () => promptApi.list(businessId),
    enabled: !!businessId
  })

  const { data: calls = [] } = useQuery({
    queryKey: ['calls', businessId],
    queryFn: () => callApi.list(businessId),
    enabled: !!businessId
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-700 rounded w-48" />
        <div className="card p-6 space-y-4">
          <div className="h-6 bg-surface-700 rounded w-64" />
          <div className="h-4 bg-surface-700 rounded w-48" />
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="card p-12 text-center">
        <Building2 className="w-16 h-16 text-surface-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Business not found</h3>
        <Link to="/businesses" className="text-primary-400 hover:text-primary-300">
          ← Back to businesses
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back link */}
      <Link
        to="/businesses"
        className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to businesses
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-2xl font-bold text-white">{business.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                business.is_active 
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {business.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-primary-400 capitalize">{business.business_type.replace('_', ' ')}</p>
          </div>
          <div className="flex gap-3">
            <Link to={`/prompts?business=${businessId}`} className="btn-secondary">
              Configure Prompts
            </Link>
            <Link to="/businesses" className="btn-primary">
              Edit Business
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquareText className="w-5 h-5 text-primary-400" />
            <span className="text-surface-400">Active Prompts</span>
          </div>
          <p className="font-display text-3xl font-bold text-white">{prompts.filter(p => p.is_active).length}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <PhoneIncoming className="w-5 h-5 text-blue-400" />
            <span className="text-surface-400">Total Calls</span>
          </div>
          <p className="font-display text-3xl font-bold text-white">{calls.length}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span className="text-surface-400">AI Handled</span>
          </div>
          <p className="font-display text-3xl font-bold text-white">
            {calls.filter(c => c.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold text-white mb-4">Contact Information</h3>
          <div className="space-y-4">
            {business.phone_number && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Phone</p>
                  <p className="text-white">{business.phone_number}</p>
                </div>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Email</p>
                  <p className="text-white">{business.email}</p>
                </div>
              </div>
            )}
            {business.address_line1 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Address</p>
                  <p className="text-white">
                    {business.address_line1}
                    {business.city && `, ${business.city}`}
                    {business.state && `, ${business.state}`}
                    {business.zip_code && ` ${business.zip_code}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Configuration */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold text-white mb-4">AI Configuration</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-surface-500 mb-1">Greeting Message</p>
              <p className="text-surface-300 bg-surface-800/50 p-3 rounded-lg">
                "{business.greeting_message}"
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                <Bot className="w-5 h-5 text-surface-400" />
              </div>
              <div>
                <p className="text-xs text-surface-500">AI Voice</p>
                <p className="text-white capitalize">{business.ai_voice}</p>
              </div>
            </div>
            {business.twilio_phone_number && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">AI Phone Number</p>
                  <p className="text-white">{business.twilio_phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold text-white mb-4">Services Offered</h3>
          {business.services && business.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {business.services.map((service, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-surface-800 text-surface-300 rounded-full text-sm"
                >
                  {service}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-surface-500">No services configured</p>
          )}
        </div>

        {/* Business Hours */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Business Hours
          </h3>
          {business.business_hours && Object.keys(business.business_hours).length > 0 ? (
            <div className="space-y-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const hours = business.business_hours[day]
                return (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-surface-400 capitalize">{day}</span>
                    <span className="text-surface-200">
                      {hours?.closed ? 'Closed' : hours ? `${hours.open} - ${hours.close}` : 'Not set'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-surface-500">No hours configured</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

