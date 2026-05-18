import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts'
import { getDemoAnalytics } from '../services/api'
import { SectionHeader, StatCard } from '../components/ui'
import { TrendingUp, Activity, Percent, Zap } from 'lucide-react'

const HOURLY = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  spam: Math.floor(Math.random() * 30),
  ham:  Math.floor(Math.random() * 80 + 20),
}))

export default function Analytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDemoAnalytics().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics" subtitle="Detailed threat and email activity analysis" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity}   label="Emails / Day"  value="178"  sub="↑ 12% vs yesterday" color="blue"   glow />
        <StatCard icon={Percent}    label="Spam Rate"     value={`${stats?.spam_rate || 25}%`} color="red"    />
        <StatCard icon={TrendingUp} label="Threats Blocked" value="89" sub="this week"          color="purple" />
        <StatCard icon={Zap}        label="Avg. Scan Time" value="42ms" sub="real-time"         color="green"  />
      </div>

      {/* Area */}
      <div className="glass p-6">
        <SectionHeader title="7-Day Trend" subtitle="Daily spam vs clean email volume" />
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={stats?.trend || []}>
            <defs>
              <linearGradient id="spamA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4757" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hamA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="spam" stroke="#ff4757" fill="url(#spamA)" strokeWidth={2} name="Spam" />
            <Area type="monotone" dataKey="ham"  stroke="#00d4ff" fill="url(#hamA)"  strokeWidth={2} name="Clean" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Hourly bar */}
        <div className="glass p-6">
          <SectionHeader title="Hourly Distribution" subtitle="Spam activity by hour of day" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={HOURLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 10 }} interval={3} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="spam" fill="#ff4757" radius={[3,3,0,0]} name="Spam" />
              <Bar dataKey="ham"  fill="#00d4ff" radius={[3,3,0,0]} name="Clean" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line — threat score over time */}
        <div className="glass p-6">
          <SectionHeader title="Threat Score History" subtitle="Average daily threat scores" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats?.trend?.map((d, i) => ({ ...d, avg_score: 30 + i * 8 + Math.floor(Math.random() * 15) })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} domain={[0,100]} />
              <Tooltip />
              <Line type="monotone" dataKey="avg_score" stroke="#b44fff" strokeWidth={2} dot={false} name="Avg Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
