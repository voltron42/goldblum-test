import { test, expect, waitForApiReady, getBaseUrl, isLocalTest } from './fixtures';

test.describe('Goldblum Application - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for API to be ready
    await waitForApiReady(page);
    // Navigate to home page
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should load the home page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/.*Goldblum.*/i);

    // Check main heading exists
    const heading = page.locator('h1, [role="heading"]').first();
    await expect(heading).toBeVisible();
  });

  test('should display the navbar', async ({ page }) => {
    // Check for navbar
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();

    // Check for app title in navbar
    const brand = page.locator('.navbar-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText(/goldblum|hello world/i);
  });

  test('should display server status', async ({ page }) => {
    // Look for status alert
    const statusAlert = page.locator('[role="alert"]');
    await expect(statusAlert).toBeVisible();

    // Status should indicate connection
    const alertText = await statusAlert.textContent();
    expect(alertText).toBeTruthy();
  });

  test('should display the main content sections', async ({ page }) => {
    // Check for API Tester section
    const apiTester = page.locator('text=API Tester').or(page.locator('text=Endpoint'));
    await expect(apiTester).toBeVisible({ timeout: 5000 });

    // Check for Users section
    const usersSection = page.locator('text=/users/i').first();
    await expect(usersSection).toBeVisible({ timeout: 5000 });

    // Check for Posts section
    const postsSection = page.locator('text=/posts/i').first();
    await expect(postsSection).toBeVisible({ timeout: 5000 });
  });

  test('should have accessible footer', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for footer
    const footer = page.locator('footer').or(page.locator('[role="contentinfo"]'));
    await expect(footer).toBeVisible();
  });

  test('should respond to health check endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  });

  test('should have valid swagger.json endpoint', async ({ page }) => {
    const response = await page.request.get('/swagger.json');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('openapi').or.toHaveProperty('swagger');
    expect(data).toHaveProperty('paths');
  });

  test('should have correct page structure', async ({ page }) => {
    // Check for main content area
    const mainContent = page.locator('main').or(page.locator('[role="main"]'));
    await expect(mainContent).toBeVisible();

    // Check for sections with proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4').count();
    expect(headings).toBeGreaterThan(0);
  });

  test.describe('Environment-specific', () => {
    test('should be testing against correct environment', async ({ page }) => {
      const baseUrl = getBaseUrl();
      expect(page.url()).toContain(baseUrl.replace(/^https?:\/\//, ''));
    });

    test('should work with configured BASE_URL', async ({ page }) => {
      const response = await page.request.get('/api/hello');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Hello');
    });
  });
});
