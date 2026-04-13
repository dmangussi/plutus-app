import type { Request, Response, NextFunction } from 'express'
import { extractToken } from '../lib/supabase'

export interface AuthedRequest extends Request {
  token: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  (req as AuthedRequest).token = token
  next()
}
