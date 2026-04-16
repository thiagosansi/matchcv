import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MatchCV/i);
    await expect(page.locator('h1')).toBeVisible();
    // Primary CTA button leads to analyze or login
    const cta = page.locator('a[href="/analyze"], a[href="/login"]').first();
    await expect(cta).toBeVisible();
  });

  test('"Como funciona" section is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Como funciona')).toBeVisible();
  });

  test('has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Filter out known third-party noise
    const appErrors = errors.filter(
      (e) => !e.includes('chrome-extension') && !e.includes('favicon')
    );
    expect(appErrors).toHaveLength(0);
  });
});

test.describe('Login page', () => {
  test('renders email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });
  });

  test('link to signup page works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /criar conta/i }).click();
    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('Signup page', () => {
  test('renders all fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input#fullName')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeVisible();
  });

  test('link back to login works', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
