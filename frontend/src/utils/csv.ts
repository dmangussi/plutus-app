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

// Itaú appends <city>BR to every card transaction (e.g. "MERCHANTUBERABABR").
// Known cities are listed explicitly so we don't accidentally strip merchant-name
// suffixes like "LTDA" that would also match a generic uppercase pattern.
const KNOWN_CITIES =
  'UBERABA|UBERLANDIA|CURITIBA|SAO\\s+PAULO|SÃO\\s+PAULO|BARUERI|OSASCO' +
  '|PINDAMONHANGA|MNASGERAIS|DUQUE\\s+DE\\s+CAXI|BELO\\s+HORIZONTE|RIBEIRAO\\s+PRETO' +
  '|CAMPINAS|BRASILIA|SALVADOR|FORTALEZA|RECIFE|MANAUS|PORTO\\s+ALEGRE'

// Fallback: single run of uppercase letters (no spaces) 3–10 chars — covers unlisted cities
// that appear without spaces (e.g. BARUERIBR). Requires a preceding space so we don't
// strip uppercase merchant suffixes concatenated directly (LTDA, S/A, etc.).
const CITY_SUFFIX_RE = new RegExp(
  `\\s*(?:${KNOWN_CITIES})\\s*BR\\s*$|\\s+[A-Z]{3,10}BR\\s*$`, 'i'
)

const INTERMEDIARY_PREFIXES: [RegExp, string][] = [
  [/^EBN\s*\*\s*/i,           ''],
  [/^MP\s*\*\s*/i,            ''],
  [/^AMAZONMKTPLC\s*\*\s*/i,  ''],
]

/**
 * Cleans up an Itaú raw transaction description:
 * 1. Strips the trailing <city>BR location code
 * 2. Removes payment-intermediary prefixes (EBN*, MP*, AMAZONMKTPLC*)
 * 3. Splits camelCase runs (e.g. "BacioDiLatte" → "Bacio Di Latte")
 * 4. Title-cases the result
 */
export function normalizeDescription(raw: string): string {
  let s = raw.trim()

  s = s.replace(CITY_SUFFIX_RE, '').trim()

  for (const [re, replacement] of INTERMEDIARY_PREFIXES) {
    s = s.replace(re, replacement).trim()
  }

  // Split camelCase: "BacioDiLatte" → "Bacio Di Latte"
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2')

  s = s.replace(/\s+/g, ' ').trim()
  s = s.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  // Keep TLD-like suffixes lowercase (e.g. ".Com" → ".com")
  s = s.replace(/\.\w+/g, m => m.toLowerCase())

  return s || raw
}

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
