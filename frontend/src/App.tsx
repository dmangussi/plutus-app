import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'

type View = 'dashboard' | 'transactions'

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [view, setView] = useState<View>('dashboard')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555', fontFamily: 'sans-serif' }}>Loading...</p>
      </div>
    )
  }

  if (!user) return <Auth />

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f0ece0' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e1e1e', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0d0d0d', zIndex: 100 }}>
        <div style={{ fontSize: 18, color: '#c8a86b', fontFamily: 'sans-serif', fontWeight: 700 }}>⚡ Plutus</div>

        <nav style={{ display: 'flex', gap: 4 }}>
          {([
            ['dashboard',    'Dashboard'],
            ['transactions', 'Transactions'],
          ] as [View, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 4,
              fontFamily: 'sans-serif', transition: 'all .2s',
              border:      v === view ? '1px solid #c8a86b' : '1px solid #2a2a2a',
              background:  v === view ? '#c8a86b'           : 'transparent',
              color:       v === view ? '#0d0d0d'           : '#888',
            }}>
              {label}
            </button>
          ))}
        </nav>

        <button onClick={signOut} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #2a2a2a', color: '#555', borderRadius: 6, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 12 }}>
          Sign out
        </button>
      </header>

      {view === 'dashboard'    && <Dashboard />}
      {view === 'transactions' && <Transactions />}

    </div>
  )
}
