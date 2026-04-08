import type { AIResult } from './csv'

// Switch to toggle mock vs real API
// Set to false when you have Anthropic credits
export const USE_MOCK_AI = true


// Brazilian cities Itaú appends to merchant names (longest first to avoid partial matches)
const CITY_SUFFIXES = [
  'GOVERNADOR VALADARES', 'APARECIDA DE GOIANIA', 'FOZ DO IGUACU',
  'RIBEIRAO PRETO', 'BELO HORIZONTE', 'PORTO ALEGRE', 'RIO DE JANEIRO',
  'CAMPO GRANDE', 'JUIZ DE FORA', 'MONTES CLAROS', 'JOAO PESSOA',
  'SAO PAULO', 'SAO LUIS', 'SAO JOSE', 'BOA VISTA', 'PORTO VELHO',
  'UBERLANDIA', 'FLORIANOPOLIS', 'PIRACICABA', 'GUARULHOS', 'SOROCABA',
  'CONTAGEM', 'CAMPINAS', 'LONDRINA', 'JOINVILLE', 'BLUMENAU', 'MARINGA',
  'FORTALEZA', 'SALVADOR', 'CURITIBA', 'BRASILIA', 'GOIANIA', 'UBERABA',
  'MANAUS', 'RECIFE', 'TERESINA', 'MACEIO', 'ARACAJU', 'NATAL', 'OSASCO',
  'JUNDIAI', 'VITORIA', 'SANTOS', 'PELOTAS', 'CUIABA', 'PALMAS', 'MACAPA',
  'ANAPOLIS', 'TAUBATE', 'BAURU', 'FRANCA', 'LIMEIRA', 'MARILIA',
  'NITEROI', 'CAXIAS', 'BELEM', 'SERRA', 'BETIM',
]

// Strips Itaú suffix: CIDADE+BR, ESTADO(2-letter)+BR, or just BR
// City is tried first (longest match wins). State is only stripped when preceded by a non-letter (e.g. digit).
function stripItauSuffix(s: string): string {
  const upper = s.toUpperCase()

  // 1. Try CITY+BR concatenated (e.g. "PASTELARIAUBERABABR")
  for (const city of CITY_SUFFIXES) {
    const suffix = city + 'BR'
    if (upper.endsWith(suffix)) return s.slice(0, s.length - suffix.length)
  }

  // 2. Try STATE(2-letter)+BR preceded by a non-letter (e.g. "2913MGBR")
  const stateMatch = s.match(/[^A-Za-z][A-Z]{2}BR$/i)
  if (stateMatch) return s.slice(0, s.length - 4) // strip state(2)+BR(2)

  // 3. Try just BR at end (e.g. "NETFLIXBR")
  if (upper.endsWith('BR')) return s.slice(0, s.length - 2)

  return s
}

function cleanDescription(raw: string): string {
  let s = raw.trim()

  // Strip payment processor prefixes (e.g. "MERCPAGO *", "PG *NOME")
  s = s.replace(/^(MERCPAGO|PAGSEGURO|PAGSTAR|PICPAY|PG)\s*\*\s*/i, '')

  // Strip Itaú city/state/BR suffix
  s = stripItauSuffix(s)

  // Remove leftover long digit sequences and trailing symbols
  s = s.replace(/\d{3,}/g, '').replace(/[*_\-]+$/, '').replace(/\s{2,}/g, ' ').trim()

  // Title Case
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Cleans raw Itaú descriptions and returns them as AIResult[].
 * All items are classified as `categoryName: 'Outros'` — no keyword matching.
 * The user reviews and assigns categories manually in the import review screen.
 */
export function mockClassify(items: { idx: number; description: string }[]): AIResult[] {
  return items.map(item => ({
    idx:          item.idx,
    description:  cleanDescription(item.description),
    categoryName: 'Outros',
  }))
}
