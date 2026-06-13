import { test as base, Page, expect } from '@playwright/test';

/**
 * Fixtures and utilities for Goldblum E2E tests
 */

export type TestFixtures = {
  apiResponse: Promise<string>;
};

export const test = base.extend<TestFixtures>({
  // Add custom fixtures if needed
});

export { expect };

/**
 * Wait for the API to be ready by checking health endpoint
 */
export async function waitForApiReady(page: Page): Promise<void> {
  const maxAttempts = 30;
  const delayMs = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await page.request.get('/api/health');
      if (response.ok()) {
        return;
      }
    } catch (e) {
      // API not ready yet
    }
    await page.waitForTimeout(delayMs);
  }

  throw new Error('API did not become ready within timeout');
}

/**
 * Get the current server URL for testing
 */
export function getBaseUrl(): string {
  return process.env.BASE_URL || 'http://localhost:8080';
}

/**
 * Check if testing against local dev or fly.io
 */
export function isLocalTest(): boolean {
  const baseUrl = getBaseUrl();
  return baseUrl.includes('localhost');
}

/**
 * Create a test user via API
 */
export async function createTestUser(page: Page, userData: { name: string; email: string }): Promise<{ id: number; name: string; email: string }> {
  const response = await page.request.post('/api/users', {
    data: userData,
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Create a test post via API
 */
export async function createTestPost(
  page: Page,
  postData: { userId: number; title: string; content: string }
): Promise<{ id: number; userId: number; title: string; content: string }> {
  const response = await page.request.post('/api/posts', {
    data: postData,
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Delete a user via API
 */
export async function deleteTestUser(page: Page, userId: number): Promise<void> {
  const response = await page.request.delete(`/api/users/${userId}`);
  expect(response.ok()).toBeTruthy();
}

/**
 * Delete a post via API
 */
export async function deleteTestPost(page: Page, postId: number): Promise<void> {
  const response = await page.request.delete(`/api/posts/${postId}`);
  expect(response.ok()).toBeTruthy();
}

/**
 * Get all users via API
 */
export async function getAllUsers(page: Page): Promise<Array<{ id: number; name: string; email: string }>> {
  const response = await page.request.get('/api/users');
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Get all posts via API
 */
export async function getAllPosts(page: Page): Promise<Array<{ id: number; userId: number; title: string; content: string }>> {
  const response = await page.request.get('/api/posts');
  expect(response.ok()).toBeTruthy();
  return response.json();
}
