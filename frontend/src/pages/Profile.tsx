import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { ErrorMessage } from '../components/ErrorMessage'
import { passwordChangeError } from '../utils/password'
import { colors, fonts } from '../styles/theme'
import { inputStyle, labelStyle, btnPrimary, btnGhost } from '../styles/common'

export default function Profile({ onBack, onSignOut }: {
  onBack:    () => void
  onSignOut: () => void
}) {
  const { user } = useAuth()

  const [currentPassword,  setCurrentPassword]  = useState('')
  const [newPassword,      setNewPassword]      = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [showCurrent,      setShowCurrent]      = useState(false)
  const [showNew,          setShowNew]          = useState(false)
  const [showConfirm,      setShowConfirm]      = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [success,          setSuccess]          = useState(false)
  const [error,            setError]            = useState('')

  const validationError = passwordChangeError(currentPassword, newPassword, confirmPassword)
  const mismatch        = confirmPassword.length > 0 && newPassword !== confirmPassword
  const canSubmit       = validationError === null

  async function handleChangePassword(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <PageHeader
        title="Perfil"
        action={
          <button
            onClick={onBack}
            style={{
              background: 'transparent', border: 'none',
              color: colors.text3, cursor: 'pointer', fontSize: 20,
              display: 'flex', alignItems: 'center', padding: 4,
            }}
          >←</button>
        }
      />

      <div style={{ padding: '0 20px' }}>
        {/* Email display */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 0 20px',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 24,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#141414', fontFamily: fonts.body, flexShrink: 0,
          }}>
            {(user?.email ?? 'U').slice(0, 1).toUpperCase()}
          </div>
          <span style={{ fontSize: 14, color: colors.text, fontFamily: fonts.body }}>{user?.email}</span>
        </div>

        {/* Change password form */}
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <PasswordField
            label="Senha atual"
            value={currentPassword}
            show={showCurrent}
            onChange={setCurrentPassword}
            onToggle={() => setShowCurrent(v => !v)}
          />
          <PasswordField
            label="Nova senha"
            value={newPassword}
            show={showNew}
            onChange={setNewPassword}
            onToggle={() => setShowNew(v => !v)}
            hint={newPassword.length > 0 && newPassword.length < 6 ? 'Mínimo 6 caracteres' : undefined}
          />
          <PasswordField
            label="Confirmar nova senha"
            value={confirmPassword}
            show={showConfirm}
            onChange={setConfirmPassword}
            onToggle={() => setShowConfirm(v => !v)}
            hint={mismatch ? 'As senhas não coincidem' : undefined}
          />

          {error   && <ErrorMessage message={error} />}
          {success && <p style={{ margin: 0, fontSize: 13, color: '#4caf50', fontFamily: fonts.body }}>Senha alterada com sucesso.</p>}

          <button type="submit" disabled={!canSubmit || saving} style={{ ...btnPrimary, opacity: (!canSubmit || saving) ? 0.5 : 1 }}>
            {saving ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>

        <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 28, paddingTop: 20 }}>
          <button onClick={onSignOut} style={{ ...btnGhost, width: '100%' }}>
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div>
  )
}

function PasswordField({ label, value, show, onChange, onToggle, hint }: {
  label:     string
  value:     string
  show:      boolean
  onChange:  (v: string) => void
  onToggle:  () => void
  hint?:     string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, paddingRight: 40 }}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, color: colors.text3, padding: 2,
          }}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
      {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#e57373', fontFamily: fonts.body }}>{hint}</p>}
    </div>
  )
}
