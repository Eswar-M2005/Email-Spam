import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  Mail, ShieldAlert, ShieldCheck, TrendingUp,
  Activity, AlertTriangle, Clock,
} from 'lucide-react'
import { getDemoAnalytics } from '../services/api'
import { StatCard, ThreatBadge, SectionHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#ff4757', '#ff9f43', '#ffd43b', '#00d4ff', '#00ff88']

const DEMO_ALERTS = [
  { id: 1, sender: 'noreply@paypa1-secure.com', subject: 'Your account has been suspended', level: 'critical', time: '2m ago' },
  { id: 2, sender: 'prize@winner-notify.tk',     subject: 'Congratulations! You won $5000',  level: 'high',     time: '8m ago' },
  { id: 3, sender: 'alerts@amazon.com',           subject: 'Your recent order shipped',        level: 'safe',     time: '15m ago' },
  { id: 4, sender: 'info@discount-meds.xyz',      subject: 'Limited offer — 90% off pills',   level: 'high',     time: '1h ago' },
  { id: 5, sender: 'hr@yourcompany.com',           subject: 'Q2 Review — Action Required',     level: 'safe',     time: '2h ago' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4 } },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDemoAnalytics()
      .then(setStats)
      .catch(() => setStats({ total: 0, spam: 0, ham: 0, high_risk: 0, spam_rate: 0, trend: [], threat_levels: {} }))
      .finally(() => setLoading(false))
  }, [])

  const pieData = stats?.threat_levels
    ? Object.entries(stats.threat_levels).map(([name, value]) => ({ name, value }))
    : []

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.displayName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Your inbox security status — last updated just now
          </p>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
          <span className="live-ring" />
          <span className="text-xs text-gray-300">Live</span>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Mail}        label="Total Scanned" value={stats?.total?.toLocaleString() || '—'} color="blue" glow />
        <StatCard icon={ShieldAlert} label="Spam Detected" value={stats?.spam?.toLocaleString()  || '—'} color="red"  />
        <StatCard icon={ShieldCheck} label="Clean Emails"  value={stats?.ham?.toLocaleString()   || '—'} color="green"/>
        <StatCard icon={AlertTriangle} label="High Risk"   value={stats?.high_risk || '—'}
          sub={`${stats?.spam_rate || 0}% spam rate`} color="purple" />
      </motion.div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <motion.div variants={item} className="glass p-6 lg:col-span-2">
          <SectionHeader title="Email Activity" subtitle="Spam vs clean — last 7 days" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.trend || []}>
              <defs>
                <linearGradient id="spamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff4757" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="spam" stroke="#ff4757" fill="url(#spamGrad)" strokeWidth={2} name="Spam" />
              <Area type="monotone" dataKey="ham"  stroke="#00d4ff" fill="url(#hamGrad)"  strokeWidth={2} name="Clean" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div variants={item} className="glass p-6">
          <SectionHeader title="Threat Levels" subtitle="Distribution" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="capitalize">{d.name}</span>
                <span className="ml-auto text-white font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Live feed */}
      <motion.div variants={item} className="glass p-6">
        <SectionHeader
          title="Live Activity Feed"
          subtitle="Most recent emails processed"
          action={
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Auto-refreshing
            </div>
          }
        />
        <div className="space-y-3">
          {DEMO_ALERTS.map((alert, idx) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/5 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                alert.level === 'critical' ? 'bg-red-400'
                : alert.level === 'high'   ? 'bg-orange-400'
                : 'bg-green-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{alert.subject}</p>
                <p className="text-xs text-gray-500 truncate">{alert.sender}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <ThreatBadge level={alert.level} />
                <span className="text-xs text-gray-500">{alert.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
