import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLoading } from '../hooks/useLoading'
import { ErrorMessage } from '../components/ErrorMessage'
import { colors, fonts } from '../styles/theme'
import { inputStyle, btnPrimary } from '../styles/common'

type Mode = 'signin' | 'signup'

function PasswordField({ value, onChange, placeholder, show, onToggle }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        style={{ ...inputStyle, background: colors.bg, padding: '13px 42px 13px 14px', fontSize: 14, transition: 'border-color .15s' }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.text3, fontSize: 16, padding: 0, lineHeight: 1,
        }}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  )
}

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const { show, hide } = useLoading()

  const [mode, setMode]                   = useState<Mode>('signin')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirm(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
      if (password !== confirmPassword) { setError('As senhas não coincidem.'); return }
    }

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

  const submitDisabled = loading || !email.trim() || !password.trim() || (mode === 'signup' && !confirmPassword.trim())

  return (
    <div style={{
      minHeight: '100vh', background: colors.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 36, marginBottom: 16, lineHeight: 1 }}>🪙</div>
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
              onClick={() => switchMode(m)}
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

          <PasswordField
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Senha"
            show={showPassword}
            onToggle={() => setShowPassword(v => !v)}
          />

          {mode === 'signup' && (
            <PasswordField
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmar senha"
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
            />
          )}

          {error && <ErrorMessage message={error} />}

          <button
            type="submit" disabled={submitDisabled}
            style={{
              ...btnPrimary,
              background: submitDisabled ? colors.surface2 : colors.primary,
              color: submitDisabled ? colors.text3 : '#141414',
              cursor: submitDisabled ? 'default' : 'pointer',
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
