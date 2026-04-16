import { test, expect } from '@playwright/test'
import * as path from 'path'
import { login } from '../helpers/auth'
import { clearTransactions, seedTransaction } from '../helpers/db'

const USER_ID    = process.env.TEST_USER_ID!
const SAMPLE_CSV = path.join(__dirname, '../fixtures/sample.csv')

function skipIfNoUserId() {
  if (!USER_ID) test.skip()
}

// Import page defaults billing period to current month
function currentMonthPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

test.describe('Import', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.getByText('Importar').click()
    await expect(page.getByText(/importar csv/i)).toBeVisible({ timeout: 5000 })
  })

  test('valid CSV upload proceeds to review step', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_CSV)
    await expect(page.getByText(/SUPERMERCADO TESTE|FARMACIA TESTE|RESTAURANTE TESTE/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('file larger than 5MB shows error', async ({ page }) => {
    await page.evaluate(() => {
      const bytes = new Uint8Array(6 * 1024 * 1024).fill(65)
      const file  = new File([bytes], 'big.csv', { type: 'text/csv' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const dt    = new DataTransfer()
      dt.items.add(file)
      input.files = dt.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await expect(page.getByText(/5MB|grande|tamanho/i)).toBeVisible({ timeout: 5000 })
  })

  test('review step shows all parsed transactions', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_CSV)
    await expect(page.getByText('SUPERMERCADO TESTE BR')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('FARMACIA TESTE BR')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('RESTAURANTE TESTE BR')).toBeVisible({ timeout: 5000 })
  })

  test('already imported transaction in same period is marked as duplicate', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    // Import page defaults to current month — seed a matching transaction in the same period
    await seedTransaction(USER_ID, {
      billing_period:  currentMonthPeriod(),
      raw_description: 'SUPERMERCADO TESTE BR',
      amount:          150.00,
      date:            '2026-04-01',
    })

    await page.locator('input[type="file"]').setInputFiles(SAMPLE_CSV)
    await page.waitForSelector('text=SUPERMERCADO TESTE BR', { timeout: 10000 })

    // Badge on the duplicate row
    await expect(page.getByText('já importada', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('same transaction in different period is NOT marked as duplicate', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)
    // Seed under a past period — import page checks against current month, so no duplicate
    await seedTransaction(USER_ID, {
      billing_period:  '2025-01',
      raw_description: 'SUPERMERCADO TESTE BR',
      amount:          150.00,
      date:            '2026-04-01',
    })

    await page.locator('input[type="file"]').setInputFiles(SAMPLE_CSV)
    await page.waitForSelector('text=SUPERMERCADO TESTE BR', { timeout: 10000 })

    await expect(page.getByText('já importada', { exact: true })).not.toBeVisible({ timeout: 3000 })
  })

  test('confirm selection imports transactions', async ({ page }) => {
    skipIfNoUserId()
    await clearTransactions(USER_ID)

    await page.locator('input[type="file"]').setInputFiles(SAMPLE_CSV)
    await page.waitForSelector('text=SUPERMERCADO TESTE BR', { timeout: 10000 })

    // Button text is dynamic: "Confirmar N · R$ X"
    await page.getByRole('button', { name: /confirmar/i }).click()

    // Import calls onDone() which navigates back to dashboard
    await expect(page.getByText('Olá')).toBeVisible({ timeout: 10000 })
  })
})
