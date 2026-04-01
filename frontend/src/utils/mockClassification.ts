import type { AIResult } from './csv'

// Switch to toggle mock vs real API
// Set to false when you have Anthropic credits
export const USE_MOCK_AI = true

// Sample mock results — maps raw description keywords to clean name + category
const MOCK_RULES: { keywords: string[]; description: string; categoryName: string }[] = [
  { keywords: ['drogasil', 'farmacia', 'droga', 'pacheco'],         description: 'Pharmacy',         categoryName: 'Health' },
  { keywords: ['uber', '99pop', '99 pop'],                           description: 'Uber',              categoryName: 'Transport' },
  { keywords: ['posto', 'ipiranga', 'shell', 'petrobras'],           description: 'Gas Station',       categoryName: 'Transport' },
  { keywords: ['spotify'],                                            description: 'Spotify',           categoryName: 'Subscriptions' },
  { keywords: ['netflix'],                                            description: 'Netflix',           categoryName: 'Subscriptions' },
  { keywords: ['amazon prime', 'prime video'],                       description: 'Amazon Prime',      categoryName: 'Subscriptions' },
  { keywords: ['youtube'],                                            description: 'YouTube Premium',   categoryName: 'Subscriptions' },
  { keywords: ['disney'],                                             description: 'Disney+',           categoryName: 'Subscriptions' },
  { keywords: ['supermercado', 'mercado', 'extra', 'carrefour', 'atacadao', 'guaratu'], description: 'Supermarket', categoryName: 'Groceries' },
  { keywords: ['padaria', 'panificadora', 'bakery'],                 description: 'Bakery',            categoryName: 'Food' },
  { keywords: ['restaurante', 'burger', 'pizza', 'lanchonete', 'mcdonalds', 'subway'], description: 'Restaurant', categoryName: 'Restaurants' },
  { keywords: ['salao', 'barbearia', 'cabelo', 'beauty'],            description: 'Beauty Salon',      categoryName: 'Beauty' },
  { keywords: ['cinema', 'ingresso', 'show', 'teatro'],              description: 'Entertainment',     categoryName: 'Entertainment' },
  { keywords: ['escola', 'faculdade', 'curso', 'cambly'],            description: 'Education',         categoryName: 'Education' },
  { keywords: ['aluguel', 'condominio', 'luz', 'energia', 'agua'],   description: 'Housing',           categoryName: 'Housing' },
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
      categoryName: rule?.categoryName ?? 'Other',
    }
  })
}
