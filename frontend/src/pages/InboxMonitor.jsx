import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, RefreshCw, Search, ScanLine, Wifi, WifiOff,
  AlertTriangle, ShieldCheck, Loader2, Inbox, ExternalLink,
} from 'lucide-react'
import { useGmail } from '../hooks/useGmail'
import { classifyEmail } from '../services/api'
import { ThreatBadge, SectionHeader } from '../components/ui'
import toast from 'react-hot-toast'

function ThreatMeter({ score }) {
  const color =
    score >= 80 ? '#ff4757' : score >= 60 ? '#ff9f43' :
    score >= 40 ? '#ffd43b' : score >= 20 ? '#00d4ff' : '#00ff88'
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, #00ff88, ${color})` }}
      />
    </div>
  )
}

export default function InboxMonitor() {
  const { connected, connecting, emails, loading, connect, fetchEmails } = useGmail()

  const [search,    setSearch]    = useState('')
  const [scanning,  setScanning]  = useState({})   // id → result
  const [scanAll,   setScanAll]   = useState(false)
  const [expanded,  setExpanded]  = useState(null)

  const filtered = emails.filter(e =>
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    e.sender.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (connected && emails.length === 0) {
      fetchEmails('', 20)
    }
  }, [connected])

  const handleConnect = async () => {
    const res = await connect()
    if (res.success) {
      toast.success(`Connected! Loading emails from ${res.email}…`)
      await fetchEmails('', 20)
    } else {
      toast.error(res.error)
    }
  }

  const scanEmail = async (email) => {
    setScanning(s => ({ ...s, [email.id]: 'loading' }))
    try {
      const result = await classifyEmail({
        email:   email.body || email.snippet,
        sender:  email.sender,
        subject: email.subject,
      })
      setScanning(s => ({ ...s, [email.id]: result }))
    } catch {
      toast.error('Scan failed — is the backend running?')
      setScanning(s => ({ ...s, [email.id]: null }))
    }
  }

  const scanAllEmails = async () => {
    setScanAll(true)
    for (const email of filtered.slice(0, 10)) {
      await scanEmail(email)
    }
    setScanAll(false)
    toast.success('Scan complete!')
  }

  const refreshEmails = async () => {
    await fetchEmails('', 20)
    toast.success('Inbox refreshed')
  }

  /* ── Not connected ───────────────────────────────────────────── */
  if (!connected) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Inbox Monitor" subtitle="Connect Gmail to start real-time threat scanning" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 flex flex-col items-center justify-center text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 animate-pulse-slow">
            <Mail className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Gmail</h3>
          <p className="text-gray-400 text-sm max-w-md mb-8 leading-relaxed">
            Authorize MailGuard AI with <strong className="text-white">read-only</strong> Gmail access.
            We scan for phishing, spam, and threats — your emails are never stored.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
            {[
              { icon: '🔍', label: 'Real-time scanning' },
              { icon: '🛡️', label: 'Threat detection' },
              { icon: '🔒', label: 'Read-only access' },
            ].map(f => (
              <div key={f.label} className="glass p-3 text-center rounded-xl">
                <p className="text-2xl mb-1">{f.icon}</p>
                <p className="text-xs text-gray-400">{f.label}</p>
              </div>
            ))}
          </div>

          <button
            id="connect-gmail-inbox"
            onClick={handleConnect}
            disabled={connecting}
            className="btn-primary flex items-center gap-2 px-8"
          >
            {connecting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
              : <><Mail className="w-4 h-4" /> Connect Gmail</>
            }
          </button>
        </motion.div>
      </div>
    )
  }

  /* ── Connected ───────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Inbox Monitor"
        subtitle="Real-time AI threat scanning of your Gmail"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-green-400 glass px-3 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Gmail Connected
            </div>
            <button
              onClick={scanAllEmails}
              disabled={scanAll || loading}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {scanAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
              Scan All
            </button>
            <button onClick={refreshEmails} disabled={loading}
              className="btn-ghost p-2 rounded-lg">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emails by subject or sender…"
          className="input-cyber pl-9"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass p-8 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-gray-400 text-sm">Loading inbox…</span>
        </div>
      )}

      {/* Email list */}
      {!loading && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="glass p-8 text-center">
              <Inbox className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No emails found</p>
            </div>
          )}

          {filtered.map((email, idx) => {
            const result  = scanning[email.id]
            const isLoading = result === 'loading'
            const hasResult = result && result !== 'loading'
            const isExpanded = expanded === email.id

            return (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`glass border transition-all ${
                  hasResult
                    ? result.threat_level === 'critical' ? 'border-red-500/30'
                    : result.threat_level === 'high'     ? 'border-orange-500/20'
                    : result.threat_level === 'safe'     ? 'border-green-500/20'
                    : 'border-white/5'
                    : 'border-white/5'
                }`}
              >
                {/* Header row */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/3 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : email.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Left — threat indicator dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                      hasResult
                        ? result.threat_level === 'critical' ? 'bg-red-400'
                        : result.threat_level === 'high'     ? 'bg-orange-400'
                        : result.threat_level === 'medium'   ? 'bg-yellow-400'
                        : 'bg-green-400'
                        : 'bg-gray-600'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{email.subject}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{email.sender}</p>
                      {hasResult && <ThreatMeter score={result.threat_score} />}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasResult && <ThreatBadge level={result.threat_level} />}
                      {isLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                      {!hasResult && !isLoading && (
                        <button
                          onClick={e => { e.stopPropagation(); scanEmail(email) }}
                          className="text-xs px-2.5 py-1 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all"
                        >
                          Scan
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-4 space-y-3">
                        {/* Snippet */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Preview</p>
                          <p className="text-xs text-gray-300 leading-relaxed line-clamp-4">
                            {email.body?.substring(0, 400) || email.snippet}
                          </p>
                        </div>

                        {/* Scan result detail */}
                        {hasResult && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-gray-500">Spam Probability</p>
                              <p className="text-white font-bold">{result.spam_prob}%</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-gray-500">Threat Score</p>
                              <p className="text-white font-bold">{result.threat_score}/100</p>
                            </div>
                            <div className="col-span-2 bg-white/5 rounded-lg p-2">
                              <p className="text-gray-500 mb-1">Recommendation</p>
                              <p className="text-gray-200">{result.recommendation}</p>
                            </div>
                            {result.keywords?.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-gray-500 mb-1">Flagged keywords</p>
                                <div className="flex flex-wrap gap-1">
                                  {result.keywords.slice(0, 8).map(k => (
                                    <span key={k} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400 font-mono">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
