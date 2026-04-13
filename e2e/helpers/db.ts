import { createClient } from '@supabase/supabase-js'

// Uses service role key to bypass RLS for seed/teardown
const db = createClient(
  process.env.SUPABASE_URL_TEST!,
  process.env.SUPABASE_SERVICE_KEY_TEST!,
)

export async function clearTransactions(userId: string) {
  await db.from('transactions').delete().eq('user_id', userId)
}

export async function seedTransaction(userId: string, overrides: Record<string, unknown> = {}) {
  const tx = {
    user_id:            userId,
    description:        'Supermercado Teste',
    raw_description:    'SUPERMERCADO TESTE BR',
    amount:             150.00,
    date:               '2026-04-01',
    billing_period:     '2026-05',
    category_id:        null,
    installments:       1,
    installment_number: 1,
    ...overrides,
  }
  const { data, error } = await db.from('transactions').insert(tx).select().single()
  if (error) throw error
  return data
}
