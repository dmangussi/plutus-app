import { describe, it, expect } from 'vitest'
import { parseCSV } from './csv'

const header = 'date,description,amount'

describe('parseCSV', () => {
  it('parses valid rows', () => {
    const csv = `${header}\n2026-02-10,UBER,45.90\n2026-02-11,NETFLIX,39.90`
    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2026-02-10', description: 'UBER', amount: 45.90 })
    expect(result[1]).toEqual({ date: '2026-02-11', description: 'NETFLIX', amount: 39.90 })
  })

  it('skips rows with zero or negative amount', () => {
    const csv = `${header}\n2026-02-10,UBER,0\n2026-02-11,UBER,-10`
    expect(parseCSV(csv)).toHaveLength(0)
  })

  it('skips rows with non-numeric amount', () => {
    const csv = `${header}\n2026-02-10,UBER,abc`
    expect(parseCSV(csv)).toHaveLength(0)
  })

  it('handles description with commas (last column is always amount)', () => {
    const csv = `${header}\n2026-02-10,POSTO SHELL,CAMPINAS,45.00`
    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('POSTO SHELL,CAMPINAS')
    expect(result[0].amount).toBe(45.00)
  })

  it('admits rows with empty description (behavior documented)', () => {
    const csv = `${header}\n2026-02-10,,50.00`
    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('')
  })

  it('skips all IGNORE_PATTERNS entries', () => {
    const ignored = [
      'payment with balance',
      'payment made',
      'pagamento com saldo',
      'pagamento efetuado',
      'redução mensalidade',
      'mensalidade - plano',
      'estorno',
      'crédito em conta',
    ]
    for (const pattern of ignored) {
      const csv = `${header}\n2026-02-10,${pattern},100`
      expect(parseCSV(csv), `should ignore: "${pattern}"`).toHaveLength(0)
    }
  })

  it('skips malformed rows', () => {
    const csv = `${header}\nonly-one-column`
    expect(parseCSV(csv)).toHaveLength(0)
  })

  it('returns empty array for header-only input', () => {
    expect(parseCSV(header)).toHaveLength(0)
  })
})
