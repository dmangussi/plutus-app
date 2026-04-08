import type { AIResult } from './csv'

// Switch to toggle mock vs real API
// Set to false when you have Anthropic credits
export const USE_MOCK_AI = true

// Maps raw description keywords to category — description is always derived from the original
const MOCK_RULES: { keywords: string[]; categoryName: string }[] = [
  { keywords: ['drogasil', 'farmacia', 'droga', 'pacheco'],                            categoryName: 'Saúde' },
  { keywords: ['uber', '99pop', '99 pop'],                                              categoryName: 'Transporte' },
  { keywords: ['posto', 'ipiranga', 'shell', 'petrobras'],                              categoryName: 'Transporte' },
  { keywords: ['spotify'],                                                               categoryName: 'Assinaturas' },
  { keywords: ['netflix'],                                                               categoryName: 'Assinaturas' },
  { keywords: ['amazon prime', 'prime video'],                                          categoryName: 'Assinaturas' },
  { keywords: ['youtube'],                                                               categoryName: 'Assinaturas' },
  { keywords: ['disney'],                                                                categoryName: 'Assinaturas' },
  { keywords: ['supermercado', 'mercado', 'extra', 'carrefour', 'atacadao', 'guaratu'], categoryName: 'Mercado' },
  { keywords: ['padaria', 'panificadora', 'bakery', 'pastelaria', 'pastel'],            categoryName: 'Alimentação' },
  { keywords: ['restaurante', 'burger', 'pizza', 'lanchonete', 'mcdonalds', 'subway'], categoryName: 'Restaurantes' },
  { keywords: ['ifood', 'rappi'],                                                        categoryName: 'Restaurantes' },
  { keywords: ['salao', 'barbearia', 'cabelo', 'beauty'],                               categoryName: 'Beleza' },
  { keywords: ['cinema', 'ingresso', 'show', 'teatro'],                                 categoryName: 'Lazer' },
  { keywords: ['escola', 'faculdade', 'curso', 'cambly'],                               categoryName: 'Educação' },
  { keywords: ['aluguel', 'condominio', 'luz', 'energia', 'agua'],                     categoryName: 'Moradia' },
]

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

function stripCitySuffix(raw: string): string {
  const upper = raw.toUpperCase()
  for (const city of CITY_SUFFIXES) {
    if (upper.endsWith(city)) return raw.slice(0, raw.length - city.length)
  }
  return raw
}

function cleanDescription(raw: string): string {
  let s = raw.trim()

  // Strip payment processor prefixes (e.g. "MERCPAGO *", "PG *NOME")
  s = s.replace(/^(MERCPAGO|PAGSEGURO|PAGSTAR|PICPAY|PG)\s*\*\s*/i, '')

  // Strip country code and state code suffix (e.g. "MGBR", "BR")
  s = s.replace(/[A-Z]{2}BR$/i, '').replace(/BR$/i, '').trim()

  // Strip known Brazilian city names appended by Itaú
  s = stripCitySuffix(s.trim())

  // Remove leftover long digit sequences and trailing symbols
  s = s.replace(/\d{3,}/g, '').replace(/[*_\-]+$/, '').replace(/\s{2,}/g, ' ').trim()

  // Title Case
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export function mockClassify(items: { idx: number; description: string }[]): AIResult[] {
  return items.map(item => {
    const raw  = item.description.toLowerCase()
    const rule = MOCK_RULES.find(r => r.keywords.some(k => raw.includes(k)))

    return {
      idx:          item.idx,
      description:  cleanDescription(item.description),
      categoryName: rule?.categoryName ?? 'Outros',
    }
  })
}
