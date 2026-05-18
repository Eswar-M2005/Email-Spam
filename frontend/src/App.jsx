import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import InboxMonitor from './pages/InboxMonitor'
import ThreatCenter from './pages/ThreatCenter'
import Analytics   from './pages/Analytics'
import AIInsights  from './pages/AIInsights'
import Settings    from './pages/Settings'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected — wrapped in Layout (sidebar + outlet) */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/inbox"       element={<InboxMonitor />} />
        <Route path="/threats"     element={<ThreatCenter />} />
        <Route path="/analytics"   element={<Analytics />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/settings"    element={<Settings />} />
        <Route path="/"            element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
