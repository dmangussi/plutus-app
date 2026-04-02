import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useLoading } from '../hooks/useLoading'
import { PageHeader } from '../components/PageHeader'
import { LoadingPlaceholder } from '../components/LoadingPlaceholder'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { formatCurrency, periodLabel } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { inputStyle, btnPrimary, btnGhost, labelStyle } from '../styles/common'
import type { Transaction } from '../types/database'

export default function Transactions({ initialCategoryFilter, initialPeriodFilter }: { initialCategoryFilter?: string | null; initialPeriodFilter?: string | null }) {
  const { transactions, loading, refetch } = useTransactions()
  const { categories, getCategory } = useCategories()
  const { show, hide } = useLoading()

  const [periodFilter,   setPeriodFilter]   = useState(initialPeriodFilter ?? 'all')
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter ?? 'all')

  useEffect(() => {
    setCategoryFilter(initialCategoryFilter ?? 'all')
    setPeriodFilter(initialPeriodFilter ?? 'all')
  }, [initialCategoryFilter, initialPeriodFilter])

  const [deleteId,       setDeleteId]       = useState<string | null>(null)
  const [deleting,       setDeleting]       = useState(false)
  const [editTx,         setEditTx]         = useState<Transaction | null>(null)
  const [editDesc,       setEditDesc]       = useState('')
  const [editAmount,     setEditAmount]     = useState('')
  const [editCategory,   setEditCategory]   = useState('')
  const [saving,         setSaving]         = useState(false)

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

  function openEdit(t: Transaction) {
    setEditTx(t)
    setEditDesc(t.description)
    setEditAmount(String(t.amount))
    setEditCategory(t.category_id ?? '')
  }

  async function handleSave() {
    if (!editTx) return
    setSaving(true)
    show('Salvando alterações...')
    await supabase.from('transactions').update({
      description: editDesc,
      amount: parseFloat(editAmount),
      category_id: editCategory || null,
    } as never).eq('id', editTx.id)
    hide()
    setSaving(false)
    setEditTx(null)
    refetch()
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    show('Excluindo transação...')
    await supabase.from('transactions').delete().eq('id', id)
    hide()
    setDeleteId(null)
    setDeleting(false)
    refetch()
  }

  if (loading) return <LoadingPlaceholder />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', overflowX: 'hidden' }}>

      <PageHeader
        title="Gastos"
        subtitle={`${filtered.length} transações · ${formatCurrency(total)}`}
      />

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} style={inputStyle}>
          <option value="all">Todos os períodos</option>
          {periods.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inputStyle}>
          <option value="all">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>

      {/* ── List ────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState emoji="📭" text="Nenhuma transação encontrada." />
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {filtered.map(t => (
              <TransactionRow
                key={t.id}
                transaction={t}
                getCategory={getCategory}
                onEdit={openEdit}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit modal ─────────────────────────────────────────── */}
      {editTx && (
        <Modal>
          <div style={{ color: colors.text, fontSize: 16, fontWeight: 600, fontFamily: fonts.heading, marginBottom: 20 }}>
            Editar transação
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Descrição</label>
              <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Valor</label>
              <input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={inputStyle}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={() => setEditTx(null)} style={{ ...btnGhost, flex: 1, color: colors.text2 }}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editDesc.trim() || !editAmount}
              style={{ ...btnPrimary, flex: 1, opacity: (!editDesc.trim() || !editAmount) ? 0.4 : 1 }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete modal ────────────────────────────────────────── */}
      {deleteId && (
        <Modal>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: colors.surface2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, margin: '0 auto 14px',
            }}>🗑</div>
            <div style={{ color: colors.text, fontSize: 16, marginBottom: 6, fontWeight: 600, fontFamily: fonts.heading }}>
              Excluir transação?
            </div>
            <div style={{ fontSize: 13, color: colors.text3, marginBottom: 24 }}>
              Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteId(null)} style={{ ...btnGhost, flex: 1, color: colors.text2 }}>
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)} disabled={deleting}
                style={{
                  flex: 1, padding: 13, background: colors.dangerBg,
                  border: `1px solid ${colors.dangerBorder}`, color: colors.dangerText,
                  cursor: 'pointer', borderRadius: 10, fontFamily: fonts.body, fontWeight: 600, fontSize: 13,
                }}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function TransactionRow({ transaction: t, getCategory, onEdit, onDelete }: {
  transaction: Transaction
  getCategory: (id: string | null) => ReturnType<ReturnType<typeof useCategories>['getCategory']>
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
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
