import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { apiFetch } from '../lib/api'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  loading: boolean
  signIn:  (email: string, password: string) => Promise<{ error?: string }>
  signUp:  (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('plutus_token')
    if (!token) { setLoading(false); return }
    apiFetch('/api/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => sessionStorage.removeItem('plutus_token'))
      .finally(() => setLoading(false))
  }, [])

  async function signIn(email: string, password: string) {
    try {
      const data = await apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      sessionStorage.setItem('plutus_token', data.access_token)
      setUser(data.user)
      return {}
    } catch (e) {
      return { error: (e as Error).message }
    }
  }

  async function signUp(email: string, password: string) {
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (data.access_token) {
        sessionStorage.setItem('plutus_token', data.access_token)
        setUser(data.user)
      }
      return {}
    } catch (e) {
      return { error: (e as Error).message }
    }
  }

  async function signOut() {
    await apiFetch('/api/auth/signout', { method: 'DELETE' }).catch(() => {})
    sessionStorage.removeItem('plutus_token')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
