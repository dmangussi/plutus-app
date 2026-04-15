import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import type { Category } from '../types/database'

let cache: Category[] | null = null

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  const [loading, setLoading]       = useState(cache === null)

  useEffect(() => {
    if (cache !== null) return
    apiFetch('/api/categories')
      .then((data: Category[]) => {
        cache = data ?? []
        setCategories(cache)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getCategory = (id: string | null) =>
    categories.find(c => c.id === id) ?? categories.find(c => c.name === 'Outros') ?? null

  return { categories, loading, getCategory }
}
