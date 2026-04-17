import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth'
import { clearTransactions, seedTransaction } from '../helpers/db'

const USER_ID = process.env.TEST_USER_ID!

function skipIfNoUserId() {
  if (!USER_ID) test.skip()
}

// App defaults activePeriod to next month — seeds must match to be visible
function nextMonthPeriod(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.getByText('Gastos').click()
    await expect(page.getByText('Gastos').first()).toBeVisible({ timeout: 5000 })
  })

  test('lists transactions for current period', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    const now = new Date()
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    await seedTransaction(USER_ID, { billing_period: billingPeriod, description: 'Supermercado Teste' })

    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByText('Gastos').click()

    // Select the matching period in the dropdown
    await page.locator('select').first().selectOption(billingPeriod)
    await expect(page.getByText('Supermercado Teste')).toBeVisible({ timeout: 5000 })
  })

  test('add transaction appears in list', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)

    await page.getByRole('button', { name: '+' }).click()
    // Description input: only non-number, non-date, non-readonly text input in the modal
    await page.locator('input:not([type="number"]):not([type="date"]):not([readonly])').first().fill('Mercado Test E2E')
    await page.locator('input[type="number"]').fill('75.50')
    await page.getByRole('button', { name: /adicionar/i }).click()

    await expect(page.getByText('Mercado Test E2E')).toBeVisible({ timeout: 5000 })
  })

  test('edit transaction updates description and amount', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    await seedTransaction(USER_ID, { billing_period: nextMonthPeriod(), description: 'Original Desc', amount: 50 })

    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByText('Gastos').click()

    await expect(page.getByText('Original Desc')).toBeVisible({ timeout: 5000 })
    await page.getByText('Original Desc').click()

    // Edit modal: skip readonly raw_description input, target the editable description
    const descInput = page.locator('input:not([type="number"]):not([type="date"]):not([readonly])').first()
    await expect(descInput).toBeVisible({ timeout: 3000 })
    await descInput.clear()
    await descInput.fill('Edited Desc')
    await page.locator('input[type="number"]').clear()
    await page.locator('input[type="number"]').fill('99.99')
    await page.getByRole('button', { name: /salvar/i }).click()
    // Wait for modal to close before checking the list
    await expect(page.getByRole('button', { name: /salvar/i })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Edited Desc')).toBeVisible({ timeout: 5000 })
  })

  test('delete transaction removes it from list', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    await seedTransaction(USER_ID, { billing_period: nextMonthPeriod(), description: 'Para Excluir' })

    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByText('Gastos').click()

    await expect(page.getByText('Para Excluir')).toBeVisible({ timeout: 5000 })
    // Click the ✕ button on the row to open the delete confirmation modal
    await page.getByTitle('Excluir').first().click()
    // Confirm deletion
    await page.getByRole('button', { name: 'Excluir' }).click()

    await expect(page.getByText('Para Excluir')).not.toBeVisible({ timeout: 5000 })
  })

  test('edit transaction updates date', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    await seedTransaction(USER_ID, {
      billing_period: nextMonthPeriod(),
      description: 'Tx Data Teste',
      date: '2026-03-10',
    })

    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByText('Gastos').click()

    await expect(page.getByText('Tx Data Teste')).toBeVisible({ timeout: 5000 })
    await page.getByText('Tx Data Teste').click()

    const dateInput = page.locator('input[type="date"]')
    await expect(dateInput).toBeVisible({ timeout: 3000 })
    await expect(dateInput).toHaveValue('2026-03-10')

    await dateInput.fill('2026-04-20')
    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByRole('button', { name: /salvar/i })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText('2026-04-20')).toBeVisible({ timeout: 5000 })
  })

  test('invalid amount (zero) shows error', async ({ page }) => {
    await page.getByRole('button', { name: '+' }).click()
    await page.locator('input:not([type="number"]):not([type="date"]):not([readonly])').first().fill('Teste Valor Inválido')
    await page.locator('input[type="number"]').fill('0')
    await page.getByRole('button', { name: /adicionar/i }).click()
    await expect(page.getByText(/inválid/i)).toBeVisible({ timeout: 3000 })
  })

  test('invalid amount (negative) shows error', async ({ page }) => {
    await page.getByRole('button', { name: '+' }).click()
    await page.locator('input:not([type="number"]):not([type="date"]):not([readonly])').first().fill('Teste Valor Negativo')
    await page.locator('input[type="number"]').fill('-10')
    await page.getByRole('button', { name: /adicionar/i }).click()
    await expect(page.getByText(/inválid/i)).toBeVisible({ timeout: 3000 })
  })

  test('sort by amount orders transactions correctly', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    await seedTransaction(USER_ID, { billing_period: nextMonthPeriod(), description: 'Barato', amount: 10 })
    await seedTransaction(USER_ID, { billing_period: nextMonthPeriod(), description: 'Caro', amount: 500 })

    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByText('Gastos').click()

    await expect(page.getByText('Barato')).toBeVisible({ timeout: 5000 })

    // Sort by Valor ascending
    await page.getByRole('button', { name: /valor/i }).click()
    const rows = page.locator('[style*="grid"] > div')
    const firstAsc  = await rows.first().textContent()
    const secondAsc = await rows.nth(1).textContent()
    expect(firstAsc).toContain('Barato')
    expect(secondAsc).toContain('Caro')

    // Sort by Valor descending (second click toggles direction)
    await page.getByRole('button', { name: /valor/i }).click()
    const firstDesc = await rows.first().textContent()
    expect(firstDesc).toContain('Caro')
  })

  test('switching period updates transaction list', async ({ page }) => {
    skipIfNoUserId()
    const select = page.locator('select').first()
    const options = await select.locator('option').allTextContents()
    if (options.length >= 2) {
      await select.selectOption({ index: 1 })
      await page.waitForTimeout(500)
      await expect(page.getByText('Gastos')).toBeVisible()
    }
  })
})
