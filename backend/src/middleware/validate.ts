import { Request, Response, NextFunction } from 'express'
import { ZodType, ZodError } from 'zod'

function formatError(e: ZodError<unknown>): string {
  return e.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
}

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) { res.status(400).json({ error: formatError(result.error) }); return }
    req.body = result.data
    next()
  }
}

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) { res.status(400).json({ error: formatError(result.error) }); return }
    next()
  }
}

export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) { res.status(400).json({ error: formatError(result.error) }); return }
    next()
  }
}
