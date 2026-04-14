const BASE = import.meta.env.VITE_API_URL ?? ''

export async function apiFetch(path: string, init?: RequestInit) {
  const token = sessionStorage.getItem('plutus_token')
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? res.statusText)
  }
  if (res.status === 204 || res.status === 201) return null
  return res.json()
}
