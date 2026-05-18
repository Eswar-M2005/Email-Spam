import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, googleProvider } from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  /** Google Sign-In popup */
  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)

  /** Email + Password Sign-In */
  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  /** Register new user with email + password */
  const register = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(credential.user, { displayName })
    }
    return credential
  }

  /** Send password reset email */
  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  /** Sign Out */
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithEmail, register, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
