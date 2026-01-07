import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface Business {
  id: number
  name: string
  business_type: string
  description?: string
  phone_number?: string
  email?: string
  website?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  business_hours: Record<string, { open: string; close: string; closed?: boolean }>
  services: string[]
  ai_voice: string
  ai_personality?: string
  greeting_message: string
  twilio_phone_number?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Prompt {
  id: number
  business_id: number
  name: string
  category: string
  trigger_phrases?: string[]
  content: string
  ai_instructions?: string
  requires_info_collection: boolean
  fields_to_collect?: string[]
  priority: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Call {
  id: number
  business_id: number
  twilio_call_sid?: string
  caller_number?: string
  called_number?: string
  status: string
  duration_seconds: number
  transcript?: string
  call_summary?: string
  caller_intent?: string
  sentiment?: string
  collected_info: Record<string, unknown>
  action_taken?: string
  action_details: Record<string, unknown>
  recording_url?: string
  started_at: string
  ended_at?: string
}

export interface Integration {
  id: number
  business_id: number
  name: string
  integration_type: string
  api_base_url?: string
  api_key?: string
  config: Record<string, unknown>
  is_active: boolean
  is_connected: boolean
  last_sync_at?: string
  last_error?: string
  created_at: string
  updated_at?: string
}

// Business API
export const businessApi = {
  list: () => api.get<Business[]>('/businesses/').then(res => res.data),
  get: (id: number) => api.get<Business>(`/businesses/${id}`).then(res => res.data),
  create: (data: Partial<Business>) => api.post<Business>('/businesses/', data).then(res => res.data),
  update: (id: number, data: Partial<Business>) => api.put<Business>(`/businesses/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/businesses/${id}`),
}

// Prompt API
export const promptApi = {
  list: (businessId?: number) => {
    const params = businessId ? { business_id: businessId } : {}
    return api.get<Prompt[]>('/prompts/', { params }).then(res => res.data)
  },
  get: (id: number) => api.get<Prompt>(`/prompts/${id}`).then(res => res.data),
  create: (data: Partial<Prompt>) => api.post<Prompt>('/prompts/', data).then(res => res.data),
  update: (id: number, data: Partial<Prompt>) => api.put<Prompt>(`/prompts/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/prompts/${id}`),
  getCategories: () => api.get<{ value: string; name: string }[]>('/prompts/categories').then(res => res.data),
  createDefaults: (businessId: number) => api.post(`/prompts/templates/${businessId}`).then(res => res.data),
}

// Call API
export const callApi = {
  list: (businessId?: number) => {
    const params = businessId ? { business_id: businessId } : {}
    return api.get<Call[]>('/calls/', { params }).then(res => res.data)
  },
  get: (id: number) => api.get<Call>(`/calls/${id}`).then(res => res.data),
  getStats: (businessId: number) => api.get(`/calls/stats/${businessId}`).then(res => res.data),
}

// Integration API
export const integrationApi = {
  listAvailable: () => api.get('/integrations/available').then(res => res.data),
  list: (businessId?: number) => {
    const params = businessId ? { business_id: businessId } : {}
    return api.get<Integration[]>('/integrations/', { params }).then(res => res.data)
  },
  get: (id: number) => api.get<Integration>(`/integrations/${id}`).then(res => res.data),
  create: (data: Partial<Integration>) => api.post<Integration>('/integrations/', data).then(res => res.data),
  update: (id: number, data: Partial<Integration>) => api.put<Integration>(`/integrations/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/integrations/${id}`),
  test: (id: number) => api.post(`/integrations/${id}/test`).then(res => res.data),
}

export default api

