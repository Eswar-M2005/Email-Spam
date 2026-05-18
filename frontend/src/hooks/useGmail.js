import { useState, useCallback, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../services/firebase'
import { getGmailProfile, listMessages, getMessage, extractBody, getHeader } from '../services/gmail'

const TOKEN_KEY  = 'gmail_access_token'
const EXPIRY_KEY = 'gmail_token_expiry'

// Dedicated provider for Gmail — requests gmail.readonly scope
// prompt: 'consent' forces Google to always show the permissions screen
// access_type: 'online' (default — gets a short-lived access token)
const gmailProvider = new GoogleAuthProvider()
gmailProvider.addScope('https://www.googleapis.com/auth/gmail.readonly')
gmailProvider.addScope('email')
gmailProvider.addScope('profile')
gmailProvider.setCustomParameters({
  prompt:      'consent',
  access_type: 'online',
})


export function useGmail() {
  const [gmailToken,   setGmailToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [gmailProfile, setGmailProfile] = useState(null)
  const [connected,    setConnected]    = useState(false)
  const [connecting,   setConnecting]   = useState(false)
  const [emails,       setEmails]       = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // Validate stored token on mount
  useEffect(() => {
    const token  = localStorage.getItem(TOKEN_KEY)
    const expiry = localStorage.getItem(EXPIRY_KEY)
    if (token && expiry && Date.now() < parseInt(expiry)) {
      setGmailToken(token)
      setConnected(true)
      getGmailProfile(token).catch(() => {
        // Token expired
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(EXPIRY_KEY)
        setGmailToken(null)
        setConnected(false)
      })
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(EXPIRY_KEY)
    }
  }, [])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      // Re-auth popup with Gmail scope
      const result     = await signInWithPopup(auth, gmailProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token      = credential?.accessToken

      if (!token) throw new Error('Could not obtain access token from Google')

      // Verify Gmail access
      const profile = await getGmailProfile(token)

      // Store token (Google access tokens last ~1 hour)
      const expiry = Date.now() + 55 * 60 * 1000
      localStorage.setItem(TOKEN_KEY,  token)
      localStorage.setItem(EXPIRY_KEY, expiry.toString())

      setGmailToken(token)
      setGmailProfile(profile)
      setConnected(true)
      return { success: true, email: profile.emailAddress }
    } catch (e) {
      const msg = e.code === 'auth/popup-closed-by-user'
        ? 'Sign-in was cancelled.'
        : e.code === 'auth/popup-blocked'
        ? 'Popup was blocked — allow popups for localhost.'
        : e.message || 'Failed to connect Gmail'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRY_KEY)
    setGmailToken(null)
    setGmailProfile(null)
    setConnected(false)
    setEmails([])
  }, [])

  const fetchEmails = useCallback(async (query = '', max = 15) => {
    if (!gmailToken) return []
    setLoading(true)
    setError(null)
    try {
      const ids = await listMessages(gmailToken, max, query)
      if (!ids.length) { setEmails([]); return [] }

      // Fetch full messages in parallel (max 5 at a time)
      const chunks = []
      for (let i = 0; i < ids.length; i += 5) {
        chunks.push(ids.slice(i, i + 5))
      }
      const results = []
      for (const chunk of chunks) {
        const msgs = await Promise.all(chunk.map(({ id }) => getMessage(gmailToken, id)))
        results.push(...msgs)
      }

      const parsed = results.map(msg => {
        const headers = msg.payload?.headers || []
        return {
          id:       msg.id,
          threadId: msg.threadId,
          subject:  getHeader(headers, 'Subject') || '(no subject)',
          sender:   getHeader(headers, 'From')    || 'unknown',
          date:     getHeader(headers, 'Date')    || '',
          snippet:  msg.snippet || '',
          body:     extractBody(msg.payload),
          labelIds: msg.labelIds || [],
        }
      })

      setEmails(parsed)
      return parsed
    } catch (e) {
      setError(e.message)
      if (e.message.includes('401') || e.message.includes('Invalid Credentials')) {
        disconnect()
      }
      return []
    } finally {
      setLoading(false)
    }
  }, [gmailToken, disconnect])

  return {
    connected, connecting, gmailToken, gmailProfile,
    emails, loading, error,
    connect, disconnect, fetchEmails,
  }
}
