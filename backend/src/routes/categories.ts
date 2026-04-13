import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { createAuthedClient } from '../lib/supabase'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const { token } = req as AuthedRequest
  const { data, error } = await createAuthedClient(token).from('categories').select('*')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

export default router
