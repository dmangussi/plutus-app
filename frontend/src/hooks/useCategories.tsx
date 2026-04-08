import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types/database'

let cache: Category[] | null = null

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  const [loading, setLoading]       = useState(cache === null)

  useEffect(() => {
    if (cache !== null) return
    const controller = new AbortController()
    supabase
      .from('categories')
      .select('*')
      .abortSignal(controller.signal)
      .then(({ data }) => {
        cache = data ?? []
        setCategories(cache)
        setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const getCategory = (id: string | null) =>
    categories.find(c => c.id === id) ?? categories.find(c => c.name === 'Outros') ?? null

  return { categories, loading, getCategory }
}
