import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { AlertTriangle, ShieldX, Flame, Search, Filter } from 'lucide-react'
import { ThreatBadge, SectionHeader } from '../components/ui'

const DEMO_THREATS = [
  { id: 1, sender: 'noreply@paypa1-secure.com',   subject: 'Verify your PayPal account NOW',         level: 'critical', score: 92, type: 'Phishing',       time: '5m ago'  },
  { id: 2, sender: 'prize@winner-notify.tk',       subject: 'You won $5,000 — claim within 24hrs',   level: 'critical', score: 88, type: 'Scam',            time: '12m ago' },
  { id: 3, sender: 'admin@microsofft-support.com', subject: 'Windows license expired — act now',     level: 'high',     score: 75, type: 'Phishing',       time: '1h ago'  },
  { id: 4, sender: 'deals@bestpharma.xyz',         subject: '90% off prescription meds — today only',level: 'high',     score: 71, type: 'Spam',            time: '2h ago'  },
  { id: 5, sender: 'taxrefund@irs-gov.info',       subject: 'IRS Tax Refund — claim your $3,200',    level: 'critical', score: 95, type: 'Government Scam', time: '3h ago'  },
  { id: 6, sender: 'info@discount-meds.xyz',       subject: 'Limited offer — lose 30lbs in 10 days', level: 'medium',   score: 55, type: 'Spam',            time: '4h ago'  },
  { id: 7, sender: 'support@bankofamerica-secure.net', subject: 'Unusual account activity detected', level: 'critical', score: 90, type: 'Phishing',       time: '5h ago'  },
]

const RADAR_DATA = [
  { subject: 'Phishing',   A: 90 },
  { subject: 'URLs',       A: 72 },
  { subject: 'Keywords',   A: 65 },
  { subject: 'Urgency',    A: 88 },
  { subject: 'Domains',    A: 55 },
  { subject: 'Attachments',A: 30 },
]

const BAR_DATA = [
  { name: 'Phishing',   count: 34 },
  { name: 'Scam',       count: 22 },
  { name: 'Spam',       count: 89 },
  { name: 'Gov Scam',   count: 8  },
  { name: 'Malware',    count: 5  },
]

export default function ThreatCenter() {
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = DEMO_THREATS.filter((t) => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase())
                     || t.sender.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || t.level === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Threat Center"
        subtitle="High-risk email detections and threat analysis"
        action={
          <div className="flex items-center gap-2">
            <span className="badge-critical">{DEMO_THREATS.filter(t => t.level === 'critical').length} Critical</span>
            <span className="badge-high">{DEMO_THREATS.filter(t => t.level === 'high').length} High</span>
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Threat Vector Analysis</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Radar name="Threat" dataKey="A" stroke="#ff4757" fill="#ff4757" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Bar */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Threat Types This Week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={BAR_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#ff4757" radius={[4,4,0,0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Threat list */}
      <div className="glass p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threats…" className="input-cyber pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {['all', 'critical', 'high', 'medium'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-500 hover:text-gray-300'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((threat, idx) => (
            <motion.div key={threat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelected(selected?.id === threat.id ? null : threat)}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  threat.level === 'critical' ? 'bg-red-500/20' : threat.level === 'high' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                }`}>
                  {threat.level === 'critical' ? <Flame className="w-5 h-5 text-red-400" />
                    : <AlertTriangle className="w-5 h-5 text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{threat.subject}</p>
                  <p className="text-xs text-gray-500 truncate">{threat.sender}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{threat.score}</p>
                    <p className="text-xs text-gray-500">score</p>
                  </div>
                  <ThreatBadge level={threat.level} />
                  <span className="text-xs text-gray-500 hidden sm:block">{threat.time}</span>
                </div>
              </div>
              {selected?.id === threat.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-500">Type: </span><span className="text-gray-200">{threat.type}</span></div>
                  <div><span className="text-gray-500">Score: </span><span className="text-gray-200">{threat.score}/100</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Sender: </span><span className="text-gray-200 font-mono">{threat.sender}</span></div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
