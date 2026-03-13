import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'

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

  // Authenticated — app goes here
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', padding: 40, fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#c8a86b' }}>⚡ Plutus</h1>
      <p style={{ color: '#4ade80' }}>✓ Signed in as {user.email}</p>
      <button
        onClick={signOut}
        style={{ marginTop: 16, padding: '8px 16px', background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a', borderRadius: 8, cursor: 'pointer', fontFamily: 'sans-serif' }}
      >
        Sign out
      </button>
    </div>
  )
}
