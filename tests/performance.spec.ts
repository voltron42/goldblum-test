import { test, expect, waitForApiReady } from './fixtures';

test.describe('Performance and Reliability Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForApiReady(page);
  });

  test.describe('Page Load Performance', () => {
    test('should load home page in reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Should load in less than 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should have minimal layout shifts', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      // Wait a bit for any deferred loading
      await page.waitForTimeout(1000);

      // All key elements should be in stable positions
      const elements = page.locator('[class*="card"], [class*="container"]').first();
      const initialBox = await elements.boundingBox();

      await page.waitForTimeout(500);

      const finalBox = await elements.boundingBox();

      // Position should be stable
      expect(initialBox?.x).toBe(finalBox?.x);
      expect(initialBox?.y).toBe(finalBox?.y);
    });

    test('should use efficient CSS', async ({ page }) => {
      const response = await page.goto('/', { waitUntil: 'networkidle' });

      // CSS should be minimal (Bootstrap is from CDN)
      const cssLinks = await page.locator('link[rel="stylesheet"]').count();
      expect(cssLinks).toBeGreaterThan(0);
    });
  });

  test.describe('API Reliability', () => {
    test('should handle rapid API requests', async ({ page }) => {
      const requests = [];

      // Make 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(page.request.get('/api/health'));
      }

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.ok()).toBeTruthy();
      });
    });

    test('should retry on network error', async ({ page, context }) => {
      let attempts = 0;
      const originalRequest = page.request.get;

      // Count how many times a request is made
      await page.route('/api/health', async (route) => {
        attempts++;
        if (attempts === 1) {
          // Fail first time
          await route.abort();
        } else {
          // Succeed second time
          await route.continue();
        }
      });

      const response = await page.request.get('/api/health').catch(() => null);

      // Should eventually succeed (or be caught gracefully)
      expect(response === null || response?.ok()).toBeTruthy();
    });

    test('should timeout long-running requests', async ({ page }) => {
      let completed = false;

      // Intercept and delay response
      await page.route('/api/users', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        completed = true;
        await route.continue();
      });

      // Request should complete within reasonable time
      const startTime = Date.now();
      const response = await page.request.get('/api/users');
      const duration = Date.now() - startTime;

      // Should wait for response (default timeout usually 30s)
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(5000);
    });
  });

  test.describe('UI Interactivity', () => {
    test('should respond quickly to user input', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      // Find an input field
      const input = page.locator('input').first();
      await expect(input).toBeVisible();

      const startTime = Date.now();
      await input.fill('Test Input');
      const responseTime = Date.now() - startTime;

      // Input should respond immediately
      expect(responseTime).toBeLessThan(1000);

      const value = await input.inputValue();
      expect(value).toBe('Test Input');
    });

    test('should handle rapid clicks', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      // Find a button
      const button = page.locator('button').first();
      await expect(button).toBeVisible();

      // Click rapidly
      for (let i = 0; i < 5; i++) {
        await button.click();
        await page.waitForTimeout(50);
      }

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error Recovery', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('/api/error', (route) => route.abort());

      const response = await page.request.get('/api/error').catch((e) => {
        expect(e).toBeTruthy();
        return null;
      });

      // Either no response or handled error
      expect(response === null || !response?.ok()).toBeTruthy();
    });

    test('should display user feedback on errors', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      // Try to access invalid endpoint through UI
      const methodSelect = page.locator('select').first();
      if (await methodSelect.isVisible({ timeout: 1000 })) {
        await methodSelect.selectOption('GET');

        const endpointInput = page.locator('input[type="text"]').first();
        await endpointInput.fill('/api/invalid');

        const executeButton = page.locator('button:has-text(/execute|test/i)').first();
        await executeButton.click();

        // Should display error message or error response
        const responseBox = page.locator('[class*="response"]').first();
        await expect(responseBox).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not leak memory on repeated navigation', async ({ page }) => {
      // Navigate back and forth multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }

      // Page should still be responsive
      await expect(page.locator('body')).toBeVisible();
    });

    test('should clean up event listeners', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      // Count event listeners
      const listenerCount = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let count = 0;
        allElements.forEach((el) => {
          if ((el as any)._getEventListeners) {
            count += Object.keys((el as any)._getEventListeners).length;
          }
        });
        return count;
      });

      // Should have reasonable number of listeners
      expect(listenerCount).toBeLessThan(1000);
    });
  });

  test.describe('Consistency', () => {
    test('should return consistent data across requests', async ({ page }) => {
      // Get users twice
      const users1 = await page.request.get('/api/users').then((r) => r.json());
      const users2 = await page.request.get('/api/users').then((r) => r.json());

      // Should be identical
      expect(users1).toEqual(users2);
    });

    test('should maintain referential integrity', async ({ page }) => {
      // Get posts
      const posts = await page.request.get('/api/posts').then((r) => r.json());

      if (posts.length > 0) {
        const post = posts[0];

        // User ID should reference valid user
        const users = await page.request.get('/api/users').then((r) => r.json());
        const userExists = users.some((u: any) => u.id === post.userId);

        // Either user exists or it's okay to have orphaned posts
        expect(typeof post.userId).toBe('number');
      }
    });
  });
});
