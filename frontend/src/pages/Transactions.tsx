import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../hooks/useAuth'
import { useLoading } from '../hooks/useLoading'
import { PageHeader } from '../components/PageHeader'
import { LoadingPlaceholder } from '../components/LoadingPlaceholder'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { formatCurrency, periodLabel, periodKey } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { inputStyle, btnPrimary, btnGhost, labelStyle } from '../styles/common'
import type { Transaction } from '../types/database'

export default function Transactions({ initialCategoryFilter, initialPeriodFilter, onPeriodChange }: { initialCategoryFilter?: string | null; initialPeriodFilter?: string | null; onPeriodChange?: (p: string) => void }) {
  const { categories, getCategory } = useCategories()
  const { user }       = useAuth()
  const { show, hide } = useLoading()

  const currentPeriod = periodKey(new Date().getFullYear(), new Date().getMonth() + 1)
  const [periodFilter,   setPeriodFilter]   = useState(initialPeriodFilter ?? currentPeriod)
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter ?? 'all')

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [everLoaded, setEverLoaded]     = useState(false)
  const [error,        setError]        = useState('')
  const [deleteId,     setDeleteId]     = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [editTx,       setEditTx]       = useState<Transaction | null>(null)
  const [editDesc,     setEditDesc]     = useState('')
  const [editAmount,   setEditAmount]   = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [saving,       setSaving]       = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const [addOpen,      setAddOpen]      = useState(false)
  const [newDesc,      setNewDesc]      = useState('')
  const [newAmount,    setNewAmount]    = useState('')
  const [newDate,      setNewDate]      = useState(today)
  const [newPeriod,    setNewPeriod]    = useState('')
  const [newCategory,  setNewCategory]  = useState('')
  const [adding,       setAdding]       = useState(false)

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
    let url = `/api/transactions?period=${periodFilter}`
    if (categoryFilter !== 'all') url += `&category=${categoryFilter}`
    apiFetch(url)
      .then((data: Transaction[]) => {
        setTransactions(data ?? [])
        setLoading(false)
        setEverLoaded(true)
      })
      .catch(() => setLoading(false))
  }, [periodFilter, categoryFilter])

  useEffect(() => {
    setLoading(true)
    fetchTransactions()
  }, [fetchTransactions])

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  function openEdit(t: Transaction) {
    setEditTx(t)
    setEditDesc(t.description)
    setEditAmount(String(t.amount))
    setEditCategory(t.category_id ?? '')
  }

  async function handleSave() {
    if (!editTx) return
    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount <= 0 || amount > 999999.99) { setError('Valor inválido.'); return }
    setSaving(true)
    show('Salvando alterações...')
    await apiFetch(`/api/transactions/${editTx.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ description: editDesc, amount, category_id: editCategory || null }),
    })
    hide()
    setSaving(false)
    setEditTx(null)
    fetchTransactions()
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    show('Excluindo transação...')
    await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
    hide()
    setDeleteId(null)
    setDeleting(false)
    fetchTransactions()
  }

  function openAdd() {
    setNewDesc('')
    setNewAmount('')
    setNewDate(today)
    setNewPeriod(periodFilter)
    setNewCategory('')
    setError('')
    setAddOpen(true)
  }

  async function handleAdd() {
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0 || amount > 999999.99) { setError('Valor inválido.'); return }
    setAdding(true)
    show('Salvando transação...')
    await apiFetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        user_id:            user!.id,
        description:        newDesc,
        amount,
        date:               newDate,
        billing_period:     newPeriod,
        category_id:        newCategory || null,
        installments:       1,
        installment_number: 1,
      }),
    })
    hide()
    setAdding(false)
    setAddOpen(false)
    fetchTransactions()
  }

  if (!everLoaded) return <LoadingPlaceholder />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', overflowX: 'hidden', opacity: loading ? 0.4 : 1, transition: 'opacity 0.25s' }}>

      <PageHeader
        title="Gastos"
        subtitle={`${transactions.length} transações · ${formatCurrency(total)}`}
        action={
          <button
            onClick={openAdd}
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

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <select value={periodFilter} onChange={e => { setPeriodFilter(e.target.value); onPeriodChange?.(e.target.value) }} style={inputStyle}>
          {periods.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inputStyle}>
          <option value="all">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>

      {/* ── List ────────────────────────────────────────────────── */}
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
                onEdit={openEdit}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add modal ──────────────────────────────────────────── */}
      {addOpen && (
        <Modal>
          <div style={{ color: colors.text, fontSize: 16, fontWeight: 600, fontFamily: fonts.heading, marginBottom: 20 }}>
            Novo gasto
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Descrição</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Valor</label>
              <input type="number" step="0.01" min="0.01" max="999999.99" value={newAmount} onChange={e => setNewAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Período de fatura</label>
              <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)} style={inputStyle}>
                {periods.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={inputStyle}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            {error && <div style={{ fontSize: 12, color: colors.dangerText }}>{error}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={() => setAddOpen(false)} style={{ ...btnGhost, flex: 1, color: colors.text2 }}>
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || !newDesc.trim() || !newAmount || !newDate}
              style={{ ...btnPrimary, flex: 1, opacity: (!newDesc.trim() || !newAmount || !newDate) ? 0.4 : 1 }}
            >
              {adding ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit modal ─────────────────────────────────────────── */}
      {editTx && (
        <Modal>
          <div style={{ color: colors.text, fontSize: 16, fontWeight: 600, fontFamily: fonts.heading, marginBottom: 20 }}>
            Editar transação
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {editTx.raw_description && (
              <div>
                <label style={labelStyle}>Descrição original</label>
                <input readOnly value={editTx.raw_description} style={{ ...inputStyle, opacity: 0.5, cursor: 'default' }} />
              </div>
            )}
            <div>
              <label style={labelStyle}>Descrição</label>
              <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Valor</label>
              <input type="number" step="0.01" min="0.01" max="999999.99" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={inputStyle}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            {error && <div style={{ fontSize: 12, color: colors.dangerText }}>{error}</div>}
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
