/** Formats a number as BRL currency (e.g. 1000 → "R$ 1.000,00"). */
export const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const PERIOD_MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

/** Converts a period key to a human-readable label (e.g. "2025-01" → "Janeiro 2025"). */
export const periodLabel = (key: string) => {
  if (!key) return ''
  const [year, month] = key.split('-')
  return `${PERIOD_MONTHS[parseInt(month) - 1]} ${year}`
}

/** Creates a zero-padded period key from year and month (e.g. 2025, 1 → "2025-01"). */
export const periodKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`
