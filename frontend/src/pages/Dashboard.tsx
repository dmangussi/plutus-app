import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LoadingPlaceholder } from '../components/LoadingPlaceholder'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency, periodLabel, periodKey } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { sectionHeader } from '../styles/common'

interface SummaryRow {
  category_id:    string | null
  category_name:  string | null
  category_emoji: string | null
  category_color: string | null
  total:          number
  count:          number
}

function lastMonths(n: number): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(periodKey(d.getFullYear(), d.getMonth() + 1))
  }
  return result
}

export default function Dashboard({ onSignOut, onCategoryClick }: { onSignOut: () => void; onCategoryClick: (categoryId: string, period: string) => void }) {
  const { user } = useAuth()

  const periods = lastMonths(3)
  const [activePeriod, setActivePeriod] = useState(periods[0])
  const [summary, setSummary]           = useState<SummaryRow[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    supabase
      .rpc('dashboard_summary' as never, { p_period: activePeriod } as never)
      .abortSignal(controller.signal)
      .then(({ data }: { data: SummaryRow[] | null }) => {
        setSummary(data ?? [])
        setLoading(false)
      })
    return () => controller.abort()
  }, [activePeriod])

  const total      = summary.reduce((sum, r) => sum + Number(r.total), 0)
  const totalCount = summary.reduce((sum, r) => sum + Number(r.count), 0)
  const byCategory = [...summary]
    .sort((a, b) => Number(b.total) - Number(a.total))

  const initials  = (user?.email ?? 'U').slice(0, 1).toUpperCase()
  const firstName = user?.email?.split('@')[0] ?? 'Usuário'

  if (loading && summary.length === 0) return <LoadingPlaceholder />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 24px' }}>

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
            {periodLabel(activePeriod)}
          </p>
          <div style={{
            fontFamily: fonts.heading, fontSize: 36, fontWeight: 600,
            color: colors.text, letterSpacing: -0.5, lineHeight: 1,
          }}>
            {formatCurrency(total)}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: colors.text3, fontFamily: fonts.body }}>
            {totalCount} transações
          </p>
        </div>
      </div>

      {/* ── Period pills ────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 4px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, paddingBottom: 4, width: 'max-content' }}>
          {periods.map(p => {
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
                {periodLabel(p)}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ── By category ─────────────────────────────────────────── */}
        {totalCount === 0 ? (
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
              {byCategory.map(row => {
                const amount = Number(row.total)
                return (
                  <div key={row.category_id ?? 'other'} onClick={() => row.category_id && onCategoryClick(row.category_id, activePeriod)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: colors.surface2, border: `1px solid ${colors.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                        }}>
                          {row.category_emoji ?? '📦'}
                        </div>
                        <span style={{ fontSize: 14, color: colors.text, fontWeight: 500, fontFamily: fonts.body }}>
                          {row.category_name ?? 'Outros'}
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
                        background: row.category_color ?? colors.primary,
                        borderRadius: 1, transition: 'width .3s', opacity: 0.8,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
