import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { colors, fonts } from '../styles/theme'

interface LoadingCtx {
  loading: boolean
  message: string
  show: (msg?: string) => void
  hide: () => void
}

const Ctx = createContext<LoadingCtx>({ loading: false, message: '', show: () => {}, hide: () => {} })

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const show = useCallback((msg = '') => { setMessage(msg); setLoading(true) }, [])
  const hide = useCallback(() => setLoading(false), [])

  return (
    <Ctx.Provider value={{ loading, message, show, hide }}>
      {children}
      {loading && <LoadingOverlay message={message} />}
    </Ctx.Provider>
  )
}

export const useLoading = () => useContext(Ctx)

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: `3px solid ${colors.border}`,
        borderTopColor: colors.primary,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      {message && (
        <p style={{
          color: colors.text2, fontSize: 14,
          fontFamily: fonts.body,
          margin: 0, textAlign: 'center', padding: '0 32px',
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
