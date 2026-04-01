import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

type Mode = 'signin' | 'signup'

const C = {
  bg:      '#0c0c0c',
  surface: '#141414',
  border:  '#1e1e1e',
  primary: '#c96a3a',
  text:    '#e3e2df',
  text2:   '#a0a0a0',
  text3:   '#5a5a5a',
} as const

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

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
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          fontSize: 36, color: '#c96a3a',
          marginBottom: 16, lineHeight: 1,
        }}>
          ✳
        </div>
        <h1 style={{
          fontFamily: 'Lora, Georgia, serif',
          fontSize: 32, fontWeight: 600,
          color: C.text, letterSpacing: -0.5,
          marginBottom: 8,
        }}>
          Plutus
        </h1>
        <p style={{ color: C.text3, fontSize: 15, fontFamily: 'Inter, sans-serif' }}>
          Finanças da família
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '28px 24px',
      }}>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: C.bg,
          borderRadius: 10, padding: 3, marginBottom: 24,
          border: `1px solid ${C.border}`,
        }}>
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              style={{
                flex: 1, padding: '9px 0', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                fontSize: 13, fontWeight: 500, transition: 'all .15s',
                background: mode === m ? '#1e1e1e' : 'transparent',
                color: mode === m ? C.text : C.text3,
              }}
            >
              {m === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email" placeholder="E-mail"
            value={email} onChange={e => setEmail(e.target.value)}
            required
            style={{
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '13px 14px',
              color: C.text, fontSize: 14,
              fontFamily: 'Inter, sans-serif', outline: 'none',
              transition: 'border-color .15s',
            }}
          />
          <input
            type="password" placeholder="Senha"
            value={password} onChange={e => setPassword(e.target.value)}
            required
            style={{
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '13px 14px',
              color: C.text, fontSize: 14,
              fontFamily: 'Inter, sans-serif', outline: 'none',
              transition: 'border-color .15s',
            }}
          />

          {error && (
            <p style={{
              color: '#e07a5f', fontSize: 13, margin: 0,
              padding: '10px 12px', background: '#1a1008',
              border: '1px solid #3a2010', borderRadius: 8,
              fontFamily: 'Inter, sans-serif',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              background: loading ? '#1e1e1e' : C.primary,
              color: loading ? C.text3 : '#fff',
              border: 'none', borderRadius: 10,
              padding: '13px 0', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              marginTop: 4, transition: 'all .15s',
              letterSpacing: 0.2,
            }}
          >
            {loading ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
