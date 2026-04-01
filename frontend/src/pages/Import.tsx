import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'
import { parseCSV, classify } from '../utils/csv'
import { formatCurrency, periodKey } from '../utils/format'
import type { Category } from '../types/database'

interface Candidate {
  tempId:         string
  description:    string
  rawDescription: string
  amount:         number
  date:           string
  categoryId:     string | null
}

type Step = 'upload' | 'processing' | 'review'

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

const inputStyle: React.CSSProperties = {
  padding: '11px 12px',
  background: C.bg,
  border: '1px solid #1e1e1e',
  color: '#e3e2df',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  padding: '13px 0',
  background: '#c96a3a',
  border: 'none',
  color: '#fff', borderRadius: 10, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
}

const btnGhost: React.CSSProperties = {
  padding: '13px 0', background: 'transparent',
  border: '1px solid #1e1e1e', color: '#5a5a5a',
  borderRadius: 10, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', fontSize: 13,
}

export default function Import({ onDone }: { onDone: () => void }) {
  const { categories } = useCategories()
  const { user }       = useAuth()
  const { transactions } = useTransactions()

  const [step,       setStep]       = useState<Step>('upload')
  const [progress,   setProgress]   = useState('')
  const [error,      setError]      = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected,   setSelected]   = useState<Record<string, boolean>>({})
  const [dragging,   setDragging]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const today = new Date()
  const [billingPeriod, setBillingPeriod] = useState(
    periodKey(today.getFullYear(), today.getMonth() + 1)
  )

  const fileRef = useRef<HTMLInputElement>(null)

  const periodOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5 + i)
    return periodKey(d.getFullYear(), d.getMonth() + 1)
  })

  const existingKeys = new Set(
    transactions.map(t => `${t.description}|${t.amount}|${t.date}`)
  )

  function isDuplicate(c: Candidate) {
    return existingKeys.has(`${c.description}|${c.amount}|${c.date}`)
  }

  async function processFile(file: File) {
    setError('')
    setStep('processing')
    setProgress('Lendo arquivo CSV...')
    try {
      const text = await file.text()
      const raw  = parseCSV(text)
      if (!raw.length) throw new Error('Nenhuma transação encontrada no arquivo.')
      setProgress(`${raw.length} transações encontradas. Classificando com IA...`)
      const categoryNames = [...new Set(categories.map(c => c.name))]
      const aiResults     = await classify(raw, categoryNames)
      const items: Candidate[] = raw.map((r, i) => {
        const ai       = aiResults.find(a => a.idx === i)
        const category = categories.find(c => c.name === ai?.categoryName)
          ?? categories.find(c => c.name === 'Outros')
          ?? null
        return {
          tempId:         `${Date.now()}-${i}`,
          description:    ai?.description ?? r.description,
          rawDescription: r.description,
          amount:         r.amount,
          date:           r.date,
          categoryId:     category?.id ?? null,
        }
      })
      setCandidates(items)
      setSelected(Object.fromEntries(items.map(it => [it.tempId, !isDuplicate(it)])))
      setStep('review')
    } catch (e) {
      setError('Erro: ' + (e as Error).message)
      setStep('upload')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function toggleAll(value: boolean) {
    const next: Record<string, boolean> = {}
    candidates.forEach(c => { if (!isDuplicate(c)) next[c.tempId] = value })
    setSelected(next)
  }

  async function handleConfirm() {
    setSaving(true)
    const toInsert = candidates
      .filter(c => selected[c.tempId] && !isDuplicate(c))
      .map(c => ({
        user_id:            user!.id,
        description:        c.description,
        raw_description:    c.rawDescription,
        amount:             c.amount,
        date:               c.date,
        billing_period:     billingPeriod,
        category_id:        c.categoryId,
        installments:       1,
        installment_number: 1,
      }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('transactions').insert(toInsert as any)
    if (error) { setError('Erro ao salvar: ' + error.message); setSaving(false); return }
    setSaving(false)
    onDone()
  }

  const selectedList   = candidates.filter(c => selected[c.tempId])
  const totalSelected  = selectedList.reduce((sum, c) => sum + c.amount, 0)
  const duplicateCount = candidates.filter(isDuplicate).length

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h2 style={{
          margin: '0 0 4px', fontSize: 26, fontWeight: 600,
          color: C.text, fontFamily: 'Lora, Georgia, serif', letterSpacing: -0.3,
        }}>
          Importar CSV
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text3, fontFamily: 'Inter, sans-serif' }}>
          Extrato do Itaú
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── UPLOAD ── */}
        {step === 'upload' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, color: C.text3, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Período de fatura
              </label>
              <select value={billingPeriod} onChange={e => setBillingPeriod(e.target.value)} style={inputStyle}>
                {periodOptions.map(p => {
                  const [year, month] = p.split('-')
                  const label = new Date(parseInt(year), parseInt(month) - 1)
                    .toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
                  return <option key={p} value={p}>{label}</option>
                })}
              </select>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1px dashed ${dragging ? C.primary : '#2a2a2a'}`,
                borderRadius: 14,
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#1a0e08' : C.surface,
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>📂</div>
              <div style={{ color: C.text2, fontSize: 13, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                Solte o arquivo aqui ou toque para selecionar
              </div>
              <div style={{ color: C.text3, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                Formato Itaú: data, descrição, valor
              </div>
            </div>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />

            {error && (
              <p style={{ color: '#e07a5f', fontSize: 13, marginTop: 10, padding: '10px 12px', background: '#1a0e08', border: '1px solid #3a2010', borderRadius: 8, fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 16, color: C.primary }}>✳</div>
            <div style={{ color: C.text2, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>{progress}</div>
          </div>
        )}

        {/* ── REVIEW ── */}
        {step === 'review' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: C.text3, fontFamily: 'Inter, sans-serif' }}>
                {candidates.length} encontradas · {duplicateCount} já importadas
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleAll(true)}  style={{ ...btnGhost, padding: '4px 10px', fontSize: 11, borderRadius: 7 }}>Tudo</button>
                <button onClick={() => toggleAll(false)} style={{ ...btnGhost, padding: '4px 10px', fontSize: 11, borderRadius: 7 }}>Nenhum</button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 5, maxHeight: '50vh', overflowY: 'auto', marginBottom: 14, paddingRight: 2 }}>
              {candidates.map(c => {
                const category = categories.find(cat => cat.id === c.categoryId)
                const dup      = isDuplicate(c)
                const isSel    = !!selected[c.tempId]
                return (
                  <CandidateRow
                    key={c.tempId}
                    candidate={c}
                    category={category}
                    categories={categories}
                    selected={isSel}
                    duplicate={dup}
                    onToggle={() => !dup && setSelected(s => ({ ...s, [c.tempId]: !s[c.tempId] }))}
                    onCategoryChange={catId =>
                      setCandidates(prev => prev.map(it => it.tempId === c.tempId ? { ...it, categoryId: catId } : it))
                    }
                  />
                )
              })}
            </div>

            {error && (
              <p style={{ color: '#e07a5f', fontSize: 13, marginBottom: 10, padding: '10px 12px', background: '#1a0e08', border: '1px solid #3a2010', borderRadius: 8, fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setStep('upload'); setCandidates([]) }} style={{ ...btnGhost, flex: 1 }}>
                ← Voltar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || selectedList.length === 0}
                style={{ ...btnPrimary, flex: 2, opacity: selectedList.length === 0 ? 0.4 : 1 }}
              >
                {saving ? 'Salvando...' : `Confirmar ${selectedList.length} · ${formatCurrency(totalSelected)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CandidateRow({ candidate: c, category, categories, selected, duplicate, onToggle, onCategoryChange }: {
  candidate:        Candidate
  category:         Category | undefined
  categories:       Category[]
  selected:         boolean
  duplicate:        boolean
  onToggle:         () => void
  onCategoryChange: (id: string) => void
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 10px',
        background: duplicate ? '#0e0e0e' : selected ? '#1a1208' : '#141414',
        border: `1px solid ${duplicate ? '#1e1e1e' : selected ? '#3a2a18' : '#1e1e1e'}`,
        borderRadius: 10,
        cursor: duplicate ? 'default' : 'pointer',
        opacity: duplicate ? 0.45 : 1,
        transition: 'all .15s',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: `1.5px solid ${selected ? '#c96a3a' : '#2a2a2a'}`,
        background: selected ? '#c96a3a' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#fff', fontWeight: 700,
      }}>
        {selected ? '✓' : ''}
      </div>

      <span style={{ fontSize: 14, flexShrink: 0 }}>{category?.emoji ?? '📦'}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: selected ? '#e3e2df' : '#5a5a5a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter, sans-serif' }}>
          {c.description}
        </div>
        <div style={{ fontSize: 10, color: '#3a3a3a', marginTop: 1, fontFamily: 'Inter, sans-serif' }}>{c.date}</div>
      </div>

      {duplicate && (
        <span style={{ fontSize: 9, color: '#5a8a5a', background: '#0e1a0e', border: '1px solid #1e3a1e', borderRadius: 4, padding: '2px 6px', flexShrink: 0, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
          já importada
        </span>
      )}

      <select
        value={c.categoryId ?? ''}
        onClick={e => e.stopPropagation()}
        onChange={e => onCategoryChange(e.target.value)}
        style={{
          padding: '3px 5px', background: '#0c0c0c',
          border: '1px solid #1e1e1e', color: '#a0a0a0',
          borderRadius: 5, fontSize: 10, fontFamily: 'Inter, sans-serif', maxWidth: 90,
        }}
      >
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
        ))}
      </select>

      <div style={{ fontSize: 12, color: selected ? '#e3e2df' : '#3a3a3a', flexShrink: 0, minWidth: 60, textAlign: 'right', fontWeight: selected ? 600 : 400, fontFamily: 'Inter, sans-serif' }}>
        {formatCurrency(c.amount)}
      </div>
    </div>
  )
}
