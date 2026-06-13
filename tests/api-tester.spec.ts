import { test, expect, waitForApiReady } from './fixtures';

test.describe('API Tester Component', () => {
  test.beforeEach(async ({ page }) => {
    await waitForApiReady(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display API Tester section', async ({ page }) => {
    // Find the API tester component
    const apiTesterCard = page.locator('text=API Tester').or(page.locator('text=Endpoint')).first().locator('..').locator('..').locator('..').first();
    await expect(apiTesterCard).toBeVisible();
  });

  test('should have method selector dropdown', async ({ page }) => {
    // Find the method dropdown
    const methodSelect = page.locator('select').first();
    await expect(methodSelect).toBeVisible();

    // Verify it has the basic HTTP methods
    const options = await methodSelect.locator('option').count();
    expect(options).toBeGreaterThanOrEqual(4); // GET, POST, PUT, DELETE
  });

  test('should have endpoint input field', async ({ page }) => {
    // Find the endpoint input
    const endpointInput = page.locator('input[type="text"]').first();
    await expect(endpointInput).toBeVisible();
    await expect(endpointInput).toHaveAttribute('placeholder', /endpoint|url|api/i);
  });

  test('should allow testing GET endpoint', async ({ page }) => {
    // Select GET method
    const methodSelect = page.locator('select').first();
    await methodSelect.selectOption('GET');

    // Enter endpoint
    const endpointInput = page.locator('input[type="text"]').first();
    await endpointInput.fill('/api/health');

    // Click execute button
    const executeButton = page.locator('button:has-text(/execute|test|send/i)').first();
    await executeButton.click();

    // Wait for response
    await page.waitForTimeout(1000);

    // Check for response display
    const responseBox = page.locator('[class*="response"]').first();
    await expect(responseBox).toBeVisible();

    // Verify response contains expected data
    const responseText = await responseBox.textContent();
    expect(responseText).toContain('ok');
  });

  test('should display response for POST endpoint', async ({ page }) => {
    // Select POST method
    const methodSelect = page.locator('select').first();
    await methodSelect.selectOption('POST');

    // Enter endpoint
    const endpointInput = page.locator('input[type="text"]').first();
    await endpointInput.fill('/api/users');

    // Enter request body
    const bodyTextarea = page.locator('textarea').first();
    await bodyTextarea.fill(JSON.stringify({ name: 'Test User', email: 'test@example.com' }));

    // Click execute button
    const executeButton = page.locator('button:has-text(/execute|test|send/i)').first();
    await executeButton.click();

    // Wait for response
    await page.waitForTimeout(1000);

    // Check for response
    const responseBox = page.locator('[class*="response"]').first();
    await expect(responseBox).toBeVisible();

    // Verify response contains created user
    const responseText = await responseBox.textContent();
    expect(responseText).toContain('id');
  });

  test('should show 404 for non-existent endpoint', async ({ page }) => {
    // Select GET method
    const methodSelect = page.locator('select').first();
    await methodSelect.selectOption('GET');

    // Enter non-existent endpoint
    const endpointInput = page.locator('input[type="text"]').first();
    await endpointInput.fill('/api/nonexistent');

    // Click execute button
    const executeButton = page.locator('button:has-text(/execute|test|send/i)').first();
    await executeButton.click();

    // Wait for response
    await page.waitForTimeout(1000);

    // Check for error response
    const responseBox = page.locator('[class*="response"][class*="error"]').first();
    await expect(responseBox).toBeVisible();

    // Verify it shows 404
    const responseText = await responseBox.textContent();
    expect(responseText).toMatch(/404|not found|error/i);
  });

  test('should clear response when changing endpoint', async ({ page }) => {
    // Make a request
    const methodSelect = page.locator('select').first();
    await methodSelect.selectOption('GET');

    const endpointInput = page.locator('input[type="text"]').first();
    await endpointInput.fill('/api/health');

    const executeButton = page.locator('button:has-text(/execute|test|send/i)').first();
    await executeButton.click();

    // Wait for response
    await page.waitForTimeout(1000);

    // Change endpoint
    await endpointInput.fill('/api/hello');

    // Response should update
    await executeButton.click();
    await page.waitForTimeout(1000);

    // New response should be displayed
    const responseBox = page.locator('[class*="response"]').first();
    const responseText = await responseBox.textContent();
    expect(responseText).toContain('Hello');
  });

  test('should display loading state during request', async ({ page }) => {
    // Setup intercept to delay response
    await page.route('/api/health', (route) => {
      setTimeout(() => route.continue(), 500);
    });

    // Make request
    const methodSelect = page.locator('select').first();
    await methodSelect.selectOption('GET');

    const endpointInput = page.locator('input[type="text"]').first();
    await endpointInput.fill('/api/health');

    const executeButton = page.locator('button:has-text(/execute|test|send/i)').first();
    await executeButton.click();

    // Check for loading indicator
    const spinner = page.locator('[class*="spinner"], [class*="loading"]').first();
    await expect(spinner).toBeVisible({ timeout: 1000 });
  });
});
