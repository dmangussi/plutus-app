export interface Category {
  id: string; user_id: string | null; name: string; emoji: string; color: string; is_default: boolean
}

export interface Transaction {
  id: string; user_id: string; description: string; raw_description: string | null
  amount: number; date: string; billing_period: string
  category_id: string | null
  installments: number; installment_number: number; created_at: string
}
