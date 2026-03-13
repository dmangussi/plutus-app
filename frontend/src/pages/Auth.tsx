import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

type Mode = 'signin' | 'signup'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password)

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>⚡ Plutus</h1>
        <p style={styles.subtitle}>Family finance tracker</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === 'signin' ? styles.tabActive : {}) }}
            onClick={() => { setMode('signin'); setError(null) }}
          >
            Sign in
          </button>
          <button
            style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : {}) }}
            onClick={() => { setMode('signup'); setError(null) }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0d0d0d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
  },
  card: {
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 12,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 380,
  },
  logo: {
    color: '#c8a86b',
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    color: '#555',
    margin: '6px 0 28px',
    fontSize: 14,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
    background: '#0d0d0d',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: '#555',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'sans-serif',
  },
  tabActive: {
    background: '#1e1e1e',
    color: '#f0ece0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    background: '#0d0d0d',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: '11px 14px',
    color: '#f0ece0',
    fontSize: 14,
    fontFamily: 'sans-serif',
    outline: 'none',
  },
  error: {
    color: '#f87171',
    fontSize: 13,
    margin: 0,
  },
  button: {
    background: '#c8a86b',
    color: '#0d0d0d',
    border: 'none',
    borderRadius: 8,
    padding: '12px 0',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'sans-serif',
    marginTop: 4,
  },
}
