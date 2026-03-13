import { useMemo, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, periodLabel, periodKey } from '../utils/format'

const s: Record<string, React.CSSProperties> = {
  page:       { maxWidth: 920, margin: '0 auto', padding: '28px 24px', fontFamily: 'sans-serif' },
  label:      { fontSize: 10, letterSpacing: 3, color: '#666', textTransform: 'uppercase', marginBottom: 8, display: 'block' },
  card:       { background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '20px 24px', marginBottom: 20 },
  pill:       { padding: '5px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer', fontFamily: 'sans-serif', border: '1px solid #2a2a2a', background: 'transparent', color: '#666' },
  pillActive: { border: '1px solid #c8a86b', background: '#c8a86b22', color: '#c8a86b' },
}

export default function Dashboard() {
  const { transactions, loading } = useTransactions()
  const { getCategory }           = useCategories()

  // All available billing periods from transactions
  const periods = useMemo(() => {
    const set = new Set(transactions.map(t => t.billing_period).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [transactions])

  const [activePeriod, setActivePeriod] = useState<string>('all')

  // Transactions filtered by selected period
  const filtered = useMemo(() =>
    activePeriod === 'all'
      ? transactions
      : transactions.filter(t => t.billing_period === activePeriod),
  [transactions, activePeriod])

  // Total for selected period
  const total = useMemo(() =>
    filtered.reduce((sum, t) => sum + t.amount, 0),
  [filtered])

  // Spending by category
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

  // Monthly evolution for bar chart
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

  if (loading) {
    return (
      <div style={{ ...s.page, color: '#555', textAlign: 'center', paddingTop: 80 }}>
        Loading transactions...
      </div>
    )
  }

  return (
    <div style={s.page}>

      {/* Period selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={s.label as React.CSSProperties}>Period</span>
        <button
          style={{ ...s.pill, ...(activePeriod === 'all' ? s.pillActive : {}) }}
          onClick={() => setActivePeriod('all')}
        >
          All
        </button>
        {periods.map(p => (
          <button
            key={p}
            style={{ ...s.pill, ...(activePeriod === p ? s.pillActive : {}) }}
            onClick={() => setActivePeriod(p)}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>

      {/* Total card */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a1a,#1f1a0f)',
        border: '1px solid #c8a86b33',
        borderRadius: 12,
        padding: '28px 32px',
        marginBottom: 24,
      }}>
        <span style={{ ...s.label, color: '#c8a86b' } as React.CSSProperties}>
          {activePeriod === 'all' ? 'Total' : periodLabel(activePeriod)}
        </span>
        <div style={{ fontSize: 44, fontWeight: 300, color: '#f0ece0', letterSpacing: -2, lineHeight: 1 }}>
          {formatCurrency(total)}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
          {filtered.length} transactions
        </div>
      </div>

      {/* Monthly evolution */}
      {evolution.length > 1 && (
        <div style={{ ...s.card, marginBottom: 24 }}>
          <span style={s.label as React.CSSProperties}>Monthly evolution</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {evolution.map(e => {
              const height = Math.max(6, (e.amount / maxEvolution) * 72)
              const active = activePeriod === e.period
              return (
                <div
                  key={e.period}
                  onClick={() => setActivePeriod(activePeriod === e.period ? 'all' : e.period)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 9, color: active ? '#c8a86b' : '#555', whiteSpace: 'nowrap' }}>
                    {formatCurrency(e.amount)}
                  </div>
                  <div style={{
                    width: '100%', height,
                    background: active ? '#c8a86b' : '#2a2a2a',
                    borderRadius: '3px 3px 0 0',
                    transition: 'all .2s',
                  }} />
                  <div style={{ fontSize: 9, color: active ? '#c8a86b' : '#555', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {e.label.slice(0, 3)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* By category */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
          No transactions for this period.
        </div>
      ) : (
        <div style={s.card}>
          <span style={s.label as React.CSSProperties}>By category</span>
          <div style={{ display: 'grid', gap: 10 }}>
            {byCategory.map(({ category, amount }) => (
              <div key={category?.id ?? 'other'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span style={{ color: '#f0ece0' }}>
                    {category?.emoji ?? '📦'} {category?.name ?? 'Other'}
                  </span>
                  <span style={{ color: '#888' }}>
                    {formatCurrency(amount)}
                    <span style={{ color: '#444', marginLeft: 8, fontSize: 11 }}>
                      {total > 0 ? `${((amount / total) * 100).toFixed(0)}%` : ''}
                    </span>
                  </span>
                </div>
                <div style={{ height: 4, background: '#1e1e1e', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${(amount / total) * 100}%`,
                    background: category?.color ?? '#C0C0C0',
                    borderRadius: 2,
                    transition: 'width .3s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
