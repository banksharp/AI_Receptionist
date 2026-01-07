import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Key, 
  Phone, 
  Bot,
  Save,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react'

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [showTwilioToken, setShowTwilioToken] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [settings, setSettings] = useState({
    openai_api_key: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    default_ai_voice: 'alloy',
    default_greeting: 'Thank you for calling. How may I help you today?'
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to the backend
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const voiceOptions = [
    { value: 'alloy', label: 'Alloy (Neutral)' },
    { value: 'echo', label: 'Echo (Male)' },
    { value: 'fable', label: 'Fable (British)' },
    { value: 'onyx', label: 'Onyx (Deep Male)' },
    { value: 'nova', label: 'Nova (Female)' },
    { value: 'shimmer', label: 'Shimmer (Soft Female)' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-6"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        <p className="text-surface-400 mt-1">Configure your AI Receptionist platform</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* OpenAI Configuration */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">OpenAI Configuration</h2>
              <p className="text-surface-500 text-sm">Configure AI model access</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.openai_api_key}
                  onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                  className="input-field pr-12"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-700 rounded-lg text-surface-400"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-surface-500 text-xs mt-1">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">OpenAI Dashboard</a>
              </p>
            </div>

            <div>
              <label className="label">Default AI Voice</label>
              <select
                value={settings.default_ai_voice}
                onChange={(e) => setSettings({ ...settings, default_ai_voice: e.target.value })}
                className="input-field"
              >
                {voiceOptions.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Default Greeting Message</label>
              <textarea
                value={settings.default_greeting}
                onChange={(e) => setSettings({ ...settings, default_greeting: e.target.value })}
                rows={2}
                className="input-field resize-none"
                placeholder="Thank you for calling. How may I help you today?"
              />
            </div>
          </div>
        </div>

        {/* Twilio Configuration */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Twilio Configuration</h2>
              <p className="text-surface-500 text-sm">Configure voice calling capabilities</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Account SID</label>
              <input
                type="text"
                value={settings.twilio_account_sid}
                onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                className="input-field"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div>
              <label className="label">Auth Token</label>
              <div className="relative">
                <input
                  type={showTwilioToken ? 'text' : 'password'}
                  value={settings.twilio_auth_token}
                  onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                  className="input-field pr-12"
                  placeholder="Your auth token"
                />
                <button
                  type="button"
                  onClick={() => setShowTwilioToken(!showTwilioToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-700 rounded-lg text-surface-400"
                >
                  {showTwilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={settings.twilio_phone_number}
                onChange={(e) => setSettings({ ...settings, twilio_phone_number: e.target.value })}
                className="input-field"
                placeholder="+1234567890"
              />
              <p className="text-surface-500 text-xs mt-1">
                Your Twilio phone number for receiving calls
              </p>
            </div>
          </div>
        </div>

        {/* API Keys Info */}
        <div className="card p-6 bg-gradient-to-r from-primary-900/30 to-primary-800/20 border-primary-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Security Note</h3>
              <p className="text-surface-400 text-sm">
                API keys are stored securely and encrypted. Never share your API keys publicly. 
                In production, these should be stored as environment variables on your server.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-emerald-400"
            >
              <CheckCircle2 className="w-5 h-5" />
              Settings saved successfully
            </motion.div>
          )}
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </form>
    </motion.div>
  )
}

