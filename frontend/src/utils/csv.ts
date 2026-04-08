import { USE_MOCK_AI, mockClassify } from "./mockClassification"
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

// ── AI classification result ──────────────────────────────────
export interface AIResult {
  idx:         number
  description: string   // cleaned name
  categoryName: string  // matches Category.name in DB
}

export async function classifyWithAI(
  items: RawTransaction[],
  categoryNames: string[],
): Promise<AIResult[]> {
  const list = JSON.stringify(
    items.map((r, i) => ({ idx: i, description: r.description, amount: r.amount, date: r.date }))
  )

  const prompt = `You are a financial assistant specialized in Brazilian credit card statements (Itaú bank).

You will receive raw transactions where the merchant name is concatenated with city and "BR" at the end (e.g. "DROGASIL2913UBERABABR").

For each item return:
- idx: same index received
- description: clean, readable merchant name (remove city, state, BR suffix, store numbers, fix capitalization)
- categoryName: one of: ${categoryNames.join(', ')}

Classification rules:
- pharmacy, drugstore, drogaria, farmácia → Health
- supermarket, mercado, supermercado → Groceries
- uber, 99, posto, fuel, pedágio, toll → Transport
- spotify, netflix, youtube, amazon prime, disney, playstation → Subscriptions
- restaurant, burger, churrasco, pizza, lanchonete, bar, gelato → Restaurants
- bakery, padaria, café, coffee → Food
- doctor, clinic, odonto, médico → Health
- salon, hair, barbearia, beauty, salão → Beauty
- clothing, shoes, moda, vestuário → Clothing
- rent, condominium, electricity, water, gas, aluguel → Housing
- cinema, show, club, stadium, lazer → Entertainment
- amazon product, electronics, furniture, mercado livre → Other
- anything else → Other

Respond ONLY with a valid JSON array, no markdown.
Example: [{"idx":0,"description":"Drogasil","categoryName":"Health"}]

${list}`

  const res = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'AI API error')

  const text = data.content.map((b: { text?: string }) => b.text ?? '').join('').trim()
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

/**
 * Routes to mock or real AI classification based on the `USE_MOCK_AI` flag.
 * When `USE_MOCK_AI = true`: returns cleaned descriptions with `categoryName: 'Outros'`.
 * When `USE_MOCK_AI = false`: calls Anthropic API via the Vite proxy.
 */
export async function classify(
  items: RawTransaction[],
  categoryNames: string[],
): Promise<AIResult[]> {
  const indexed = items.map((r, i) => ({ idx: i, description: r.description }))

  if (USE_MOCK_AI) return mockClassify(indexed)
  return classifyWithAI(items, categoryNames)
}
