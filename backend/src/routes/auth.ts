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

  const { data: userData, error: userError } = await createAuthedClient(token).auth.getUser()
  if (userError || !userData.user?.email) { res.status(401).json({ error: 'Invalid token' }); return }

  const { error: signInError } = await createAnonClient().auth.signInWithPassword({
    email:    userData.user.email,
    password: req.body.currentPassword,
  })
  if (signInError) { res.status(401).json({ error: 'Senha atual incorreta' }); return }

  // auth.updateUser() requires a full session — call the REST API directly with the JWT instead
  const updateRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY! },
    body:    JSON.stringify({ password: req.body.newPassword }),
  })
  if (!updateRes.ok) {
    const body = await updateRes.json().catch(() => ({})) as { msg?: string; message?: string }
    res.status(400).json({ error: body.msg ?? body.message ?? 'Erro ao atualizar senha' }); return
  }

  res.json({ ok: true })
})

export default router
