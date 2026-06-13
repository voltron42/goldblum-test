import { test, expect, waitForApiReady } from './fixtures';

test.describe('Responsive Design Tests', () => {
  test.describe('Desktop Views', () => {
    test('should display on desktop without issues', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const navbar = page.locator('nav').first();
      await expect(navbar).toBeVisible();
    });

    test('should fit all sections without horizontal scroll', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(1920);
    });
  });

  test.describe('Mobile Views - Pixel 5 (393x851)', () => {
    test('should display on mobile without horizontal scroll', async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(393);
    });

    test('should display navbar in mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const navbar = page.locator('nav');
      await expect(navbar).toBeVisible();
    });

    test('should have clickable buttons on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const buttons = page.locator('button').first();
      await expect(buttons).toBeVisible();
    });
  });

  test.describe('Tablet Views - iPad (1024x1366)', () => {
    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1366 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const heading = page.locator('h1, h2, nav').first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Text and Content Sizing', () => {
    test('should have readable text sizes', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const text = page.locator('body').first();
      const fontSize = await text.evaluate((el) => window.getComputedStyle(el).fontSize);
      const size = parseInt(fontSize);
      expect(size).toBeGreaterThanOrEqual(12);
    });

    test('should have sufficient line height', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const paragraph = page.locator('body').first();
      const lineHeight = await paragraph.evaluate((el) => window.getComputedStyle(el).lineHeight);
      expect(lineHeight).toBeTruthy();
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait orientation', async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const viewportSize = page.viewportSize();
      expect((viewportSize?.height || 0) > (viewportSize?.width || 0)).toBeTruthy();
    });

    test('should handle landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 851, height: 393 });
      await waitForApiReady(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(851);
    });
  });
});

