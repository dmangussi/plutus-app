export const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const PERIOD_MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export const periodLabel = (key: string) => {
  if (!key) return ''
  const [year, month] = key.split('-')
  return `${PERIOD_MONTHS[parseInt(month) - 1]} ${year}`
}

export const periodKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`
