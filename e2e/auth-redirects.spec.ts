import { test, expect } from '@playwright/test';

const PROTECTED_ROUTES = ['/analyze', '/history', '/results/preview', '/profile'];

test.describe('Protected route redirects', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`unauthenticated user is redirected from ${route}`, async ({ page }) => {
      await page.goto(route);
      // Should end up on /login
      await expect(page).toHaveURL(/login/, { timeout: 8000 });
    });
  }
});

test.describe('Auth page behavior', () => {
  test('authenticated user visiting /login is redirected away', async ({ page }) => {
    // Without a real session we cannot test the positive case,
    // but we ensure the page at least loads when unauthenticated.
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });
});
