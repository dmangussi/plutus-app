import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { createAuthedClient } from '../lib/supabase'
import { validateQuery } from '../middleware/validate'
import { DashboardQuerySchema } from '../lib/schemas'

const router = Router()

router.get('/', requireAuth, validateQuery(DashboardQuerySchema), async (req, res) => {
  const { token } = req as AuthedRequest
  const { period } = req.query as { period: string }
  const { data, error } = await createAuthedClient(token)
    .rpc('dashboard_summary' as never, { p_period: period } as never)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

export default router
