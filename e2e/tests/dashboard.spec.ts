import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth'
import { clearTransactions, seedTransaction } from '../helpers/db'

const USER_ID = process.env.TEST_USER_ID!

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('loads with current period label visible', async ({ page }) => {
    // App defaults activePeriod to next month
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    const monthName = d.toLocaleString('pt-BR', { month: 'long' })
    await expect(page.getByText(new RegExp(monthName, 'i')).first()).toBeVisible({ timeout: 5000 })
  })

  test('switching period pill reloads data without crash', async ({ page }) => {
    // Click the current-month pill (second in the strip — next month is first/active)
    const d = new Date()
    const monthName = d.toLocaleString('pt-BR', { month: 'long' })
    await page.getByRole('button', { name: new RegExp(monthName, 'i') }).first().click()
    await expect(page.getByText('Olá')).toBeVisible({ timeout: 5000 })
  })

  test('shows category breakdown when transactions exist', async ({ page }) => {
    if (!USER_ID) { test.skip(); return }
    await clearTransactions(USER_ID)
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    const billingPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    await seedTransaction(USER_ID, { billing_period: billingPeriod, amount: 99.90 })
    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await expect(page.getByText('Por categoria')).toBeVisible({ timeout: 10000 })
  })

  test('empty state shows when no transactions in period', async ({ page }) => {
    if (!USER_ID) { test.skip(); return }
    await clearTransactions(USER_ID)
    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await expect(page.getByText('Nenhuma transação neste período.')).toBeVisible({ timeout: 10000 })
  })
})
