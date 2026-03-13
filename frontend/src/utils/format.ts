export const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export const PERIOD_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const periodLabel = (key: string) => {
  if (!key) return ''
  const [year, month] = key.split('-')
  return `${PERIOD_MONTHS[parseInt(month) - 1]} ${year}`
}

export const periodKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`
