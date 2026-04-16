import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useCategories } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { LoadingPlaceholder } from '../components/LoadingPlaceholder'
import { EmptyState } from '../components/EmptyState'
import { AddTransactionModal } from '../components/AddTransactionModal'
import { EditTransactionModal } from '../components/EditTransactionModal'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import { formatCurrency, periodLabel, periodKey } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { inputStyle } from '../styles/common'
import type { Transaction } from '../types/database'

export default function Transactions({ initialCategoryFilter, initialPeriodFilter, onPeriodChange }: {
  initialCategoryFilter?: string | null
  initialPeriodFilter?:   string | null
  onPeriodChange?:        (p: string) => void
}) {
  const { categories, getCategory } = useCategories()

  const currentPeriod = periodKey(new Date().getFullYear(), new Date().getMonth() + 1)
  const [periodFilter,   setPeriodFilter]   = useState(initialPeriodFilter ?? currentPeriod)
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter ?? 'all')
  const [transactions,   setTransactions]   = useState<Transaction[]>([])
  const [loading,        setLoading]        = useState(true)
  const [everLoaded,     setEverLoaded]     = useState(false)
  const [deleteId,       setDeleteId]       = useState<string | null>(null)
  const [editTx,         setEditTx]         = useState<Transaction | null>(null)
  const [addOpen,        setAddOpen]        = useState(false)

  const periods = (() => {
    const result: string[] = []
    const now = new Date()
    for (let i = -1; i < 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      result.push(periodKey(d.getFullYear(), d.getMonth() + 1))
    }
    return result
  })()

  const fetchTransactions = useCallback(() => {
    const abort = new AbortController()
    let url = `/api/transactions?period=${periodFilter}`
    if (categoryFilter !== 'all') url += `&category=${categoryFilter}`
    apiFetch(url, { signal: abort.signal })
      .then((data: Transaction[]) => {
        setTransactions(data ?? [])
        setLoading(false)
        setEverLoaded(true)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setLoading(false)
      })
    return abort
  }, [periodFilter, categoryFilter])

  useEffect(() => {
    setLoading(true)
    const abort = fetchTransactions()
    return () => abort.abort()
  }, [fetchTransactions])

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  if (!everLoaded) return <LoadingPlaceholder />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', overflowX: 'hidden', opacity: loading ? 0.4 : 1, transition: 'opacity 0.25s' }}>
      <PageHeader
        title="Gastos"
        subtitle={`${transactions.length} transações · ${formatCurrency(total)}`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            style={{
              marginTop: 6,
              width: 36, height: 36, borderRadius: '50%',
              background: colors.primary, border: 'none',
              color: '#141414', fontSize: 22, lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >+</button>
        }
      />

      <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <select
          value={periodFilter}
          onChange={e => { setPeriodFilter(e.target.value); onPeriodChange?.(e.target.value) }}
          style={inputStyle}
        >
          {periods.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inputStyle}>
          <option value="all">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>

      <div style={{ padding: '4px 16px' }}>
        {transactions.length === 0 ? (
          <EmptyState emoji="📭" text="Nenhuma transação encontrada." />
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {transactions.map(t => (
              <TransactionRow
                key={t.id}
                transaction={t}
                getCategory={getCategory}
                onEdit={setEditTx}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddTransactionModal
          periods={periods}
          defaultPeriod={periodFilter}
          onSave={() => { fetchTransactions() }}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editTx && (
        <EditTransactionModal
          transaction={editTx}
          onSave={() => { fetchTransactions() }}
          onClose={() => setEditTx(null)}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          id={deleteId}
          onDeleted={() => { setDeleteId(null); fetchTransactions() }}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}

function TransactionRow({ transaction: t, getCategory, onEdit, onDelete }: {
  transaction: Transaction
  getCategory: (id: string | null) => ReturnType<ReturnType<typeof useCategories>['getCategory']>
  onEdit:      (t: Transaction) => void
  onDelete:    (id: string) => void
}) {
  const category = getCategory(t.category_id)

  return (
    <div
      onClick={() => onEdit(t)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 12px',
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 12, width: '100%', minWidth: 0, cursor: 'pointer',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: colors.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {category?.emoji ?? '📦'}
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontFamily: fonts.body }}>
          {t.description}
        </div>
        <div style={{ fontSize: 11, color: colors.text3, marginTop: 2, fontFamily: fonts.body }}>
          {t.date}
          {t.billing_period && ` · ${periodLabel(t.billing_period)}`}
          {t.installments > 1 && ` · ${t.installment_number}/${t.installments}x`}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: colors.text, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: fonts.body }}>
          {formatCurrency(t.amount)}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(t.id) }}
          style={{
            background: 'transparent', border: `1px solid ${colors.border}`,
            color: '#3a3a3a', cursor: 'pointer', fontSize: 10,
            padding: '3px 6px', borderRadius: 6, fontFamily: fonts.body, lineHeight: 1,
          }}
          title="Excluir"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
