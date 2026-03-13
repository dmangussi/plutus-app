import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, periodLabel } from '../utils/format'
import type { Transaction } from '../types/database'

const s: Record<string, React.CSSProperties> = {
  page:    { maxWidth: 920, margin: '0 auto', padding: '28px 24px', fontFamily: 'sans-serif' },
  label:   { fontSize: 10, letterSpacing: 3, color: '#666', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  select:  { padding: '8px 12px', background: '#141414', border: '1px solid #2a2a2a', color: '#f0ece0', borderRadius: 6, fontSize: 13, fontFamily: 'sans-serif', outline: 'none' },
  pill:    { padding: '5px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer', fontFamily: 'sans-serif', border: '1px solid #2a2a2a', background: 'transparent', color: '#666' },
  pillActive: { border: '1px solid #c8a86b', background: '#c8a86b22', color: '#c8a86b' },
}

export default function Transactions() {
  const { transactions, loading } = useTransactions()
  const { categories, getCategory } = useCategories()

  const [periodFilter,   setPeriodFilter]   = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleteId,       setDeleteId]       = useState<string | null>(null)
  const [deleting,       setDeleting]       = useState(false)

  // Available periods from transactions
  const periods = useMemo(() => {
    const set = new Set(transactions.map(t => t.billing_period).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [transactions])

  // Filtered list
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (periodFilter   !== 'all' && t.billing_period !== periodFilter)   return false
      if (categoryFilter !== 'all' && t.category_id    !== categoryFilter) return false
      return true
    })
  }, [transactions, periodFilter, categoryFilter])

  const total = useMemo(() => filtered.reduce((sum, t) => sum + t.amount, 0), [filtered])

  async function handleDelete(id: string) {
    setDeleting(true)
    await supabase.from('transactions').delete().eq('id', id)
    setDeleteId(null)
    setDeleting(false)
    window.location.reload()
  }

  if (loading) {
    return <div style={{ ...s.page, color: '#555', paddingTop: 80, textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={s.page}>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <span style={s.label as React.CSSProperties}>Period</span>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} style={s.select}>
            <option value="all">All periods</option>
            {periods.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
          </select>
        </div>
        <div>
          <span style={s.label as React.CSSProperties}>Category</span>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={s.select}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: '#555' }}>{filtered.length} transactions</span>
        <span style={{ fontSize: 16, color: '#f0ece0' }}>{formatCurrency(total)}</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#444' }}>
          No transactions found.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {filtered.map(t => <TransactionRow key={t.id} transaction={t} getCategory={getCategory} onDelete={setDeleteId} />)}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#141414', border: '1px solid #3a2020', borderRadius: 12, padding: '32px 36px', maxWidth: 360, textAlign: 'center', fontFamily: 'sans-serif' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🗑</div>
            <div style={{ color: '#f0ece0', marginBottom: 8 }}>Delete this transaction?</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)}
                style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid #2a2a2a', color: '#888', cursor: 'pointer', borderRadius: 6, fontFamily: 'sans-serif' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                style={{ flex: 1, padding: 12, background: '#6b2020', border: 'none', color: '#ffcccc', cursor: 'pointer', borderRadius: 6, fontFamily: 'sans-serif', fontWeight: 700 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Single transaction row ────────────────────────────────────
function TransactionRow({ transaction: t, getCategory, onDelete }: {
  transaction: Transaction
  getCategory: (id: string | null) => ReturnType<ReturnType<typeof useCategories>['getCategory']>
  onDelete: (id: string) => void
}) {
  const category = getCategory(t.category_id)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: '#0f0f0f',
      border: '1px solid #1a1a1a',
      borderRadius: 8,
    }}>
      {/* Category dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: category?.color ?? '#C0C0C0',
      }} />

      {/* Description + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: '#f0ece0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.description}
        </div>
        <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
          {category?.emoji} {category?.name ?? 'Other'}
          {t.billing_period && <span style={{ marginLeft: 8 }}>· {periodLabel(t.billing_period)}</span>}
          {t.installments > 1 && <span style={{ marginLeft: 8 }}>· {t.installment_number}/{t.installments}x</span>}
        </div>
      </div>

      {/* Amount */}
      <div style={{ fontSize: 14, color: '#f0ece0', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
        {formatCurrency(t.amount)}
      </div>

      {/* Date */}
      <div style={{ fontSize: 11, color: '#444', flexShrink: 0, minWidth: 72, textAlign: 'right' }}>
        {t.date}
      </div>

      {/* Delete button */}
      <button onClick={() => onDelete(t.id)}
        style={{ background: 'transparent', border: 'none', color: '#3a2020', cursor: 'pointer', fontSize: 14, padding: '0 4px', flexShrink: 0 }}
        title="Delete"
      >
        ✕
      </button>
    </div>
  )
}
