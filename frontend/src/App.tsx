import { useState } from 'react'
import { periodKey } from './utils/format'
import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Import from './pages/Import'
import { LoadingPlaceholder } from './components/LoadingPlaceholder'
import { colors, fonts } from './styles/theme'

type View = 'dashboard' | 'transactions' | 'import'

const NAV: { view: View; icon: string; label: string }[] = [
  { view: 'dashboard',    icon: '⊞',  label: 'Início' },
  { view: 'transactions', icon: '☰',  label: 'Gastos' },
  { view: 'import',       icon: '↑',  label: 'Importar' },
]

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState(() => {
    const now = new Date()
    return periodKey(now.getFullYear(), now.getMonth() + 2)
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPlaceholder />
      </div>
    )
  }

  if (!user) return <Auth />

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text }}>

      <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        {view === 'dashboard'    && <Dashboard onSignOut={signOut} activePeriod={activePeriod} onPeriodChange={setActivePeriod} onCategoryClick={(categoryId, period) => { setCategoryFilter(categoryId); setActivePeriod(period); setView('transactions') }} />}
        {view === 'transactions' && <Transactions initialCategoryFilter={categoryFilter} initialPeriodFilter={activePeriod} onPeriodChange={setActivePeriod} />}
        {view === 'import'       && <Import onDone={() => setView('dashboard')} />}
      </div>

      {/* ── Bottom navigation ──────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: colors.bg, borderTop: `1px solid ${colors.border}`,
        display: 'flex', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV.map(({ view: v, icon, label }) => {
          const active = v === view
          return (
            <button
              key={v}
              onClick={() => { setCategoryFilter(null); setView(v) }}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 0 8px', fontFamily: fonts.body,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, color: active ? colors.primary : '#3a3a3a' }}>
                {icon}
              </span>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? colors.primary : '#3a3a3a', letterSpacing: 0.3 }}>
                {label}
              </span>
              <div style={{ width: 16, height: 1.5, borderRadius: 1, background: active ? colors.primary : 'transparent', marginTop: 1 }} />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
