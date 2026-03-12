export interface Database {
  public: {
    Tables: {
      family_members:  { Row: FamilyMember;     Insert: Omit<FamilyMember, 'id'|'created_at'>;    Update: Partial<Omit<FamilyMember, 'id'>> }
      cards:           { Row: Card;              Insert: Omit<Card, 'id'|'created_at'>;             Update: Partial<Omit<Card, 'id'>> }
      categories:      { Row: Category;          Insert: Omit<Category, 'id'>;                      Update: Partial<Omit<Category, 'id'>> }
      transactions:    { Row: Transaction;       Insert: Omit<Transaction, 'id'|'created_at'>;      Update: Partial<Omit<Transaction, 'id'>> }
      category_memory: { Row: CategoryMemory;   Insert: Omit<CategoryMemory, 'id'>;                Update: Partial<Omit<CategoryMemory, 'id'>> }
      budgets:         { Row: Budget;            Insert: Omit<Budget, 'id'>;                        Update: Partial<Omit<Budget, 'id'>> }
    }
  }
}

export interface FamilyMember {
  id: string; user_id: string; name: string; emoji: string; created_at: string
}

export interface Card {
  id: string; user_id: string; name: string; bank: string
  credit_limit: number | null; closing_day: number | null; due_day: number | null; created_at: string
}

export interface Category {
  id: string; user_id: string | null; name: string; emoji: string; color: string; is_default: boolean
}

export interface Transaction {
  id: string; user_id: string; description: string; raw_description: string | null
  amount: number; date: string; billing_period: string
  category_id: string | null; member_id: string | null; card_id: string | null
  installments: number; installment_number: number; created_at: string
}

export interface CategoryMemory {
  id: string; user_id: string; raw_description: string; category_id: string | null
}

export interface Budget {
  id: string; user_id: string; category_id: string; billing_period: string; limit_amount: number
}
