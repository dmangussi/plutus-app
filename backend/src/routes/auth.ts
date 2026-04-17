import { Router } from 'express'
import { createAnonClient, createAuthedClient, extractToken } from '../lib/supabase'
import { validateBody } from '../middleware/validate'
import { SignInSchema, ChangePasswordSchema } from '../lib/schemas'

const router = Router()

router.post('/signin', validateBody(SignInSchema), async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await createAnonClient().auth.signInWithPassword({ email, password })
  if (error) { res.status(401).json({ error: error.message }); return }
  res.json({ access_token: data.session.access_token, user: { id: data.user.id, email: data.user.email } })
})

router.post('/signup', validateBody(SignInSchema), async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await createAnonClient().auth.signUp({ email, password })
  if (error) { res.status(400).json({ error: error.message }); return }
  if (!data.session) { res.json({ message: 'Confirme seu e-mail para continuar.' }); return }
  res.json({ access_token: data.session.access_token, user: { id: data.user!.id, email: data.user!.email } })
})

router.delete('/signout', async (req, res) => {
  const token = extractToken(req.headers.authorization)
  if (token) await createAuthedClient(token).auth.signOut()
  res.status(204).end()
})

router.get('/me', async (req, res) => {
  const token = extractToken(req.headers.authorization)
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return }
  const { data, error } = await createAuthedClient(token).auth.getUser()
  if (error || !data.user) { res.status(401).json({ error: 'Invalid token' }); return }
  res.json({ user: { id: data.user.id, email: data.user.email } })
})

router.post('/change-password', validateBody(ChangePasswordSchema), async (req, res) => {
  const token = extractToken(req.headers.authorization)
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return }

  const authedClient = createAuthedClient(token)
  const { data: userData, error: userError } = await authedClient.auth.getUser()
  if (userError || !userData.user?.email) { res.status(401).json({ error: 'Invalid token' }); return }

  const { error: signInError } = await createAnonClient().auth.signInWithPassword({
    email:    userData.user.email,
    password: req.body.currentPassword,
  })
  if (signInError) { res.status(401).json({ error: 'Senha atual incorreta' }); return }

  const { error: updateError } = await authedClient.auth.updateUser({ password: req.body.newPassword })
  if (updateError) { res.status(400).json({ error: updateError.message }); return }

  res.json({ ok: true })
})

export default router
