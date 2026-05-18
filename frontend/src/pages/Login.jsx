import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, Eye, EyeOff, Chrome, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// Map Firebase error codes to friendly messages
const firebaseError = (code) => {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Try again.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/user-disabled':        'This account has been disabled.',
    'auth/too-many-requests':    'Too many attempts. Please wait a moment.',
    'auth/invalid-credential':   'Invalid email or password.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/cancelled-popup-request': 'Sign-in cancelled.',
    'auth/popup-blocked':        'Popup blocked. Allow popups for this site.',
    'auth/unauthorized-domain':  'This domain is not authorised in Firebase Console. Add localhost to Authorised Domains.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}

export default function Login() {
  const { loginWithGoogle, loginWithEmail, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [googleLoad,  setGoogleLoad]  = useState(false)
  const [forgotMode,  setForgotMode]  = useState(false)

  const handleGoogle = async () => {
    setGoogleLoad(true)
    try {
      await loginWithGoogle()
      toast.success('Welcome! Signed in with Google.')
      navigate('/dashboard')
    } catch (e) {
      toast.error(firebaseError(e.code))
    } finally {
      setGoogleLoad(false)
    }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (e) {
      toast.error(firebaseError(e.code))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) { toast.error('Enter your email above first.'); return }
    setLoading(true)
    try {
      await resetPassword(email)
      toast.success('Password reset email sent! Check your inbox.')
      setForgotMode(false)
    } catch (e) {
      toast.error(firebaseError(e.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 glow-blue animate-pulse-slow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MailGuard AI</h1>
          <p className="text-gray-400 text-sm mt-1">AI-Powered Email Security</p>
        </div>

        <div className="glass p-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            {forgotMode ? 'Reset your password' : 'Sign in to your account'}
          </h2>

          {!forgotMode && (
            <>
              {/* Google Sign-In */}
              <button
                id="login-google"
                onClick={handleGoogle}
                disabled={googleLoad}
                className="btn-ghost w-full flex items-center justify-center gap-3 mb-4"
              >
                {googleLoad
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Chrome className="w-4 h-4" />
                }
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-gray-500">or</span>
                <div className="flex-1 border-t border-white/10" />
              </div>
            </>
          )}

          {/* Email form */}
          <form onSubmit={forgotMode ? handleForgotPassword : handleEmail} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-cyber pl-10"
                />
              </div>
            </div>

            {!forgotMode && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-cyber pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : forgotMode
                  ? <><KeyRound className="w-4 h-4" /> Send Reset Email</>
                  : 'Sign In'
              }
            </button>

            {forgotMode && (
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="btn-ghost w-full text-sm"
              >
                ← Back to sign in
              </button>
            )}
          </form>

          {!forgotMode && (
            <p className="text-center text-xs text-gray-500 mt-6">
              No account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Create one free
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
