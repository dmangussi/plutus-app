import type { AIResult } from './csv'

// Switch to toggle mock vs real API
// Set to false when you have Anthropic credits
export const USE_MOCK_AI = true

// Sample mock results — maps raw description keywords to clean name + category
const MOCK_RULES: { keywords: string[]; description: string; categoryName: string }[] = [
  { keywords: ['drogasil', 'farmacia', 'droga', 'pacheco'],         description: 'Farmácia',          categoryName: 'Saúde' },
  { keywords: ['uber', '99pop', '99 pop'],                           description: 'Uber',              categoryName: 'Transporte' },
  { keywords: ['posto', 'ipiranga', 'shell', 'petrobras'],           description: 'Posto',             categoryName: 'Transporte' },
  { keywords: ['spotify'],                                            description: 'Spotify',           categoryName: 'Assinaturas' },
  { keywords: ['netflix'],                                            description: 'Netflix',           categoryName: 'Assinaturas' },
  { keywords: ['amazon prime', 'prime video'],                       description: 'Amazon Prime',      categoryName: 'Assinaturas' },
  { keywords: ['youtube'],                                            description: 'YouTube Premium',   categoryName: 'Assinaturas' },
  { keywords: ['disney'],                                             description: 'Disney+',           categoryName: 'Assinaturas' },
  { keywords: ['supermercado', 'mercado', 'extra', 'carrefour', 'atacadao', 'guaratu'], description: 'Supermercado', categoryName: 'Mercado' },
  { keywords: ['padaria', 'panificadora', 'bakery'],                 description: 'Padaria',           categoryName: 'Alimentação' },
  { keywords: ['restaurante', 'burger', 'pizza', 'lanchonete', 'mcdonalds', 'subway'], description: 'Restaurante', categoryName: 'Restaurantes' },
  { keywords: ['salao', 'barbearia', 'cabelo', 'beauty'],            description: 'Salão de Beleza',   categoryName: 'Beleza' },
  { keywords: ['cinema', 'ingresso', 'show', 'teatro'],              description: 'Lazer',             categoryName: 'Lazer' },
  { keywords: ['escola', 'faculdade', 'curso', 'cambly'],            description: 'Educação',          categoryName: 'Educação' },
  { keywords: ['aluguel', 'condominio', 'luz', 'energia', 'agua'],   description: 'Moradia',           categoryName: 'Moradia' },
]

function cleanDescription(raw: string): string {
  // Remove trailing BR, state codes, store numbers, extra spaces
  return raw
    .replace(/\d{3,}/g, '')        // remove long number sequences
    .replace(/[A-Z]{2}BR$/i, '')   // remove state+BR suffix
    .replace(/BR$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()) // Title Case
}

export function mockClassify(items: { idx: number; description: string }[]): AIResult[] {
  return items.map(item => {
    const raw = item.description.toLowerCase()
    const rule = MOCK_RULES.find(r => r.keywords.some(k => raw.includes(k)))

    return {
      idx:          item.idx,
      description:  rule?.description ?? cleanDescription(item.description),
      categoryName: rule?.categoryName ?? 'Outros',
    }
  })
}
