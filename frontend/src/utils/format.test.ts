import { describe, it, expect } from 'vitest'
import { formatCurrency, periodLabel, periodKey } from './format'

describe('periodKey', () => {
  it('pads single-digit months', () => {
    expect(periodKey(2025, 1)).toBe('2025-01')
    expect(periodKey(2025, 9)).toBe('2025-09')
  })

  it('does not pad double-digit months', () => {
    expect(periodKey(2025, 10)).toBe('2025-10')
    expect(periodKey(2025, 12)).toBe('2025-12')
  })
})

describe('periodLabel', () => {
  it('returns month name and year', () => {
    expect(periodLabel('2025-01')).toBe('Janeiro 2025')
    expect(periodLabel('2025-12')).toBe('Dezembro 2025')
    expect(periodLabel('2026-02')).toBe('Fevereiro 2026')
  })

  it('returns empty string for empty input', () => {
    expect(periodLabel('')).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formats as BRL', () => {
    expect(formatCurrency(0)).toMatch(/R\$/)
    expect(formatCurrency(1000)).toMatch(/1\.000/)
    expect(formatCurrency(9.99)).toMatch(/9,99/)
  })
})
