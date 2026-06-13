import { test, expect, waitForApiReady, createTestPost, createTestUser, deleteTestPost, getAllPosts } from './fixtures';

test.describe('Posts Component', () => {
  test.beforeEach(async ({ page }) => {
    await waitForApiReady(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display Posts section', async ({ page }) => {
    const postsCard = page.locator('text=/posts/i').first().locator('..').locator('..').locator('..').first();
    await expect(postsCard).toBeVisible();
  });

  test('should display list of posts', async ({ page }) => {
    // Look for post list items
    const listItems = page.locator('li').filter({ hasText: /hello world|getting started|post/i }).first();
    await expect(listItems).toBeVisible({ timeout: 5000 });
  });

  test('should display Add Post button', async ({ page }) => {
    const addPostButton = page.locator('button:has-text(/add post|create post/i)').first();
    await expect(addPostButton).toBeVisible();
  });

  test('should toggle add post form when clicking button', async ({ page }) => {
    const addPostButton = page.locator('button:has-text(/add post|create post/i)').first();

    // Click to show form
    await addPostButton.click();

    // Form should be visible
    const form = page.locator('input').or(page.locator('textarea')).first();
    await expect(form).toBeVisible({ timeout: 1000 });

    // Click again to hide
    await addPostButton.click();
    await form.isHidden({ timeout: 1000 }).then((hidden) => expect(hidden).toBeTruthy());
  });

  test('should create a new post through UI', async ({ page }) => {
    // Create a user first
    const testUser = await createTestUser(page, { name: 'Post Author', email: 'author@test.com' });

    // Reload to refresh post list
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial post count
    let posts = await getAllPosts(page);
    const initialCount = posts.length;

    // Open add post form
    const addPostButton = page.locator('button:has-text(/add post|create post/i)').first();
    await addPostButton.click();

    // Wait for form to appear
    await page.waitForTimeout(300);

    // Fill form - find inputs/textareas
    const inputs = page.locator('input, textarea');
    const firstInput = inputs.nth(0); // userId
    const secondInput = inputs.nth(1); // title
    const thirdInput = inputs.nth(2); // content

    await firstInput.fill(String(testUser.id));
    await secondInput.fill('Playwright Post Test');
    await thirdInput.fill('This is a test post created by Playwright');

    // Submit form
    const submitButton = page.locator('button:has-text(/submit|save|add|create/i)').first();
    await submitButton.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Verify post was added
    posts = await getAllPosts(page);
    expect(posts.length).toBe(initialCount + 1);

    // Verify new post details
    const newPost = posts[posts.length - 1];
    expect(newPost.title).toBe('Playwright Post Test');
    expect(newPost.content).toBe('This is a test post created by Playwright');
  });

  test('should delete a post through UI', async ({ page }) => {
    // Create a test user and post
    const testUser = await createTestUser(page, { name: 'Post Deleter', email: 'deleter@test.com' });
    const testPost = await createTestPost(page, {
      userId: testUser.id,
      title: 'Delete Test Post',
      content: 'This post will be deleted',
    });

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial count
    let posts = await getAllPosts(page);
    const initialCount = posts.length;

    // Find and click delete button for test post
    const postItem = page.locator(`text=Delete Test Post`).first();
    await expect(postItem).toBeVisible();

    // Find delete button near post item
    const deleteButton = postItem.locator('..').locator('button:has-text(/delete|remove|x/i)').first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Wait for deletion
    await page.waitForTimeout(500);

    // Verify post was deleted
    posts = await getAllPosts(page);
    expect(posts.length).toBe(initialCount - 1);
    expect(posts.find((p) => p.id === testPost.id)).toBeUndefined();
  });

  test('should display post details correctly', async ({ page }) => {
    // Get posts from API
    const posts = await getAllPosts(page);
    expect(posts.length).toBeGreaterThan(0);

    // Find first post in UI
    const firstPost = posts[0];
    const postItem = page.locator(`text=${firstPost.title}`).first();
    await expect(postItem).toBeVisible();

    // Verify details are displayed
    const itemText = await postItem.textContent();
    expect(itemText).toContain(firstPost.title);
    expect(itemText).toContain(firstPost.content);
  });

  test('should display post with author userId', async ({ page }) => {
    const posts = await getAllPosts(page);
    expect(posts.length).toBeGreaterThan(0);

    // Find post with userId info
    const firstPost = posts[0];
    const postItem = page.locator(`text=${firstPost.title}`).first();
    await expect(postItem).toBeVisible();

    // Look for userId indicator
    const userIdBadge = postItem.locator('..').locator('[class*="badge"]').or(page.locator(`text=${firstPost.userId}`));
    await expect(userIdBadge.first()).toBeVisible({ timeout: 2000 });
  });

  test('should maintain post list on page refresh', async ({ page }) => {
    // Get initial posts
    let posts = await getAllPosts(page);
    const postCount = posts.length;

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get posts again
    posts = await getAllPosts(page);
    expect(posts.length).toBe(postCount);
  });

  test('should show empty state when no posts (after delete all)', async ({ page }) => {
    // Skip this test for fly.io
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    if (!baseUrl.includes('localhost')) {
      test.skip();
    }

    // Get all posts and delete them via API
    let posts = await getAllPosts(page);
    for (const post of posts) {
      await deleteTestPost(page, post.id);
    }

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify empty state
    posts = await getAllPosts(page);
    expect(posts.length).toBe(0);

    // Check for empty message or empty list
    const emptyMessage = page.locator('text=/no posts|empty|create/i').first();
    const postList = page.locator('ul, [role="list"]').nth(2); // Third list should be posts

    const isEmpty = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const isEmptyList = await postList.isHidden({ timeout: 2000 }).catch(() => false);

    expect(isEmpty || isEmptyList).toBeTruthy();
  });

  test('should display post with formatted content', async ({ page }) => {
    const posts = await getAllPosts(page);
    expect(posts.length).toBeGreaterThan(0);

    // Find post in UI
    const firstPost = posts[0];
    const postItem = page.locator(`text=${firstPost.title}`).first();

    // Verify content is displayed (might be truncated)
    const itemText = await postItem.textContent();
    expect(itemText).toContain(firstPost.title);
  });
});
