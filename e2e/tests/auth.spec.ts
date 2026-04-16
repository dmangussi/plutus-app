import { test, expect } from '@playwright/test'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

const EMAIL    = process.env.TEST_USER_EMAIL!
const PASSWORD = process.env.TEST_USER_PASSWORD!

test.describe('Auth', () => {
  test('login with valid credentials navigates to dashboard', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('E-mail').fill(EMAIL)
    await page.getByPlaceholder('Senha').fill(PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Olá')).toBeVisible({ timeout: 10000 })
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('E-mail').fill(EMAIL)
    await page.getByPlaceholder('Senha').fill('wrong-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText(/invalid|inválid/i)).toBeVisible({ timeout: 5000 })
  })

  test('logout redirects to login page', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('E-mail').fill(EMAIL)
    await page.getByPlaceholder('Senha').fill(PASSWORD)
    await page.locator('button[type="submit"]').click()
    await page.waitForSelector('text=Olá', { timeout: 10000 })
    await page.getByTitle('Sair').click()
    await expect(page.getByText('Finanças da família')).toBeVisible({ timeout: 5000 })
  })
})
