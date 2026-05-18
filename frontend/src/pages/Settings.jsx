import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail, Shield, Bell, User, CheckCircle, AlertCircle,
  WifiOff, Loader2, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGmail } from '../hooks/useGmail'
import { SectionHeader } from '../components/ui'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuth()
  const { connected, connecting, gmailProfile, connect, disconnect } = useGmail()

  const [notifications, setNotifications] = useState({
    highRisk:    true,
    dailyReport: false,
    allEmails:   false,
  })

  const handleConnectGmail = async () => {
    const res = await connect()
    if (res.success) {
      toast.success(`Gmail connected! Monitoring ${res.email}`)
    } else {
      toast.error(res.error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast('Gmail disconnected.', { icon: '🔌' })
  }

  const avatar = user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Settings" subtitle="Manage your account, integrations, and preferences" />

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" /> Profile
        </h3>
        <div className="flex items-center gap-4">
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" className="w-14 h-14 rounded-full object-cover ring-2 ring-cyan-500/30" />
            : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white">
                {avatar}
              </div>
            )
          }
          <div>
            <p className="font-semibold text-white">{user?.displayName || 'Anonymous User'}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {user?.providerData?.[0]?.providerId === 'google.com' ? '🔑 Google Account' : '📧 Email/Password'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Gmail Integration */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }} className="glass p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-red-400" /> Gmail Integration
        </h3>

        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
          connected ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              connected ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <Mail className={`w-5 h-5 ${connected ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {connected ? gmailProfile?.emailAddress || 'Gmail Connected' : 'Gmail Account'}
              </p>
              <p className="text-xs text-gray-500">
                {connected
                  ? `${gmailProfile?.messagesTotal?.toLocaleString() || '—'} messages — monitoring active`
                  : 'Not connected — click to authorize'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {connected
              ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
            }

            {connected ? (
              <button onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                <WifiOff className="w-3.5 h-3.5" /> Disconnect
              </button>
            ) : (
              <button
                id="connect-gmail-btn"
                onClick={handleConnectGmail}
                disabled={connecting}
                className="btn-primary flex items-center gap-2"
              >
                {connecting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                  : 'Connect Gmail'
                }
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-cyan-400 font-medium">How it works:</span> Clicking "Connect Gmail" opens a
            Google sign-in popup requesting <code className="text-purple-400">gmail.readonly</code> access.
            MailGuard AI <strong className="text-white">never stores</strong> your emails — only scans and shows threat scores in real-time.
          </p>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }} className="glass p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-yellow-400" /> Notifications
        </h3>
        <div className="space-y-1">
          {[
            { key: 'highRisk',    label: 'High-risk email alerts',   desc: 'Instant alert when critical/high threats are detected' },
            { key: 'dailyReport', label: 'Daily security digest',     desc: 'Morning summary of your inbox health' },
            { key: 'allEmails',   label: 'All email scan results',    desc: 'Notify for every scanned email (verbose)' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-4 mt-0.5 ${
                  notifications[key] ? 'bg-cyan-500' : 'bg-white/10'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  notifications[key] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }} className="glass p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" /> Security
        </h3>
        <div className="space-y-0">
          {[
            { label: 'Authentication',   value: user?.providerData?.[0]?.providerId === 'google.com' ? 'Google OAuth 2.0' : 'Firebase Email/Password' },
            { label: 'Gmail Scope',      value: connected ? 'gmail.readonly (read-only)' : 'Not connected' },
            { label: 'Data Encryption',  value: 'AES-256 at rest' },
            { label: 'API Transport',    value: 'HTTPS / TLS 1.3' },
            { label: 'ML Model',         value: 'TF-IDF + Logistic Regression' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm text-gray-200 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
