import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types/database'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    supabase
      .from('categories')
      .select('*')
      .abortSignal(controller.signal)
      .then(({ data }) => {
        setCategories(data ?? [])
        setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const getCategory = (id: string | null) =>
    categories.find(c => c.id === id) ?? categories.find(c => c.name === 'Outros') ?? null

  return { categories, loading, getCategory }
}
