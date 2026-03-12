import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Category } from './types/database'

export default function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_default', true)
      .then(({ data, error }) => {
        if (error) { setStatus('error'); return }
        setCategories(data ?? [])
        setStatus('ok')
      })
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 40, background: '#0d0d0d', minHeight: '100vh', color: '#f0ece0' }}>
      <h1 style={{ color: '#c8a86b', marginBottom: 8 }}>⚡ Plutus</h1>

      {status === 'loading' && <p style={{ color: '#888' }}>Connecting to Supabase...</p>}

      {status === 'error' && (
        <p style={{ color: '#f87171' }}>
          ✗ Could not connect to Supabase. Check your .env file.
        </p>
      )}

      {status === 'ok' && (
        <>
          <p style={{ color: '#4ade80', marginBottom: 24 }}>
            ✓ Connected to Supabase — {categories.length} default categories loaded
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <span key={cat.id} style={{
                background: cat.color + '22',
                border: `1px solid ${cat.color}44`,
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 14,
              }}>
                {cat.emoji} {cat.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
