import { motion } from 'framer-motion'

const LEVEL_CLASSES = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
  safe:     'badge-safe',
  spam:     'badge-high',
  ham:      'badge-safe',
}

export function ThreatBadge({ level = 'safe' }) {
  const cls = LEVEL_CLASSES[level?.toLowerCase()] || 'badge-safe'
  return <span className={cls}>{level?.toUpperCase()}</span>
}

export function StatCard({ icon: Icon, label, value, sub, color = 'blue', glow }) {
  const glowClass = {
    blue:   'glow-blue',
    green:  'glow-green',
    red:    'glow-red',
    purple: 'glow-purple',
  }[color] || ''

  const iconColor = {
    blue:   'text-cyan-400   bg-cyan-500/10',
    green:  'text-green-400  bg-green-500/10',
    red:    'text-red-400    bg-red-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  }[color] || 'text-cyan-400 bg-cyan-500/10'

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className={`glass p-6 ${glow ? glowClass : ''} transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-300">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
