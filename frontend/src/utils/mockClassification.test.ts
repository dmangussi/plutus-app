import { describe, it, expect } from 'vitest'
import { mockClassify } from './mockClassification'

function classify(description: string) {
  return mockClassify([{ idx: 0, description }])[0]
}

describe('mockClassify — category', () => {
  it('always returns Outros', () => {
    expect(classify('UBER*TRIP SAOPAULO').categoryName).toBe('Outros')
    expect(classify('SPOTIFY').categoryName).toBe('Outros')
    expect(classify('LOJA DESCONHECIDA').categoryName).toBe('Outros')
  })

  it('returns empty array for empty input', () => {
    expect(mockClassify([])).toEqual([])
  })

  it('preserves idx values', () => {
    const results = mockClassify([
      { idx: 0, description: 'UBER' },
      { idx: 1, description: 'NETFLIX' },
    ])
    expect(results[0].idx).toBe(0)
    expect(results[1].idx).toBe(1)
  })
})

describe('mockClassify — cleanDescription (suffix stripping)', () => {
  it('removes city+BR suffix (Uberaba)', () => {
    expect(classify('MORAIS PASTELARIAUBERABABR').description).toBe('Morais Pastelaria')
  })

  it('removes city+BR suffix (Curitiba)', () => {
    expect(classify('POSTO IPIRANGA 12345 CURITIBABR').description).toBe('Posto Ipiranga')
  })

  it('removes BR-only suffix', () => {
    expect(classify('NETFLIXBR').description).toBe('Netflix')
  })

  it('removes state+BR suffix when preceded by digit (MGBR)', () => {
    expect(classify('DROGASIL2913MGBR').description).toBe('Drogasil')
  })

  it('preserves description with no suffix', () => {
    expect(classify('FARMACIA').description).toBe('Farmacia')
  })

  it('returns empty string for all-digit description', () => {
    expect(classify('123456').description).toBe('')
  })

  it('returns empty string for input "BR"', () => {
    expect(classify('BR').description).toBe('')
  })

  it('preserves 2-letter input that is not BR', () => {
    expect(classify('AB').description).toBe('Ab')
  })
})

describe('mockClassify — cleanDescription (prefix and formatting)', () => {
  it('strips payment processor prefix (MERCPAGO *)', () => {
    expect(classify('MERCPAGO *LOJA ABC').description).toBe('Loja Abc')
  })

  it('strips PAGSEGURO * prefix', () => {
    expect(classify('PAGSEGURO *LOJA XYZ').description).toBe('Loja Xyz')
  })

  it('removes long digit sequences', () => {
    expect(classify('DROGASIL 12345').description).toBe('Drogasil')
  })

  it('applies Title Case', () => {
    expect(classify('UBER EATS').description).toBe('Uber Eats')
  })
})
