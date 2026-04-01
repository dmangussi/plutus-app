import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Import from './pages/Import'

type View = 'dashboard' | 'transactions' | 'import'

const NAV: { view: View; icon: string; label: string }[] = [
  { view: 'dashboard',    icon: '⊞',  label: 'Início' },
  { view: 'transactions', icon: '☰',  label: 'Gastos' },
  { view: 'import',       icon: '↑',  label: 'Importar' },
]

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [view, setView] = useState<View>('dashboard')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0c0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12, color: '#c96a3a' }}>✳</div>
          <p style={{ color: '#5a5a5a', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Auth />

  return (
    <div style={{ minHeight: '100vh', background: '#0c0c0c', color: '#e3e2df' }}>

      <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        {view === 'dashboard'    && <Dashboard onSignOut={signOut} />}
        {view === 'transactions' && <Transactions />}
        {view === 'import'       && <Import onDone={() => setView('dashboard')} />}
      </div>

      {/* ── Bottom navigation ──────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0c0c0c',
        borderTop: '1px solid #1e1e1e',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV.map(({ view: v, icon, label }) => {
          const active = v === view
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 0 8px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, color: active ? '#c96a3a' : '#3a3a3a' }}>
                {icon}
              </span>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#c96a3a' : '#3a3a3a', letterSpacing: 0.3 }}>
                {label}
              </span>
              <div style={{ width: 16, height: 1.5, borderRadius: 1, background: active ? '#c96a3a' : 'transparent', marginTop: 1 }} />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
