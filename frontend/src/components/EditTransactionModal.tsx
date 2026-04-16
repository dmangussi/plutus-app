import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { useCategories } from '../hooks/useCategories'
import { useLoading } from '../hooks/useLoading'
import { Modal } from './Modal'
import { colors, fonts } from '../styles/theme'
import { inputStyle, btnPrimary, btnGhost, labelStyle } from '../styles/common'
import type { Transaction } from '../types/database'

export function EditTransactionModal({ transaction, onSave, onClose }: {
  transaction: Transaction
  onSave:      () => void
  onClose:     () => void
}) {
  const { categories } = useCategories()
  const { show, hide } = useLoading()

  const [desc,     setDesc]     = useState(transaction.description)
  const [amount,   setAmount]   = useState(String(transaction.amount))
  const [date,     setDate]     = useState(transaction.date)
  const [category, setCategory] = useState(transaction.category_id ?? '')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleSave() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0 || amt > 999999.99) { setError('Valor inválido.'); return }
    setSaving(true)
    show('Salvando alterações...')
    try {
      await apiFetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: desc, amount: amt, date, category_id: category || null }),
      })
      onSave()
      onClose()
    } catch (e) {
      setError((e as Error).message || 'Erro ao salvar.')
    } finally {
      hide()
      setSaving(false)
    }
  }

  return (
    <Modal>
      <div style={{ color: colors.text, fontSize: 16, fontWeight: 600, fontFamily: fonts.heading, marginBottom: 20 }}>
        Editar transação
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {transaction.raw_description && (
          <div>
            <label style={labelStyle}>Descrição original</label>
            <input readOnly value={transaction.raw_description} style={{ ...inputStyle, opacity: 0.5, cursor: 'default' }} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Descrição</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Valor</label>
          <input type="number" step="0.01" min="0.01" max="999999.99" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            <option value="">Sem categoria</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
        {error && <div style={{ fontSize: 12, color: colors.dangerText }}>{error}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1, color: colors.text2 }}>Cancelar</button>
        <button
          onClick={handleSave}
          disabled={saving || !desc.trim() || !amount}
          style={{ ...btnPrimary, flex: 1, opacity: (!desc.trim() || !amount) ? 0.4 : 1 }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}
