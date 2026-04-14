import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { createAuthedClient } from '../lib/supabase'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const { token } = req as AuthedRequest
  const { period, category, dedup } = req.query as Record<string, string>

  const db = createAuthedClient(token)

  if (dedup === 'true') {
    const { data, error } = await db
      .from('transactions')
      .select('raw_description, amount, date')
      .eq('billing_period', period)
    if (error) { res.status(500).json({ error: error.message }); return }
    res.json(data)
    return
  }

  let query = db
    .from('transactions')
    .select('*')
    .eq('billing_period', period)
    .order('date', { ascending: false })

  if (category && category !== 'all') query = query.eq('category_id', category)

  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.post('/', requireAuth, async (req, res) => {
  const { token } = req as AuthedRequest
  const { error } = await createAuthedClient(token).from('transactions').insert(req.body)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).end()
})

router.get('/history-categories', requireAuth, async (req, res) => {
  const { token } = req as AuthedRequest
  const { data, error } = await createAuthedClient(token)
    .from('transactions')
    .select('raw_description, category_id')
    .not('raw_description', 'is', null)
    .not('category_id', 'is', null)
    .order('created_at', { ascending: false })
  if (error) { res.status(500).json({ error: error.message }); return }

  const seen = new Set<string>()
  const unique = (data ?? []).filter(r => {
    if (seen.has(r.raw_description!)) return false
    seen.add(r.raw_description!)
    return true
  })
  res.json(unique)
})

router.post('/batch', requireAuth, async (req, res) => {
  const { token } = req as AuthedRequest
  const { error } = await createAuthedClient(token).from('transactions').insert(req.body)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).end()
})

router.patch('/:id', requireAuth, async (req, res) => {
  const { token } = req as AuthedRequest
  const { error } = await createAuthedClient(token)
    .from('transactions')
    .update(req.body)
    .eq('id', req.params.id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).end()
})

router.delete('/:id', requireAuth, async (req, res) => {
  const { token } = req as AuthedRequest
  const { error } = await createAuthedClient(token)
    .from('transactions')
    .delete()
    .eq('id', req.params.id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).end()
})

export default router
