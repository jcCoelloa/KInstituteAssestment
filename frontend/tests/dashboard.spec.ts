import { test, expect } from '@playwright/test';

test('el dashboard carga y muestra la tabla de casos', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard de casos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Casos', exact: true })).toBeVisible();
});
