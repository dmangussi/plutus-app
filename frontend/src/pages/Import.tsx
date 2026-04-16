import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useLoading } from '../hooks/useLoading'
import { PageHeader } from '../components/PageHeader'
import { ErrorMessage } from '../components/ErrorMessage'
import { UploadStep } from '../components/UploadStep'
import { CandidateRow } from '../components/CandidateRow'
import { formatCurrency, periodKey } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import { btnPrimary, btnGhost } from '../styles/common'
import type { Candidate } from '../components/UploadStep'

type Step = 'upload' | 'review'

export default function Import({ onDone }: { onDone: () => void }) {
  const { categories }  = useCategories()
  const { user }        = useAuth()
  const { show, hide }  = useLoading()

  const [step,         setStep]         = useState<Step>('upload')
  const [error,        setError]        = useState('')
  const [candidates,   setCandidates]   = useState<Candidate[]>([])
  const [selected,     setSelected]     = useState<Record<string, boolean>>({})
  const [saving,       setSaving]       = useState(false)
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set())

  const today = new Date()
  const [billingPeriod, setBillingPeriod] = useState(
    periodKey(today.getFullYear(), today.getMonth() + 1)
  )

  const periodOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5 + i)
    return periodKey(d.getFullYear(), d.getMonth() + 1)
  })

  function isDuplicate(c: Candidate) {
    return existingKeys.has(`${c.rawDescription}|${c.amount}|${c.date}`)
  }

  function handleReady(items: Candidate[], keys: Set<string>) {
    setExistingKeys(keys)
    setCandidates(items)
    setSelected(Object.fromEntries(items.map(it => [it.tempId, true])))
    setStep('review')
  }

  function toggleAll(value: boolean) {
    const next: Record<string, boolean> = {}
    candidates.forEach(c => { if (!isDuplicate(c)) next[c.tempId] = value })
    setSelected(next)
  }

  async function handleConfirm() {
    setSaving(true)
    show('Salvando transações...')
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
    try {
      await apiFetch('/api/transactions/batch', { method: 'POST', body: JSON.stringify(toInsert) })
      hide()
      setSaving(false)
      onDone()
    } catch (e) {
      hide()
      setError('Erro ao salvar: ' + (e as Error).message)
      setSaving(false)
    }
  }

  const selectedList  = candidates.filter(c => selected[c.tempId])
  const totalSelected = selectedList.reduce((sum, c) => sum + c.amount, 0)
  const dupCount      = candidates.filter(isDuplicate).length

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <PageHeader title="Importar CSV" subtitle="Extrato do Itaú" />

      <div style={{ padding: '0 20px' }}>
        {step === 'upload' && (
          <UploadStep
            billingPeriod={billingPeriod}
            onBillingPeriodChange={setBillingPeriod}
            periodOptions={periodOptions}
            categories={categories}
            onReady={handleReady}
          />
        )}

        {step === 'review' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: colors.text3, fontFamily: fonts.body }}>
                {candidates.length} encontradas · {dupCount} já importadas
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleAll(true)}  style={{ ...btnGhost, padding: '4px 10px', fontSize: 11, borderRadius: 7 }}>Tudo</button>
                <button onClick={() => toggleAll(false)} style={{ ...btnGhost, padding: '4px 10px', fontSize: 11, borderRadius: 7 }}>Nenhum</button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 5, maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden', marginBottom: 14, paddingRight: 18 }}>
              {candidates.map(c => (
                <CandidateRow
                  key={c.tempId}
                  candidate={c}
                  category={categories.find(cat => cat.id === c.categoryId)}
                  categories={categories}
                  selected={!!selected[c.tempId]}
                  duplicate={isDuplicate(c)}
                  onToggle={() => !isDuplicate(c) && setSelected(s => ({ ...s, [c.tempId]: !s[c.tempId] }))}
                  onCategoryChange={catId =>
                    setCandidates(prev => prev.map(it => it.tempId === c.tempId ? { ...it, categoryId: catId } : it))
                  }
                />
              ))}
            </div>

            {error && (
              <div style={{ marginBottom: 10 }}>
                <ErrorMessage message={error} />
              </div>
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
