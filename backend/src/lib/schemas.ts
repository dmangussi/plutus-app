import { z } from 'zod'

// ── Shared primitives ────────────────────────────────────────────────
const period = z.string().regex(/^\d{4}-\d{2}$/, 'period must be YYYY-MM')
const uuid   = z.string().uuid()

// ── Auth ─────────────────────────────────────────────────────────────
export const SignInSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6),
}).strict()

// ── Transactions ──────────────────────────────────────────────────────
export const TransactionListQuerySchema = z.object({
  period,
  category: z.string().optional(),
  dedup:    z.enum(['true', 'false']).optional(),
})

const TransactionBaseSchema = z.object({
  user_id:            uuid,
  description:        z.string().min(1),
  raw_description:    z.string().nullable().optional(),
  amount:             z.number().positive().max(999999.99),
  date:               z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  billing_period:     period,
  category_id:        uuid.nullable().optional(),
  installments:       z.number().int().min(1).max(360).optional(),
  installment_number: z.number().int().min(1).optional(),
}).refine(
  tx => !tx.installments || !tx.installment_number || tx.installment_number <= tx.installments,
  { message: 'installment_number must be ≤ installments', path: ['installment_number'] }
)

export const TransactionCreateSchema = TransactionBaseSchema
export const TransactionBatchSchema  = z.array(TransactionBaseSchema).min(1)
export const TransactionUpdateSchema = z.object({
  description: z.string().min(1).optional(),
  amount:      z.number().positive().max(999999.99).optional(),
  category_id: uuid.nullable().optional(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
}).strict()

export const IdParamSchema = z.object({ id: uuid })

// ── Dashboard ─────────────────────────────────────────────────────────
export const DashboardQuerySchema = z.object({ period })
