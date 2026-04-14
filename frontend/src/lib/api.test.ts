import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch } from './api'

function mockFetch(status: number, body?: object) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: body !== undefined
      ? vi.fn().mockResolvedValue(body)
      : vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
    statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
  }))
}

const sessionStorageStub: Record<string, string> = {}

beforeEach(() => {
  vi.unstubAllGlobals()
  Object.keys(sessionStorageStub).forEach(k => delete sessionStorageStub[k])
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => sessionStorageStub[k] ?? null,
    setItem: (k: string, v: string) => { sessionStorageStub[k] = v },
    removeItem: (k: string) => { delete sessionStorageStub[k] },
    clear: () => { Object.keys(sessionStorageStub).forEach(k => delete sessionStorageStub[k]) },
  })
})

describe('apiFetch', () => {
  it('returns null for 201 (empty body after insert)', async () => {
    mockFetch(201)
    const result = await apiFetch('/api/transactions/batch', { method: 'POST', body: '[]' })
    expect(result).toBeNull()
  })

  it('returns null for 204 (empty body after delete/patch)', async () => {
    mockFetch(204)
    const result = await apiFetch('/api/transactions/1', { method: 'DELETE' })
    expect(result).toBeNull()
  })

  it('returns parsed JSON for 200', async () => {
    mockFetch(200, [{ id: '1', amount: 50 }])
    const result = await apiFetch('/api/transactions?period=2026-01')
    expect(result).toEqual([{ id: '1', amount: 50 }])
  })

  it('throws with error message from response body on failure', async () => {
    mockFetch(500, { error: 'database error' })
    await expect(apiFetch('/api/transactions')).rejects.toThrow('database error')
  })

  it('throws with statusText when error body has no message', async () => {
    mockFetch(404)
    await expect(apiFetch('/api/transactions/missing')).rejects.toThrow('Not Found')
  })

  it('includes Authorization header when token is in sessionStorage', async () => {
    sessionStorageStub['plutus_token'] = 'test-token-123'
    mockFetch(200, [])
    await apiFetch('/api/transactions?period=2026-01')
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    const headers = fetchCall[1]?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer test-token-123')
  })

  it('omits Authorization header when no token in sessionStorage', async () => {
    mockFetch(200, [])
    await apiFetch('/api/categories')
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    const headers = fetchCall[1]?.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })
})
