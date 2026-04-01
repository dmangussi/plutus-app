import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types/database'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .then(({ data }) => {
        setCategories(data ?? [])
        setLoading(false)
      })
  }, [])

  const getCategory = (id: string | null) =>
    categories.find(c => c.id === id) ?? categories.find(c => c.name === 'Outros') ?? null

  return { categories, loading, getCategory }
}
