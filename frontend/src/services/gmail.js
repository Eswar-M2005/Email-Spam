/**
 * Gmail Service — calls Gmail REST API using the OAuth access token
 * obtained from Firebase Google Sign-In with gmail.readonly scope.
 */

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

async function gmailFetch(path, token) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gmail API error ${res.status}`)
  }
  return res.json()
}

/** Get the authenticated user's Gmail profile */
export async function getGmailProfile(token) {
  return gmailFetch('/users/me/profile', token)
}

/** List recent messages — returns array of {id, threadId} */
export async function listMessages(token, maxResults = 20, query = '') {
  const q = query ? `&q=${encodeURIComponent(query)}` : ''
  const data = await gmailFetch(
    `/users/me/messages?maxResults=${maxResults}${q}`,
    token
  )
  return data.messages || []
}

/** Get a single message with full payload */
export async function getMessage(token, id) {
  return gmailFetch(`/users/me/messages/${id}?format=full`, token)
}

/** Extract plain text body from a Gmail message payload */
export function extractBody(payload) {
  if (!payload) return ''

  // Direct body
  if (payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
  }

  // Multipart — prefer text/plain, fallback to text/html
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain')
    const html  = payload.parts.find(p => p.mimeType === 'text/html')
    const part  = plain || html
    if (part?.body?.data) {
      const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      return html && !plain
        ? decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : decoded
    }
    // Nested multipart
    for (const p of payload.parts) {
      const body = extractBody(p)
      if (body) return body
    }
  }

  return ''
}

/** Extract a header value from a message */
export function getHeader(headers = [], name) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
}
