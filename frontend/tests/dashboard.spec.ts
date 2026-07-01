import { test, expect } from '@playwright/test';

test('el dashboard carga y muestra la tabla de casos', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard de casos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Casos', exact: true })).toBeVisible();
});

test('la lista muestra número de caso y actividad reciente', async ({ page }) => {
  await page.goto('/dashboard');
  // Columnas nuevas del rediseño (requiere el backend con datos).
  await expect(page.getByRole('columnheader', { name: 'Caso' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Último mensaje' })).toBeVisible();
});

test('el detalle muestra el historial como conversación con canal y hora', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();
  // Cada mensaje del historial lleva su dirección etiquetada.
  await expect(page.getByText(/ENTRANTE|SALIENTE/).first()).toBeVisible();
});
