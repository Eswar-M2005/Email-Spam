import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, ShieldAlert, FileText } from 'lucide-react'
import { classifyEmail, explainThreat } from '../services/api'
import { ThreatBadge, SectionHeader } from '../components/ui'
import toast from 'react-hot-toast'

const EXAMPLE_EMAILS = [
  {
    label: 'Phishing Example',
    subject: 'Urgent: Verify your PayPal account',
    sender: 'security@paypa1-secure.com',
    body: `Dear Customer,\n\nWe have detected unusual activity on your PayPal account. Your account has been temporarily limited.\n\nTo restore your account access, please click the link below immediately:\nhttps://bit.ly/restore-paypal-now\n\nFailure to verify within 24 hours will result in permanent account suspension.\n\nPayPal Security Team`,
  },
  {
    label: 'Scam Example',
    subject: 'Congratulations! You won $5,000',
    sender: 'winner@prize-claim.tk',
    body: `CONGRATULATIONS!\n\nYou have been selected as our lucky winner. You have WON $5,000 in our online lottery.\n\nTo claim your prize, reply with your full name, address, bank account details and a processing fee of $49.99.\n\nAct now — this offer expires in 24 hours!`,
  },
]

export default function AIInsights() {
  const [emailBody, setEmailBody] = useState('')
  const [sender,    setSender]    = useState('')
  const [subject,   setSubject]   = useState('')
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)

  const loadExample = (ex) => {
    setEmailBody(ex.body)
    setSender(ex.sender)
    setSubject(ex.subject)
    setResult(null)
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!emailBody.trim()) { toast.error('Enter email content first'); return }
    setLoading(true)
    setResult(null)
    try {
      // First classify
      const classResult = await classifyEmail({ email: emailBody, sender, subject })
      // Then get AI explanation
      const aiResult = await explainThreat({
        subject,
        sender,
        snippet:      emailBody.substring(0, 200),
        threat_level: classResult.threat_level,
        threat_type:  classResult.threat_type,
        factors:      classResult.factors,
      })
      setResult({ ...classResult, explanation: aiResult.explanation })
    } catch {
      toast.error('Analysis failed — check backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Insights"
        subtitle="Natural language threat explanations powered by AI"
        action={
          <div className="flex items-center gap-2 text-xs text-purple-400 glass px-3 py-1.5 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
            AI Powered
          </div>
        }
      />

      {/* Example buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 flex items-center">Try an example:</span>
        {EXAMPLE_EMAILS.map((ex) => (
          <button key={ex.label} onClick={() => loadExample(ex)}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            {ex.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="glass p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Email Content
          </h3>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <input value={sender} onChange={(e) => setSender(e.target.value)}
              placeholder="Sender email" className="input-cyber" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line" className="input-cyber" />
            <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
              rows={9} placeholder="Paste email body here…" className="input-cyber resize-none" />
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500
                transition-all duration-200 shadow-lg shadow-purple-500/20 active:scale-95">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI…</>
                : <><Sparkles className="w-4 h-4" /> Generate AI Analysis</>
              }
            </button>
          </form>
        </motion.div>

        {/* AI result */}
        <div>
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div key="idle" className="glass p-8 flex flex-col items-center justify-center h-full min-h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 animate-pulse-slow">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm font-medium">AI analysis will appear here</p>
                <p className="text-gray-600 text-xs mt-1">Paste an email or try an example above</p>
              </motion.div>
            )}

            {loading && (
              <motion.div key="loading" className="glass p-8 flex flex-col items-center justify-center h-full min-h-64">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="absolute inset-0 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-purple-400 text-sm font-medium">AI is analyzing the threat…</p>
                <div className="flex gap-1 mt-3">
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  ))}
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="glass border border-purple-500/20 bg-purple-500/5 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-white">AI Threat Analysis</span>
                  </div>
                  <ThreatBadge level={result.threat_level} />
                </div>

                {/* AI Explanation — star of the show */}
                <div className="bg-white/5 border border-purple-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">AI Generated Insight</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{result.explanation}</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Spam Prob',    value: `${result.spam_prob}%`, color: 'text-red-400'   },
                    { label: 'Threat Score', value: `${result.threat_score}/100`, color: 'text-orange-400'},
                    { label: 'Risk Level',   value: result.risk,             color: 'text-yellow-400'},
                  ].map(m => (
                    <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center">
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div className="bg-white/5 rounded-xl p-4 border-l-2 border-purple-500">
                  <p className="text-xs text-purple-400 mb-1 font-medium">AI Recommendation</p>
                  <p className="text-sm text-gray-300">{result.recommendation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
