import type { Page } from '@playwright/test'

const EMAIL    = process.env.TEST_USER_EMAIL!
const PASSWORD = process.env.TEST_USER_PASSWORD!

export async function login(page: Page) {
  await page.goto('/')
  await page.getByPlaceholder('E-mail').fill(EMAIL)
  await page.getByPlaceholder('Senha').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Wait for dashboard to appear
  await page.waitForSelector('text=Olá', { timeout: 10000 })
}

export async function logout(page: Page) {
  await page.getByTitle('Sair').click()
  await page.waitForSelector('text=Plutus', { timeout: 5000 })
}
