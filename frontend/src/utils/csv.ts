// ── Transactions to ignore from CSV ──────────────────────────
const IGNORE_PATTERNS = [
  'payment with balance',
  'payment made',
  'pagamento com saldo',
  'pagamento efetuado',
  'redução mensalidade',
  'mensalidade - plano',
  'estorno',
  'crédito em conta',
]

export interface RawTransaction {
  date:        string
  description: string
  amount:      number
}

/**
 * Parses an Itaú bank CSV export into transactions.
 *
 * Expected format: `date,description,amount` (first row is header and is skipped).
 * Amount is always the last column (descriptions may contain commas).
 * Rows with non-positive or non-numeric amounts are skipped.
 * Rows matching IGNORE_PATTERNS (payments, refunds, credits) are excluded.
 */
export function parseCSV(text: string): RawTransaction[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean).slice(1)
  const results: RawTransaction[] = []

  for (const line of lines) {
    const parts = line.split(',')
    if (parts.length < 3) continue

    const date   = parts[0].trim()
    const amount = parseFloat(parts[parts.length - 1].trim())
    const desc   = parts.slice(1, parts.length - 1).join(',').trim()

    if (isNaN(amount) || amount <= 0) continue
    if (IGNORE_PATTERNS.some(p => desc.toLowerCase().includes(p))) continue

    results.push({ date, description: desc, amount })
  }

  return results
}
