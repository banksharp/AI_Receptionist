import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Plug, 
  Check,
  X,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Calendar,
  Database,
  Zap
} from 'lucide-react'
import { integrationApi, businessApi } from '../services/api'

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

interface AvailableIntegration {
  id: string
  name: string
  type: string
  description: string
  requires_oauth: boolean
}

export default function Integrations() {
  const [showModal, setShowModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<AvailableIntegration | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  
  const queryClient = useQueryClient()

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessApi.list
  })

  const { data: availableIntegrations = [] } = useQuery({
    queryKey: ['availableIntegrations'],
    queryFn: integrationApi.listAvailable
  })

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationApi.list()
  })

  const createMutation = useMutation({
    mutationFn: integrationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      closeModal()
    }
  })

  const testMutation = useMutation({
    mutationFn: integrationApi.test,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: integrationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    }
  })

  const handleConnect = (integration: AvailableIntegration) => {
    setSelectedIntegration(integration)
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIntegration || !selectedBusiness) return

    createMutation.mutate({
      business_id: selectedBusiness,
      name: selectedIntegration.name,
      integration_type: selectedIntegration.type,
      api_base_url: apiUrl || undefined,
      api_key: apiKey || undefined,
    })
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedIntegration(null)
    setSelectedBusiness(null)
    setApiKey('')
    setApiUrl('')
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'scheduling': return Calendar
      case 'crm': return Database
      default: return Plug
    }
  }

  const getBusinessName = (businessId: number) => {
    return businesses.find(b => b.id === businessId)?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Integrations</h1>
        <p className="text-surface-400 mt-1">Connect your scheduling software and other tools</p>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Connected</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {integrations.map((integration) => {
              const Icon = getIntegrationIcon(integration.integration_type)
              
              return (
                <motion.div
                  key={integration.id}
                  variants={itemVariants}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.is_connected ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                          <AlertCircle className="w-3 h-3" />
                          Disconnected
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-white mb-1">{integration.name}</h3>
                  <p className="text-surface-400 text-sm mb-4">
                    {getBusinessName(integration.business_id)}
                  </p>

                  {integration.last_error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-xs">{integration.last_error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => testMutation.mutate(integration.id)}
                      disabled={testMutation.isPending}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${testMutation.isPending ? 'animate-spin' : ''}`} />
                      Test
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(integration.id)}
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-white">Available Integrations</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {availableIntegrations.map((integration: AvailableIntegration) => {
            const Icon = getIntegrationIcon(integration.type)
            const isConnected = integrations.some(i => i.name === integration.name)
            
            return (
              <motion.div
                key={integration.id}
                variants={itemVariants}
                className="card-hover p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-surface-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{integration.name}</h3>
                    <p className="text-surface-500 text-sm capitalize">{integration.type}</p>
                  </div>
                </div>

                <p className="text-surface-400 text-sm mb-4">
                  {integration.description}
                </p>

                <button
                  onClick={() => handleConnect(integration)}
                  disabled={businesses.length === 0}
                  className={`w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isConnected
                      ? 'bg-surface-800 text-surface-400 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Check className="w-4 h-4" />
                      Already Connected
                    </>
                  ) : integration.requires_oauth ? (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Connect with OAuth
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Connection Modal */}
      {showModal && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-white">
                Connect {selectedIntegration.name}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-surface-700 rounded-lg text-surface-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Business *</label>
                <select
                  value={selectedBusiness || ''}
                  onChange={(e) => setSelectedBusiness(parseInt(e.target.value))}
                  className="input-field"
                  required
                >
                  <option value="">Select a business</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {!selectedIntegration.requires_oauth && (
                <>
                  <div>
                    <label className="label">API URL</label>
                    <input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="input-field"
                      placeholder="https://api.example.com"
                    />
                  </div>

                  <div>
                    <label className="label">API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="input-field"
                      placeholder="Enter your API key"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.requires_oauth && (
                <div className="p-4 bg-surface-800/50 rounded-lg">
                  <p className="text-surface-400 text-sm">
                    You'll be redirected to {selectedIntegration.name} to authorize the connection.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !selectedBusiness}
                  className="btn-primary flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plug className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

