import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { LoadingPlaceholder } from '../components/LoadingPlaceholder'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency, periodLabel } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { sectionHeader } from '../styles/common'

export default function Dashboard({ onSignOut, onCategoryClick }: { onSignOut: () => void; onCategoryClick: (categoryId: string, period: string | null) => void }) {
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

  if (loading) return <LoadingPlaceholder />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 24px' }}>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: colors.text3, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: fonts.body, fontWeight: 500 }}>
              Olá
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 600, color: colors.text, textTransform: 'capitalize', fontFamily: fonts.body }}>
              {firstName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={onSignOut}
              title="Sair"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: colors.surface, border: `1px solid ${colors.border}`,
                color: colors.text3, cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ↩
            </button>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: colors.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: fonts.body,
            }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Balance card */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 14, padding: 20,
        }}>
          <p style={{ ...sectionHeader, margin: '0 0 6px', letterSpacing: 1.5 }}>
            {activePeriod === 'all' ? 'Total geral' : periodLabel(activePeriod)}
          </p>
          <div style={{
            fontFamily: fonts.heading, fontSize: 36, fontWeight: 600,
            color: colors.text, letterSpacing: -0.5, lineHeight: 1,
          }}>
            {formatCurrency(total)}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: colors.text3, fontFamily: fonts.body }}>
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
                  cursor: 'pointer', fontFamily: fonts.body, whiteSpace: 'nowrap',
                  border: `1px solid ${active ? colors.primary : colors.border}`,
                  background: active ? colors.primary : 'transparent',
                  color: active ? '#fff' : colors.text3,
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
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: 14, padding: '18px 18px 14px', marginBottom: 12,
          }}>
            <p style={{ ...sectionHeader, margin: '0 0 14px', letterSpacing: 1.5 }}>
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
                    <div style={{ fontSize: 7, color: active ? colors.primary : colors.text3, whiteSpace: 'nowrap', fontFamily: fonts.body }}>
                      {formatCurrency(e.amount)}
                    </div>
                    <div style={{
                      width: '100%', height: h,
                      background: active ? colors.primary : colors.surface2,
                      borderRadius: '3px 3px 0 0', transition: 'all .2s',
                    }} />
                    <div style={{ fontSize: 8, color: active ? colors.primary : colors.text3, whiteSpace: 'nowrap', fontFamily: fonts.body }}>
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
          <EmptyState emoji="📊" text="Nenhuma transação neste período." />
        ) : (
          <div style={{
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${colors.border}` }}>
              <p style={{ ...sectionHeader, letterSpacing: 1.5 }}>
                Por categoria
              </p>
            </div>
            <div style={{ padding: '10px 18px 16px', display: 'grid', gap: 16 }}>
              {byCategory.map(({ category, amount }) => (
                <div key={category?.id ?? 'other'} onClick={() => category?.id && onCategoryClick(category.id, activePeriod === 'all' ? null : activePeriod)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: colors.surface2, border: `1px solid ${colors.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                      }}>
                        {category?.emoji ?? '📦'}
                      </div>
                      <span style={{ fontSize: 14, color: colors.text, fontWeight: 500, fontFamily: fonts.body }}>
                        {category?.name ?? 'Outros'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: colors.text, fontWeight: 600, fontFamily: fonts.body }}>
                        {formatCurrency(amount)}
                      </div>
                      {total > 0 && (
                        <div style={{ color: colors.text3, fontSize: 11, fontFamily: fonts.body }}>
                          {((amount / total) * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 2, background: colors.surface2, borderRadius: 1 }}>
                    <div style={{
                      height: '100%',
                      width: `${(amount / total) * 100}%`,
                      background: category?.color ?? colors.primary,
                      borderRadius: 1, transition: 'width .3s', opacity: 0.8,
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
