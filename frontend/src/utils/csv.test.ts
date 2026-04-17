import { describe, it, expect } from 'vitest'
import { parseCSV, normalizeDescription } from './csv'

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

describe('normalizeDescription', () => {
  it('strips Uberaba city suffix and title-cases', () => {
    expect(normalizeDescription('BREAD FACTORY LTDAUBERABABR')).toBe('Bread Factory Ltda')
  })

  it('does not strip LTDA when it appears before the city code', () => {
    expect(normalizeDescription('CINEMAIS CINEMAS LTDAUBERABABR')).toBe('Cinemais Cinemas Ltda')
  })

  it('strips city suffix with surrounding spaces', () => {
    expect(normalizeDescription('MOVEIS ARAXA           UBERABA       BR')).toBe('Moveis Araxa')
  })

  it('strips mixed-case city suffix (BacioDiLatteUberabaBR)', () => {
    expect(normalizeDescription('BacioDiLatteUberabaBR')).toBe('Bacio Di Latte')
  })

  it('splits camelCase merchant name after stripping suffix', () => {
    expect(normalizeDescription('BarDaAcademiaUBERABABR')).toBe('Bar Da Academia')
  })

  it('strips Curitiba suffix and removes EBN* prefix', () => {
    expect(normalizeDescription('EBN*SPOTIFYCURITIBABR')).toBe('Spotify')
  })

  it('strips EBN with spaces and asterisk', () => {
    expect(normalizeDescription('EBN         *SPOTIFYCURITIBABR')).toBe('Spotify')
  })

  it('strips MP* prefix', () => {
    expect(normalizeDescription('MP*MELIMAISOSASCOBR')).toBe('Melimais')
  })

  it('strips AMAZONMKTPLC* prefix', () => {
    expect(normalizeDescription('AMAZONMKTPLC*MARCIAMORPINDAMONHANGABR')).toBe('Marciamor')
  })

  it('handles SAO PAULO with space in city name', () => {
    expect(normalizeDescription('NETFLIX.COMSAO PAULOBR')).toBe('Netflix.com')
  })

  it('strips Google YouTube São Paulo suffix', () => {
    expect(normalizeDescription('Google YouTubeSAO PAULOBR')).toBe('Google You Tube')
  })

  it('handles uppercase with numbers (DROGASIL2913)', () => {
    expect(normalizeDescription('DROGASIL2913UBERABABR')).toBe('Drogasil2913')
  })

  it('preserves UBERABA in merchant name when city code is appended again', () => {
    expect(normalizeDescription('GELATO BORELLI UBERABAUBERABABR')).toBe('Gelato Borelli Uberaba')
  })

  it('falls back to raw if normalization produces empty string', () => {
    expect(normalizeDescription('')).toBe('')
  })

  it('leaves already-clean description unchanged', () => {
    expect(normalizeDescription('Uber')).toBe('Uber')
  })
})
