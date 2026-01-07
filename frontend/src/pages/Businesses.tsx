import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { 
  Building2, 
  Plus, 
  Phone, 
  MapPin, 
  Clock,
  Edit,
  Trash2,
  X,
  Check,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { businessApi, Business } from '../services/api'

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

const businessTypes = [
  { value: 'dental', label: 'Dental Office' },
  { value: 'medical', label: 'Medical Practice' },
  { value: 'salon', label: 'Salon / Spa' },
  { value: 'legal', label: 'Law Office' },
  { value: 'accounting', label: 'Accounting Firm' },
  { value: 'other', label: 'Other' },
]

interface BusinessFormData {
  name: string
  business_type: string
  phone_number: string
  email: string
  address_line1: string
  city: string
  state: string
  zip_code: string
  ai_voice: string
  greeting_message: string
}

export default function Businesses() {
  const [showModal, setShowModal] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  
  const queryClient = useQueryClient()

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessApi.list
  })

  const createMutation = useMutation({
    mutationFn: businessApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      setShowModal(false)
      reset()
    },
    onError: (error) => {
      console.error('Create business error:', error)
      alert('Failed to create business. Check console for details.')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Business> }) => 
      businessApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      setShowModal(false)
      setEditingBusiness(null)
      reset()
    },
    onError: (error) => {
      console.error('Update business error:', error)
      alert('Failed to update business. Check console for details.')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: businessApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    }
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BusinessFormData>({
    defaultValues: {
      business_type: 'dental',
      ai_voice: 'alloy',
      greeting_message: 'Thank you for calling. How may I help you today?'
    }
  })

  const onSubmit = (data: BusinessFormData) => {
    if (editingBusiness) {
      updateMutation.mutate({ id: editingBusiness.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (business: Business) => {
    setEditingBusiness(business)
    reset({
      name: business.name,
      business_type: business.business_type,
      phone_number: business.phone_number || '',
      email: business.email || '',
      address_line1: business.address_line1 || '',
      city: business.city || '',
      state: business.state || '',
      zip_code: business.zip_code || '',
      ai_voice: business.ai_voice || 'alloy',
      greeting_message: business.greeting_message
    })
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this business?')) {
      deleteMutation.mutate(id)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBusiness(null)
    reset()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Businesses</h1>
          <p className="text-surface-400 mt-1">Manage your business locations and AI receptionist settings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Business
        </button>
      </div>

      {/* Business Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-surface-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-surface-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-surface-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <Building2 className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No businesses yet</h3>
          <p className="text-surface-400 mb-6 max-w-md mx-auto">
            Add your first business to start configuring your AI receptionist
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Business
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {businesses.map((business) => (
            <motion.div
              key={business.id}
              variants={itemVariants}
              className="card-hover p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(business)}
                    className="p-2 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(business.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-surface-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-display text-lg font-semibold text-white mb-1">
                {business.name}
              </h3>
              <p className="text-primary-400 text-sm mb-4 capitalize">
                {business.business_type.replace('_', ' ')}
              </p>

              <div className="space-y-2 text-sm text-surface-400">
                {business.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {business.phone_number}
                  </div>
                )}
                {business.city && business.state && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {business.city}, {business.state}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {business.is_active ? (
                    <span className="text-emerald-400">Active</span>
                  ) : (
                    <span className="text-amber-400">Inactive</span>
                  )}
                </div>
              </div>

              <Link
                to={`/businesses/${business.id}`}
                className="mt-4 pt-4 border-t border-surface-700/50 flex items-center justify-between text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-white">
                {editingBusiness ? 'Edit Business' : 'Add New Business'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-surface-700 rounded-lg text-surface-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Business Name *</label>
                  <input
                    {...register('name', { required: 'Business name is required' })}
                    className="input-field"
                    placeholder="Smile Dental Care"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Business Type</label>
                  <select {...register('business_type')} className="input-field">
                    {businessTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    {...register('phone_number')}
                    className="input-field"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="input-field"
                    placeholder="contact@business.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Street Address</label>
                  <input
                    {...register('address_line1')}
                    className="input-field"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="label">City</label>
                  <input
                    {...register('city')}
                    className="input-field"
                    placeholder="New York"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">State</label>
                    <input
                      {...register('state')}
                      className="input-field"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="label">ZIP Code</label>
                    <input
                      {...register('zip_code')}
                      className="input-field"
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">AI Voice</label>
                  <select {...register('ai_voice')} className="input-field">
                    <option value="alloy">Alloy (Female, US)</option>
                    <option value="echo">Echo (Male, US)</option>
                    <option value="fable">Fable (Female, British)</option>
                    <option value="onyx">Onyx (Male, British)</option>
                    <option value="nova">Nova (Female, US)</option>
                    <option value="shimmer">Shimmer (Female, US)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">AI Greeting Message</label>
                  <textarea
                    {...register('greeting_message')}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Thank you for calling. How may I help you today?"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingBusiness ? 'Update' : 'Create'} Business
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

