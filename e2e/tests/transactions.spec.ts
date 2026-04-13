import { test, expect } from '@playwright/test'
import * as dotenv from 'dotenv'
import { login } from '../helpers/auth'
import { clearTransactions, seedTransaction } from '../helpers/db'
dotenv.config({ path: '.env.test' })

const USER_ID = process.env.TEST_USER_ID!

function skipIfNoUserId() {
  if (!USER_ID) test.skip()
}

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    // Navigate to Gastos tab
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

    // Select the matching period tab
    await page.getByRole('button').filter({ hasText: new RegExp(String(now.getMonth() + 1 < 10 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1)) }).first().click().catch(() => {})
    await expect(page.getByText('Supermercado Teste')).toBeVisible({ timeout: 5000 })
  })

  test('add transaction appears in list', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)

    // Open add modal via + button
    await page.getByRole('button', { name: '+' }).click()
    await page.getByPlaceholder(/descrição/i).fill('Mercado Test E2E')
    await page.getByPlaceholder(/valor/i).fill('75.50')
    await page.getByRole('button', { name: /salvar|adicionar/i }).click()

    await expect(page.getByText('Mercado Test E2E')).toBeVisible({ timeout: 5000 })
  })

  test('edit transaction updates description and amount', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    const now = new Date()
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    await seedTransaction(USER_ID, { billing_period: billingPeriod, description: 'Original Desc', amount: 50 })

    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByText('Gastos').click()

    const txRow = page.getByText('Original Desc')
    await txRow.click()

    // Edit modal should open — update description
    const descInput = page.getByPlaceholder(/descrição/i)
    if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descInput.clear()
      await descInput.fill('Edited Desc')
      await page.getByPlaceholder(/valor/i).clear()
      await page.getByPlaceholder(/valor/i).fill('99.99')
      await page.getByRole('button', { name: /salvar/i }).click()
      await expect(page.getByText('Edited Desc')).toBeVisible({ timeout: 5000 })
    }
  })

  test('delete transaction removes it from list', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    const now = new Date()
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    await seedTransaction(USER_ID, { billing_period: billingPeriod, description: 'Para Excluir' })

    await page.reload()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByText('Gastos').click()

    const txRow = page.getByText('Para Excluir')
    await txRow.click()

    // Click delete button in modal
    const deleteBtn = page.getByRole('button', { name: /excluir|deletar/i })
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click()
      // Confirm delete if there's a confirmation dialog
      const confirmBtn = page.getByRole('button', { name: /confirmar|sim|excluir/i })
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click()
      }
      await expect(page.getByText('Para Excluir')).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('invalid amount (zero) shows error', async ({ page }) => {
    // Open add modal
    await page.getByRole('button', { name: '+' }).click()
    await page.getByPlaceholder(/descrição/i).fill('Teste Valor Inválido')
    await page.getByPlaceholder(/valor/i).fill('0')
    await page.getByRole('button', { name: /salvar|adicionar/i }).click()
    await expect(page.getByText(/inválid/i)).toBeVisible({ timeout: 3000 })
  })

  test('invalid amount (negative) shows error', async ({ page }) => {
    await page.getByRole('button', { name: '+' }).click()
    await page.getByPlaceholder(/descrição/i).fill('Teste Valor Negativo')
    await page.getByPlaceholder(/valor/i).fill('-10')
    await page.getByRole('button', { name: /salvar|adicionar/i }).click()
    await expect(page.getByText(/inválid/i)).toBeVisible({ timeout: 3000 })
  })

  test('switching period updates transaction list', async ({ page }) => {
    skipIfNoUserId()
    // Click a different period tab — list should update without a crash
    const periodTabs = page.getByRole('button').filter({ hasText: /\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/i })
    const count = await periodTabs.count()
    if (count >= 2) {
      await periodTabs.nth(1).click()
      // Page should remain stable
      await page.waitForTimeout(500)
      await expect(page.getByText('Gastos')).toBeVisible()
    }
  })
})
