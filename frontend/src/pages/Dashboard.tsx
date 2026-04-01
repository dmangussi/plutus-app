import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, periodLabel } from '../utils/format'

const C = {
  bg:       '#0c0c0c',
  surface:  '#141414',
  surface2: '#1e1e1e',
  border:   '#2a2a2a',
  border2:  '#1e1e1e',
  primary:  '#c96a3a',
  text:     '#e3e2df',
  text2:    '#a0a0a0',
  text3:    '#5a5a5a',
} as const

export default function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const { user }                  = useAuth()
  const { transactions, loading } = useTransactions()
  const { getCategory }           = useCategories()

  const periods = useMemo(() => {
    const set = new Set(transactions.map(t => t.billing_period).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [transactions])

  const [activePeriod, setActivePeriod] = useState<string>('all')

  const filtered = useMemo(() =>
    activePeriod === 'all'
      ? transactions
      : transactions.filter(t => t.billing_period === activePeriod),
  [transactions, activePeriod])

  const total = useMemo(() =>
    filtered.reduce((sum, t) => sum + t.amount, 0),
  [filtered])

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach(t => {
      const key = t.category_id ?? 'other'
      map[key] = (map[key] ?? 0) + t.amount
    })
    return Object.entries(map)
      .map(([id, amount]) => ({ category: getCategory(id), amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filtered, getCategory])

  const evolution = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      if (!t.billing_period) return
      map[t.billing_period] = (map[t.billing_period] ?? 0) + t.amount
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, amount]) => ({ period, label: periodLabel(period), amount }))
  }, [transactions])

  const maxEvolution = Math.max(...evolution.map(e => e.amount), 1)

  const initials  = (user?.email ?? 'U').slice(0, 1).toUpperCase()
  const firstName = user?.email?.split('@')[0] ?? 'Usuário'

  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: C.text3, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 24, marginBottom: 12, color: C.primary }}>✳</div>
        Carregando...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 24px' }}>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.text3, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              Olá
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 600, color: C.text, textTransform: 'capitalize', fontFamily: 'Inter, sans-serif' }}>
              {firstName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={onSignOut}
              title="Sair"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: C.surface, border: `1px solid ${C.border2}`,
                color: C.text3, cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ↩
            </button>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              fontFamily: 'Inter, sans-serif',
            }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Balance card */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border2}`,
          borderRadius: 14,
          padding: '20px',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: C.text3, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            {activePeriod === 'all' ? 'Total geral' : periodLabel(activePeriod)}
          </p>
          <div style={{
            fontFamily: 'Lora, Georgia, serif',
            fontSize: 36, fontWeight: 600,
            color: C.text, letterSpacing: -0.5, lineHeight: 1,
          }}>
            {formatCurrency(total)}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: C.text3, fontFamily: 'Inter, sans-serif' }}>
            {filtered.length} transações
          </p>
        </div>
      </div>

      {/* ── Period pills ────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 4px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, paddingBottom: 4, width: 'max-content' }}>
          {(['all', ...periods] as string[]).map(p => {
            const active = p === activePeriod
            return (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                style={{
                  padding: '6px 14px', fontSize: 12, borderRadius: 20,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                  border: `1px solid ${active ? C.primary : C.border2}`,
                  background: active ? C.primary : 'transparent',
                  color: active ? '#fff' : C.text3,
                  transition: 'all .15s',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {p === 'all' ? 'Todos' : periodLabel(p)}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ── Monthly evolution ───────────────────────────────────── */}
        {evolution.length > 1 && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border2}`,
            borderRadius: 14, padding: '18px 18px 14px', marginBottom: 12,
          }}>
            <p style={{ margin: '0 0 14px', fontSize: 10, letterSpacing: 1.5, color: C.text3, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              Evolução mensal
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72 }}>
              {evolution.map(e => {
                const h      = Math.max(5, (e.amount / maxEvolution) * 60)
                const active = activePeriod === e.period
                return (
                  <div
                    key={e.period}
                    onClick={() => setActivePeriod(activePeriod === e.period ? 'all' : e.period)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 7, color: active ? C.primary : C.text3, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                      {formatCurrency(e.amount)}
                    </div>
                    <div style={{
                      width: '100%', height: h,
                      background: active ? C.primary : C.surface2,
                      borderRadius: '3px 3px 0 0', transition: 'all .2s',
                    }} />
                    <div style={{ fontSize: 8, color: active ? C.primary : C.text3, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                      {e.label.slice(0, 3)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── By category ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border2}`,
            borderRadius: 14, padding: '48px 24px',
            textAlign: 'center', color: C.text3, fontSize: 14,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
            Nenhuma transação neste período.
          </div>
        ) : (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border2}`,
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border2}` }}>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: 1.5, color: C.text3, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Por categoria
              </p>
            </div>
            <div style={{ padding: '10px 18px 16px', display: 'grid', gap: 16 }}>
              {byCategory.map(({ category, amount }) => (
                <div key={category?.id ?? 'other'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: C.surface2,
                        border: `1px solid ${C.border2}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15,
                      }}>
                        {category?.emoji ?? '📦'}
                      </div>
                      <span style={{ fontSize: 14, color: C.text, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                        {category?.name ?? 'Outros'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: C.text, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                        {formatCurrency(amount)}
                      </div>
                      {total > 0 && (
                        <div style={{ color: C.text3, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                          {((amount / total) * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 2, background: C.surface2, borderRadius: 1 }}>
                    <div style={{
                      height: '100%',
                      width: `${(amount / total) * 100}%`,
                      background: category?.color ?? C.primary,
                      borderRadius: 1, transition: 'width .3s',
                      opacity: 0.8,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
