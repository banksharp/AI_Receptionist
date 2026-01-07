import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { 
  MessageSquareText, 
  Plus, 
  Edit,
  Trash2,
  X,
  Check,
  Sparkles,
  Tag,
  Zap,
  Building2
} from 'lucide-react'
import { promptApi, businessApi, Prompt } from '../services/api'

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

const categoryColors: Record<string, string> = {
  greeting: 'bg-blue-500/20 text-blue-400',
  scheduling: 'bg-emerald-500/20 text-emerald-400',
  faq: 'bg-purple-500/20 text-purple-400',
  services: 'bg-amber-500/20 text-amber-400',
  hours: 'bg-cyan-500/20 text-cyan-400',
  location: 'bg-pink-500/20 text-pink-400',
  insurance: 'bg-indigo-500/20 text-indigo-400',
  emergency: 'bg-red-500/20 text-red-400',
  cancellation: 'bg-orange-500/20 text-orange-400',
  callback: 'bg-teal-500/20 text-teal-400',
  transfer: 'bg-violet-500/20 text-violet-400',
  closing: 'bg-slate-500/20 text-slate-400',
  custom: 'bg-surface-500/20 text-surface-400',
}

interface PromptFormData {
  business_id: number
  name: string
  category: string
  trigger_phrases: string
  content: string
  ai_instructions: string
  requires_info_collection: boolean
  fields_to_collect: string
  priority: number
}

export default function Prompts() {
  const [showModal, setShowModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null)
  
  const queryClient = useQueryClient()

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessApi.list
  })

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['prompts', selectedBusiness],
    queryFn: () => promptApi.list(selectedBusiness || undefined)
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['promptCategories'],
    queryFn: promptApi.getCategories
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Prompt>) => promptApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      setShowModal(false)
      reset()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Prompt> }) => 
      promptApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      setShowModal(false)
      setEditingPrompt(null)
      reset()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: promptApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    }
  })

  const createDefaultsMutation = useMutation({
    mutationFn: promptApi.createDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    }
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PromptFormData>({
    defaultValues: {
      category: 'custom',
      priority: 0,
      requires_info_collection: false
    }
  })

  const requiresInfoCollection = watch('requires_info_collection')

  const onSubmit = (data: PromptFormData) => {
    const promptData = {
      ...data,
      trigger_phrases: data.trigger_phrases ? data.trigger_phrases.split(',').map(s => s.trim()) : [],
      fields_to_collect: data.fields_to_collect ? data.fields_to_collect.split(',').map(s => s.trim()) : []
    }

    if (editingPrompt) {
      updateMutation.mutate({ id: editingPrompt.id, data: promptData })
    } else {
      createMutation.mutate(promptData)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    reset({
      business_id: prompt.business_id,
      name: prompt.name,
      category: prompt.category,
      trigger_phrases: prompt.trigger_phrases?.join(', ') || '',
      content: prompt.content,
      ai_instructions: prompt.ai_instructions || '',
      requires_info_collection: prompt.requires_info_collection,
      fields_to_collect: prompt.fields_to_collect?.join(', ') || '',
      priority: prompt.priority
    })
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      deleteMutation.mutate(id)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPrompt(null)
    reset()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Prompts</h1>
          <p className="text-surface-400 mt-1">Configure AI responses for different scenarios</p>
        </div>
        <div className="flex gap-3">
          {selectedBusiness && (
            <button
              onClick={() => createDefaultsMutation.mutate(selectedBusiness)}
              disabled={createDefaultsMutation.isPending}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Defaults
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            disabled={businesses.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Prompt
          </button>
        </div>
      </div>

      {/* Business Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <label className="text-surface-400 text-sm">Filter by business:</label>
          <select
            value={selectedBusiness || ''}
            onChange={(e) => setSelectedBusiness(e.target.value ? parseInt(e.target.value) : null)}
            className="input-field max-w-xs"
          >
            <option value="">All businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-surface-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-surface-700 rounded w-full mb-2" />
              <div className="h-4 bg-surface-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <MessageSquareText className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No prompts yet</h3>
          <p className="text-surface-400 mb-6 max-w-md mx-auto">
            {businesses.length === 0 
              ? 'Add a business first, then configure prompts'
              : 'Create prompts to customize how your AI receptionist responds'
            }
          </p>
          {selectedBusiness && (
            <button
              onClick={() => createDefaultsMutation.mutate(selectedBusiness)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Default Prompts
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {prompts.map((prompt) => {
            const business = businesses.find(b => b.id === prompt.business_id)
            return (
            <motion.div
              key={prompt.id}
              variants={itemVariants}
              className="card-hover p-6 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[prompt.category] || categoryColors.custom}`}>
                    {prompt.category}
                  </span>
                  {prompt.priority > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                      <Zap className="w-3 h-3" />
                      Priority {prompt.priority}
                    </span>
                  )}
                  {business && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                      <Building2 className="w-3 h-3" />
                      {business.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(prompt)}
                    className="p-2 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-surface-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-display text-lg font-semibold text-white mb-2">
                {prompt.name}
              </h3>

              <p className="text-surface-400 text-sm mb-4 line-clamp-2">
                {prompt.content}
              </p>

              {prompt.trigger_phrases && prompt.trigger_phrases.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-surface-500" />
                  {prompt.trigger_phrases.slice(0, 3).map((phrase, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-surface-800 text-surface-400 rounded text-xs"
                    >
                      {phrase}
                    </span>
                  ))}
                  {prompt.trigger_phrases.length > 3 && (
                    <span className="text-surface-500 text-xs">
                      +{prompt.trigger_phrases.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )})}
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
                {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
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
                  <label className="label">Business *</label>
                  <select
                    {...register('business_id', { required: 'Business is required', valueAsNumber: true })}
                    className="input-field"
                  >
                    <option value="">Select a business</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {errors.business_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.business_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Prompt Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="input-field"
                    placeholder="Appointment Scheduling"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Category</label>
                  <select {...register('category')} className="input-field">
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.name.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Trigger Phrases</label>
                  <input
                    {...register('trigger_phrases')}
                    className="input-field"
                    placeholder="schedule, appointment, book, visit (comma separated)"
                  />
                  <p className="text-surface-500 text-xs mt-1">
                    Phrases that will trigger this prompt when spoken by the caller
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Response Content *</label>
                  <textarea
                    {...register('content', { required: 'Content is required' })}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="I'd be happy to help you schedule an appointment..."
                  />
                  {errors.content && (
                    <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">AI Instructions</label>
                  <textarea
                    {...register('ai_instructions')}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="Be friendly and professional. Collect patient name and preferred time."
                  />
                </div>

                <div>
                  <label className="label">Priority</label>
                  <input
                    {...register('priority', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="input-field"
                    placeholder="0"
                  />
                  <p className="text-surface-500 text-xs mt-1">
                    Higher priority prompts are matched first
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    {...register('requires_info_collection')}
                    type="checkbox"
                    id="requires_info"
                    className="w-5 h-5 rounded bg-surface-800 border-surface-600 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="requires_info" className="text-surface-300">
                    Requires information collection
                  </label>
                </div>

                {requiresInfoCollection && (
                  <div className="md:col-span-2">
                    <label className="label">Fields to Collect</label>
                    <input
                      {...register('fields_to_collect')}
                      className="input-field"
                      placeholder="name, phone, date, time, reason (comma separated)"
                    />
                  </div>
                )}
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
                      {editingPrompt ? 'Update' : 'Create'} Prompt
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

