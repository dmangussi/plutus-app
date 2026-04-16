import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useLoading } from '../hooks/useLoading'
import { Modal } from './Modal'
import { periodLabel } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { inputStyle, btnPrimary, btnGhost, labelStyle } from '../styles/common'

export function AddTransactionModal({ periods, defaultPeriod, onSave, onClose }: {
  periods:       string[]
  defaultPeriod: string
  onSave:        () => void
  onClose:       () => void
}) {
  const { user }       = useAuth()
  const { categories } = useCategories()
  const { show, hide } = useLoading()

  const today = new Date().toISOString().slice(0, 10)
  const [desc,     setDesc]     = useState('')
  const [amount,   setAmount]   = useState('')
  const [date,     setDate]     = useState(today)
  const [period,   setPeriod]   = useState(defaultPeriod)
  const [category, setCategory] = useState('')
  const [adding,   setAdding]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleAdd() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0 || amt > 999999.99) { setError('Valor inválido.'); return }
    setAdding(true)
    show('Salvando transação...')
    try {
      await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          user_id:            user!.id,
          description:        desc,
          amount:             amt,
          date,
          billing_period:     period,
          category_id:        category || null,
          installments:       1,
          installment_number: 1,
        }),
      })
      onSave()
      onClose()
    } catch (e) {
      setError((e as Error).message || 'Erro ao adicionar.')
    } finally {
      hide()
      setAdding(false)
    }
  }

  return (
    <Modal>
      <div style={{ color: colors.text, fontSize: 16, fontWeight: 600, fontFamily: fonts.heading, marginBottom: 20 }}>
        Novo gasto
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <label style={labelStyle}>Período de fatura</label>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle}>
            {periods.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
          </select>
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
          onClick={handleAdd}
          disabled={adding || !desc.trim() || !amount || !date}
          style={{ ...btnPrimary, flex: 1, opacity: (!desc.trim() || !amount || !date) ? 0.4 : 1 }}
        >
          {adding ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>
    </Modal>
  )
}
