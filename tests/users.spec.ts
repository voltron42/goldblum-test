import { test, expect, waitForApiReady, createTestUser, deleteTestUser, getAllUsers } from './fixtures';

test.describe('Users Component', () => {
  test.beforeEach(async ({ page }) => {
    await waitForApiReady(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display Users section', async ({ page }) => {
    const usersCard = page.locator('text=/users/i').first().locator('..').locator('..').locator('..').first();
    await expect(usersCard).toBeVisible();
  });

  test('should display list of users', async ({ page }) => {
    // Look for user list items
    const listItems = page.locator('li').filter({ hasText: /alice|bob|@example/i }).first();
    await expect(listItems).toBeVisible({ timeout: 5000 });
  });

  test('should display Add User button', async ({ page }) => {
    const addUserButton = page.locator('button:has-text(/add user|create user/i)').first();
    await expect(addUserButton).toBeVisible();
  });

  test('should toggle add user form when clicking button', async ({ page }) => {
    const addUserButton = page.locator('button:has-text(/add user|create user/i)').first();

    // Form should be hidden initially
    let form = page.locator('form').or(page.locator('input[type="text"][placeholder*="name" i]')).first();

    // Click to show form
    await addUserButton.click();

    // Form should now be visible
    form = page.locator('input').filter({ hasAttribute: 'placeholder', hasText: /name|email/i }).first();
    await expect(form).toBeVisible({ timeout: 1000 });

    // Click again to hide
    await addUserButton.click();
    await form.isHidden({ timeout: 1000 }).then((hidden) => expect(hidden).toBeTruthy());
  });

  test('should create a new user through UI', async ({ page }) => {
    // Get initial user count
    let users = await getAllUsers(page);
    const initialCount = users.length;

    // Open add user form
    const addUserButton = page.locator('button:has-text(/add user|create user/i)').first();
    await addUserButton.click();

    // Wait for form to appear
    await page.waitForTimeout(300);

    // Fill form
    const nameInput = page.locator('input').filter({ hasAttribute: 'placeholder' }).first();
    await nameInput.fill('Playwright Test User');

    const emailInput = page.locator('input').filter({ hasAttribute: 'placeholder' }).nth(1);
    await emailInput.fill('playwright@test.com');

    // Submit form
    const submitButton = page.locator('button:has-text(/submit|save|add|create/i)').first();
    await submitButton.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Verify user was added
    users = await getAllUsers(page);
    expect(users.length).toBe(initialCount + 1);

    // Verify new user details
    const newUser = users[users.length - 1];
    expect(newUser.name).toBe('Playwright Test User');
    expect(newUser.email).toBe('playwright@test.com');
  });

  test('should delete a user through UI', async ({ page }) => {
    // Create a test user
    const testUser = await createTestUser(page, { name: 'Delete Test User', email: 'delete@test.com' });

    // Reload page to see new user
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial count
    let users = await getAllUsers(page);
    const initialCount = users.length;

    // Find and click delete button for test user
    const userItem = page.locator(`text=${testUser.name}`).first();
    await expect(userItem).toBeVisible();

    // Find delete button near user item
    const deleteButton = userItem.locator('..').locator('button:has-text(/delete|remove|x/i)').first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Wait for deletion
    await page.waitForTimeout(500);

    // Verify user was deleted
    users = await getAllUsers(page);
    expect(users.length).toBe(initialCount - 1);
    expect(users.find((u) => u.id === testUser.id)).toBeUndefined();
  });

  test('should display user details correctly', async ({ page }) => {
    // Get users from API
    const users = await getAllUsers(page);
    expect(users.length).toBeGreaterThan(0);

    // Find first user in UI
    const firstUser = users[0];
    const userItem = page.locator(`text=${firstUser.name}`).first();
    await expect(userItem).toBeVisible();

    // Verify details are displayed
    const itemText = await userItem.textContent();
    expect(itemText).toContain(firstUser.name);
    expect(itemText).toContain(firstUser.email);
    expect(itemText).toContain(String(firstUser.id));
  });

  test('should display user badge with ID', async ({ page }) => {
    const users = await getAllUsers(page);
    expect(users.length).toBeGreaterThan(0);

    // Find user with ID badge
    const badge = page.locator('[class*="badge"], [class*="badge-info"]').first();
    await expect(badge).toBeVisible();

    const badgeText = await badge.textContent();
    expect(badgeText).toMatch(/\d+/);
  });

  test('should maintain user list on page refresh', async ({ page }) => {
    // Get initial users
    let users = await getAllUsers(page);
    const userCount = users.length;

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get users again
    users = await getAllUsers(page);
    expect(users.length).toBe(userCount);
  });

  test('should show empty state when no users (after delete all)', async ({ page }) => {
    // Skip this test for fly.io as we don't want to delete all users
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    if (!baseUrl.includes('localhost')) {
      test.skip();
    }

    // Get all users and delete them via API
    let users = await getAllUsers(page);
    for (const user of users) {
      await deleteTestUser(page, user.id);
    }

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify empty state or message
    users = await getAllUsers(page);
    expect(users.length).toBe(0);

    // Check for empty message or empty list
    const emptyMessage = page.locator('text=/no users|empty|create/i').first();
    const userList = page.locator('ul, [role="list"]').first();

    // Either empty message OR empty list
    const isEmpty = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const isEmptyList = await userList.isHidden({ timeout: 2000 }).catch(() => false);

    expect(isEmpty || isEmptyList).toBeTruthy();
  });
});
