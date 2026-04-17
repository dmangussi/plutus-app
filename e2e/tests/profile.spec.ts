import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth'

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('avatar navigates to profile page', async ({ page }) => {
    await page.getByTitle('Perfil').click()
    await expect(page.getByText('Perfil')).toBeVisible({ timeout: 5000 })
  })

  test('profile page shows user email', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL!
    await page.getByTitle('Perfil').click()
    await expect(page.getByText(email)).toBeVisible({ timeout: 5000 })
  })

  test('back button returns to dashboard', async ({ page }) => {
    await page.getByTitle('Perfil').click()
    await expect(page.getByText('Perfil')).toBeVisible({ timeout: 5000 })
    await page.locator('button', { hasText: '←' }).click()
    await expect(page.getByText('Olá')).toBeVisible({ timeout: 5000 })
  })

  test('mismatched confirm password shows inline error', async ({ page }) => {
    await page.getByTitle('Perfil').click()
    const inputs = page.locator('input[type="password"]')
    await inputs.nth(0).fill('qualquersenha')
    await inputs.nth(1).fill('novasenha1')
    await inputs.nth(2).fill('novasenha2')
    await expect(page.getByText('As senhas não coincidem')).toBeVisible({ timeout: 3000 })
  })

  test('new password shorter than 6 chars shows inline error', async ({ page }) => {
    await page.getByTitle('Perfil').click()
    const inputs = page.locator('input[type="password"]')
    await inputs.nth(0).fill('qualquersenha')
    await inputs.nth(1).fill('abc')
    await inputs.nth(2).fill('abc')
    await expect(page.getByText('Mínimo 6 caracteres')).toBeVisible({ timeout: 3000 })
  })

  test('wrong current password returns error from API', async ({ page }) => {
    await page.getByTitle('Perfil').click()
    const inputs = page.locator('input[type="password"]')
    await inputs.nth(0).fill('senhaerrada')
    await inputs.nth(1).fill('novasenha123')
    await inputs.nth(2).fill('novasenha123')
    await page.getByRole('button', { name: /salvar nova senha/i }).click()
    await expect(page.getByText('Senha atual incorreta')).toBeVisible({ timeout: 5000 })
  })
})
