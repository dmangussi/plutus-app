import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'
import { parseCSV, classifyWithAI } from '../utils/csv'
import { formatCurrency, periodKey } from '../utils/format'
import type { Category } from '../types/database'

// ── Types ─────────────────────────────────────────────────────
interface Candidate {
  tempId:      string
  description: string
  rawDescription: string
  amount:      number
  date:        string
  categoryId:  string | null
}

type Step = 'upload' | 'processing' | 'review'

const s: Record<string, React.CSSProperties> = {
  page:    { maxWidth: 680, margin: '0 auto', padding: '28px 24px', fontFamily: 'sans-serif' },
  label:   { fontSize: 10, letterSpacing: 3, color: '#666', textTransform: 'uppercase', marginBottom: 8, display: 'block' },
  select:  { padding: '9px 12px', background: '#141414', border: '1px solid #2a2a2a', color: '#f0ece0', borderRadius: 6, fontSize: 13, fontFamily: 'sans-serif', outline: 'none', width: '100%' },
  btnPrimary: { padding: '12px 0', background: '#c8a86b', border: 'none', color: '#0d0d0d', borderRadius: 8, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700 },
  btnGhost:   { padding: '12px 0', background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 13 },
}

export default function Import({ onDone }: { onDone: () => void }) {
  const { categories } = useCategories()
  const { transactions } = useTransactions()

  const [step,       setStep]       = useState<Step>('upload')
  const [progress,   setProgress]   = useState('')
  const [error,      setError]      = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected,   setSelected]   = useState<Record<string, boolean>>({})
  const [dragging,   setDragging]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  // Import settings
  const today = new Date()
  const [billingPeriod, setBillingPeriod] = useState(
    periodKey(today.getFullYear(), today.getMonth() + 1)
  )

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Billing period options (past 6 + next 2 months) ──────────
  const periodOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5 + i)
    return periodKey(d.getFullYear(), d.getMonth() + 1)
  })

  // ── Duplicate check: same description + amount + date ────────
  const existingKeys = new Set(
    transactions.map(t => `${t.description}|${t.amount}|${t.date}`)
  )

  function isDuplicate(c: Candidate) {
    return existingKeys.has(`${c.description}|${c.amount}|${c.date}`)
  }

  // ── Process uploaded file ─────────────────────────────────────
  async function processFile(file: File) {
    setError('')
    setStep('processing')
    setProgress('Reading CSV file...')

    try {
      const text = await file.text()
      const raw  = parseCSV(text)

      if (!raw.length) throw new Error('No valid transactions found in this file.')

      setProgress(`${raw.length} transactions found. Classifying with AI...`)

      const categoryNames = [...new Set(categories.map(c => c.name))]
      const aiResults     = await classifyWithAI(raw, categoryNames)

      const items: Candidate[] = raw.map((r, i) => {
        const ai       = aiResults.find(a => a.idx === i)
        const category = categories.find(c => c.name === ai?.categoryName)
          ?? categories.find(c => c.name === 'Other')
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
      setError('Error: ' + (e as Error).message)
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

  // ── Save selected transactions to Supabase ───────────────────
  async function handleConfirm() {
    setSaving(true)
    const toInsert = candidates
      .filter(c => selected[c.tempId] && !isDuplicate(c))
      .map(c => ({
        description:     c.description,
        raw_description: c.rawDescription,
        amount:          c.amount,
        date:            c.date,
        billing_period:  billingPeriod,
        category_id:     c.categoryId,
        installments:    1,
        installment_number: 1,
      }))

    const { error } = await supabase.from('transactions').insert(toInsert)

    if (error) {
      setError('Save error: ' + error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    onDone()
  }

  const selectedList  = candidates.filter(c => selected[c.tempId])
  const totalSelected = selectedList.reduce((sum, c) => sum + c.amount, 0)
  const duplicateCount = candidates.filter(isDuplicate).length

  // ══════════════════════════════════════════════════════════════
  return (
    <div style={s.page}>
      <span style={s.label as React.CSSProperties}>Import CSV</span>

      {/* ── UPLOAD ── */}
      {step === 'upload' && (
        <div>
          {/* Billing period */}
          <div style={{ marginBottom: 20 }}>
            <span style={s.label as React.CSSProperties}>Billing period</span>
            <select value={billingPeriod} onChange={e => setBillingPeriod(e.target.value)} style={s.select}>
              {periodOptions.map(p => {
                const [year, month] = p.split('-')
                const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                return <option key={p} value={p}>{label}</option>
              })}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#c8a86b' : '#2a2a2a'}`,
              borderRadius: 10,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? '#1a1a0f' : '#0f0f0f',
              transition: 'all .2s',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 6 }}>
              Drop your CSV file here or click to browse
            </div>
            <div style={{ color: '#444', fontSize: 12 }}>
              Itaú format: date, description, amount
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>
      )}

      {/* ── PROCESSING ── */}
      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <div style={{ color: '#888', fontSize: 14 }}>{progress}</div>
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && (
        <div>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: '#555' }}>
              {candidates.length} found · {duplicateCount} already imported
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleAll(true)}  style={{ ...s.btnGhost, padding: '5px 12px', fontSize: 11 }}>Select all</button>
              <button onClick={() => toggleAll(false)} style={{ ...s.btnGhost, padding: '5px 12px', fontSize: 11 }}>Deselect all</button>
            </div>
          </div>

          {/* Candidate list */}
          <div style={{ display: 'grid', gap: 5, maxHeight: 420, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
            {candidates.map(c => {
              const category = categories.find(cat => cat.id === c.categoryId)
              const dup      = isDuplicate(c)
              const sel      = !!selected[c.tempId]

              return (
                <CandidateRow
                  key={c.tempId}
                  candidate={c}
                  category={category}
                  categories={categories}
                  selected={sel}
                  duplicate={dup}
                  onToggle={() => !dup && setSelected(s => ({ ...s, [c.tempId]: !s[c.tempId] }))}
                  onCategoryChange={catId =>
                    setCandidates(prev => prev.map(it => it.tempId === c.tempId ? { ...it, categoryId: catId } : it))
                  }
                />
              )
            })}
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('upload'); setCandidates([]) }} style={{ ...s.btnGhost, flex: 1 }}>
              ← Back
            </button>
            <button onClick={handleConfirm} disabled={saving || selectedList.length === 0} style={{ ...s.btnPrimary, flex: 2 }}>
              {saving
                ? 'Saving...'
                : `Confirm ${selectedList.length} transactions · ${formatCurrency(totalSelected)}`
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single candidate row ──────────────────────────────────────
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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: duplicate ? '#0d100d' : selected ? '#131308' : '#0f0f0f',
        border: `1px solid ${duplicate ? '#1a3a1a' : selected ? '#c8a86b44' : '#1a1a1a'}`,
        borderRadius: 7,
        cursor: duplicate ? 'default' : 'pointer',
        opacity: duplicate ? 0.55 : 1,
        transition: 'all .15s',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
        border: `1px solid ${selected ? '#c8a86b' : '#333'}`,
        background: selected ? '#c8a86b' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#0d0d0d',
      }}>
        {selected ? '✓' : ''}
      </div>

      {/* Emoji */}
      <span style={{ fontSize: 15, flexShrink: 0 }}>{category?.emoji ?? '📦'}</span>

      {/* Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: selected ? '#f0ece0' : '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.description}
        </div>
        <div style={{ fontSize: 9, color: '#383838', marginTop: 1 }}>{c.date}</div>
      </div>

      {/* Duplicate badge */}
      {duplicate && (
        <span style={{ fontSize: 9, color: '#4a8a5a', background: '#0d1a0d', border: '1px solid #2a4a2a', borderRadius: 3, padding: '2px 6px', flexShrink: 0 }}>
          already imported
        </span>
      )}

      {/* Category selector */}
      <select
        value={c.categoryId ?? ''}
        onClick={e => e.stopPropagation()}
        onChange={e => onCategoryChange(e.target.value)}
        style={{ padding: '3px 5px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: 4, fontSize: 9, fontFamily: 'sans-serif', maxWidth: 110 }}
      >
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
        ))}
      </select>

      {/* Amount */}
      <div style={{ fontSize: 13, color: selected ? '#f0ece0' : '#444', flexShrink: 0, minWidth: 72, textAlign: 'right' }}>
        {formatCurrency(c.amount)}
      </div>
    </div>
  )
}
