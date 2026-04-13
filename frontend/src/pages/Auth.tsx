import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLoading } from '../hooks/useLoading'
import { ErrorMessage } from '../components/ErrorMessage'
import { colors, fonts } from '../styles/theme'
import { inputStyle, btnPrimary } from '../styles/common'

type Mode = 'signin' | 'signup'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const { show, hide } = useLoading()
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    show(mode === 'signin' ? 'Entrando...' : 'Criando conta...')
    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password)
    hide()
    if (error) setError(error)
    setLoading(false)
  }

  const fieldStyle: React.CSSProperties = {
    ...inputStyle,
    background: colors.bg,
    padding: '13px 14px',
    fontSize: 14,
    transition: 'border-color .15s',
  }

  return (
    <div style={{
      minHeight: '100vh', background: colors.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 36, color: colors.primary, marginBottom: 16, lineHeight: 1 }}>✳</div>
        <h1 style={{
          fontFamily: fonts.heading, fontSize: 32, fontWeight: 600,
          color: colors.text, letterSpacing: -0.5, marginBottom: 8,
        }}>
          Plutus
        </h1>
        <p style={{ color: colors.text3, fontSize: 15, fontFamily: fonts.body }}>
          Finanças da família
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 16, padding: '28px 24px',
      }}>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: colors.bg,
          borderRadius: 10, padding: 3, marginBottom: 24,
          border: `1px solid ${colors.border}`,
        }}>
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              style={{
                flex: 1, padding: '9px 0', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontFamily: fonts.body,
                fontSize: 13, fontWeight: 500, transition: 'all .15s',
                background: mode === m ? colors.surface2 : 'transparent',
                color: mode === m ? colors.text : colors.text3,
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
            required style={fieldStyle}
          />
          <input
            type="password" placeholder="Senha"
            value={password} onChange={e => setPassword(e.target.value)}
            required style={fieldStyle}
          />

          {error && <ErrorMessage message={error} />}

          <button
            type="submit" disabled={loading}
            style={{
              ...btnPrimary,
              background: loading ? colors.surface2 : colors.primary,
              color: loading ? colors.text3 : '#fff',
              cursor: loading ? 'default' : 'pointer',
              marginTop: 4, transition: 'all .15s', letterSpacing: 0.2,
            }}
          >
            {loading ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
