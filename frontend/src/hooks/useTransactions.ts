import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types/database'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  const fetch = useCallback(() => {
    supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setTransactions(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { transactions, loading, error, refetch: fetch }
}
