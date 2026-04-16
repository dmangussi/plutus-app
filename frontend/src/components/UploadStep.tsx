import { useRef, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useLoading } from '../hooks/useLoading'
import { ErrorMessage } from './ErrorMessage'
import { parseCSV } from '../utils/csv'
import { periodLabel } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { inputStyle, labelStyle } from '../styles/common'
import type { Category } from '../types/database'

export interface Candidate {
  tempId:           string
  description:      string
  rawDescription:   string
  amount:           number
  date:             string
  categoryId:       string | null
  suggestionMatch?: 'exact' | 'prefix'
}

function normalizePrefix(raw: string): string {
  return raw.trim().toUpperCase().split(/\s+/).slice(0, 3).join(' ')
}

export function UploadStep({ billingPeriod, onBillingPeriodChange, periodOptions, categories, onReady }: {
  billingPeriod:         string
  onBillingPeriodChange: (p: string) => void
  periodOptions:         string[]
  categories:            Category[]
  onReady:               (candidates: Candidate[], existingKeys: Set<string>) => void
}) {
  const { show, hide } = useLoading()
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    setError('')
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB.')
      return
    }
    show('Processando CSV...')
    try {
      const [text, dedupData, historyData] = await Promise.all([
        file.text(),
        apiFetch(`/api/transactions?period=${billingPeriod}&dedup=true`) as Promise<{ raw_description: string | null; amount: number; date: string }[]>,
        apiFetch('/api/transactions/history-categories') as Promise<{ raw_description: string; category_id: string }[]>,
      ])

      const existingKeys = new Set(
        dedupData.filter(r => r.raw_description).map(r => `${r.raw_description}|${r.amount}|${r.date}`)
      )

      const exactMap = new Map<string, string>(historyData.map(r => [r.raw_description.toUpperCase(), r.category_id]))
      const prefixMap = new Map<string, string>()
      for (const r of historyData) {
        const prefix = normalizePrefix(r.raw_description)
        if (!prefixMap.has(prefix)) prefixMap.set(prefix, r.category_id)
      }

      const raw = parseCSV(text)
      if (!raw.length) throw new Error('Nenhuma transação encontrada no arquivo.')

      const othersId = categories.find(c => c.name === 'Outros')?.id ?? null
      const candidates: Candidate[] = raw.map(r => {
        const key     = r.description.toUpperCase()
        const prefix  = normalizePrefix(r.description)
        const exactId = exactMap.get(key)
        const prefId  = prefixMap.get(prefix)
        return {
          tempId:          crypto.randomUUID(),
          description:     r.description,
          rawDescription:  r.description,
          amount:          r.amount,
          date:            r.date,
          categoryId:      exactId ?? prefId ?? othersId,
          suggestionMatch: exactId ? 'exact' : prefId ? 'prefix' : undefined,
        }
      })

      hide()
      onReady(candidates, existingKeys)
    } catch (e) {
      hide()
      setError('Erro: ' + (e as Error).message)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ ...labelStyle, letterSpacing: 1.5, marginBottom: 8 }}>
          Período de fatura
        </label>
        <select value={billingPeriod} onChange={e => onBillingPeriodChange(e.target.value)} style={inputStyle}>
          {periodOptions.map(p => (
            <option key={p} value={p}>{periodLabel(p)}</option>
          ))}
        </select>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? colors.primary : colors.border2}`,
          borderRadius: 14, padding: '48px 24px', textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#1a0e08' : colors.surface,
          transition: 'all .2s',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 12 }}>📂</div>
        <div style={{ color: colors.text2, fontSize: 13, marginBottom: 6, fontFamily: fonts.body }}>
          Solte o arquivo aqui ou toque para selecionar
        </div>
        <div style={{ color: colors.text3, fontSize: 12, fontFamily: fonts.body }}>
          Formato Itaú: data, descrição, valor
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
        style={{ display: 'none' }}
      />

      {error && (
        <div style={{ marginTop: 10 }}>
          <ErrorMessage message={error} />
        </div>
      )}
    </div>
  )
}
