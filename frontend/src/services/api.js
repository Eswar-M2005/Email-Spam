import axios from 'axios'
import { auth } from './firebase'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({ baseURL: BASE_URL })

// Attach Firebase ID token to every request automatically
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Prediction ────────────────────────────────────────────────────────────────

export const classifyEmail = (payload) =>
  api.post('/predict/', payload).then((r) => r.data)

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getDemoAnalytics = () =>
  api.get('/analytics/demo').then((r) => r.data)

export const getUserAnalytics = () =>
  api.get('/analytics/summary').then((r) => r.data)

export const getRecentEmails = () =>
  api.get('/analytics/recent').then((r) => r.data)

// ── Gmail ─────────────────────────────────────────────────────────────────────

export const getGmailStatus = () =>
  api.get('/gmail/status').then((r) => r.data)

export const connectGmail = () =>
  api.get('/gmail/connect').then((r) => r.data)

export const scanInbox = (maxResults = 10) =>
  api.post('/gmail/scan', { max_results: maxResults }).then((r) => r.data)

export const getEmailHistory = (limit = 20) =>
  api.get(`/gmail/history?limit=${limit}`).then((r) => r.data)

// ── AI ────────────────────────────────────────────────────────────────────────

export const explainThreat = (payload) =>
  api.post('/ai/explain', payload).then((r) => r.data)

export const summarizeEmail = (payload) =>
  api.post('/ai/summarize', payload).then((r) => r.data)

export default api
