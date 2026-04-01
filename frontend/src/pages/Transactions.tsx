import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, periodLabel } from '../utils/format'
import type { Transaction } from '../types/database'

const C = {
  bg:      '#0c0c0c',
  surface: '#141414',
  surface2:'#1e1e1e',
  border:  '#1e1e1e',
  primary: '#c96a3a',
  text:    '#e3e2df',
  text2:   '#a0a0a0',
  text3:   '#5a5a5a',
} as const

const sel: React.CSSProperties = {
  padding: '10px 12px',
  background: '#141414',
  border: '1px solid #1e1e1e',
  color: '#e3e2df',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
}

export default function Transactions({ initialCategoryFilter, initialPeriodFilter }: { initialCategoryFilter?: string | null; initialPeriodFilter?: string | null }) {
  const { transactions, loading } = useTransactions()
  const { categories, getCategory } = useCategories()

  const [periodFilter,   setPeriodFilter]   = useState(initialPeriodFilter ?? 'all')
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter ?? 'all')

  useEffect(() => {
    setCategoryFilter(initialCategoryFilter ?? 'all')
    setPeriodFilter(initialPeriodFilter ?? 'all')
  }, [initialCategoryFilter, initialPeriodFilter])
  const [deleteId,       setDeleteId]       = useState<string | null>(null)
  const [deleting,       setDeleting]       = useState(false)

  const periods = useMemo(() => {
    const set = new Set(transactions.map(t => t.billing_period).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [transactions])

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
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: C.text3, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 24, marginBottom: 12, color: C.primary }}>✳</div>
        Carregando...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', overflowX: 'hidden' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h2 style={{
          margin: '0 0 4px', fontSize: 26, fontWeight: 600,
          color: C.text, fontFamily: 'Lora, Georgia, serif', letterSpacing: -0.3,
        }}>
          Gastos
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text3, fontFamily: 'Inter, sans-serif' }}>
          {filtered.length} transações ·{' '}
          <span style={{ color: C.primary, fontWeight: 500 }}>{formatCurrency(total)}</span>
        </p>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} style={sel}>
          <option value="all">Todos os períodos</option>
          {periods.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={sel}>
          <option value="all">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>

      {/* ── List ────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, textAlign: 'center', padding: '48px 0', color: C.text3, fontSize: 14,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
            Nenhuma transação encontrada.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {filtered.map(t => (
              <TransactionRow
                key={t.id}
                transaction={t}
                getCategory={getCategory}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete modal ────────────────────────────────────────── */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000000cc',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 env(safe-area-inset-bottom, 0px)',
        }}>
          <div style={{
            background: '#141414', border: '1px solid #1e1e1e',
            borderRadius: '20px 20px 0 0', padding: '28px 24px 36px',
            width: '100%', maxWidth: 480, fontFamily: 'Inter, sans-serif', textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: C.surface2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, margin: '0 auto 14px',
            }}>🗑</div>
            <div style={{ color: C.text, fontSize: 16, marginBottom: 6, fontWeight: 600, fontFamily: 'Lora, Georgia, serif' }}>
              Excluir transação?
            </div>
            <div style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>
              Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1, padding: 13, background: 'transparent',
                  border: '1px solid #1e1e1e', color: C.text2,
                  cursor: 'pointer', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 13,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)} disabled={deleting}
                style={{
                  flex: 1, padding: 13, background: '#2a0a0a',
                  border: '1px solid #4a1a1a', color: '#e07a7a',
                  cursor: 'pointer', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                }}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
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
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 12px',
      background: '#141414',
      border: '1px solid #1e1e1e',
      borderRadius: 12,
      width: '100%', minWidth: 0,
    }}>
      {/* Category icon */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: '#1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        {category?.emoji ?? '📦'}
      </div>

      {/* Description + meta */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, color: '#e3e2df', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
          {t.description}
        </div>
        <div style={{ fontSize: 11, color: '#5a5a5a', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
          {t.date}
          {t.billing_period && ` · ${periodLabel(t.billing_period)}`}
          {t.installments > 1 && ` · ${t.installment_number}/${t.installments}x`}
        </div>
      </div>

      {/* Amount + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: '#e3e2df', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
          {formatCurrency(t.amount)}
        </div>
        <button
          onClick={() => onDelete(t.id)}
          style={{
            background: 'transparent', border: '1px solid #1e1e1e',
            color: '#3a3a3a', cursor: 'pointer', fontSize: 10,
            padding: '3px 6px', borderRadius: 6,
            fontFamily: 'Inter, sans-serif', lineHeight: 1,
          }}
          title="Excluir"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
