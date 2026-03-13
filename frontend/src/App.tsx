import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { user, loading, signOut } = useAuth()

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
        <button
          onClick={signOut}
          style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #2a2a2a', color: '#555', borderRadius: 6, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 12 }}
        >
          Sign out
        </button>
      </header>

      <Dashboard />

    </div>
  )
}
