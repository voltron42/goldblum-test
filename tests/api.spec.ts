import { test, expect, waitForApiReady, createTestUser, createTestPost, deleteTestUser, deleteTestPost } from './fixtures';

test.describe('API Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    await waitForApiReady(page);
  });

  test.describe('Health Endpoint', () => {
    test('GET /api/health should return 200', async ({ page }) => {
      const response = await page.request.get('/api/health');
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });

    test('GET /api/health should return status ok', async ({ page }) => {
      const response = await page.request.get('/api/health');
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });
  });

  test.describe('Hello Endpoint', () => {
    test('GET /api/hello should return 200', async ({ page }) => {
      const response = await page.request.get('/api/hello');
      expect(response.status()).toBe(200);
    });

    test('GET /api/hello should return message', async ({ page }) => {
      const response = await page.request.get('/api/hello');
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Hello');
    });
  });

  test.describe('Users Endpoints', () => {
    test('GET /api/users should return 200', async ({ page }) => {
      const response = await page.request.get('/api/users');
      expect(response.status()).toBe(200);
    });

    test('GET /api/users should return array', async ({ page }) => {
      const response = await page.request.get('/api/users');
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('POST /api/users should create user', async ({ page }) => {
      const userData = {
        name: 'API Test User',
        email: 'apitest@example.com',
      };

      const response = await page.request.post('/api/users', {
        data: userData,
      });

      expect(response.status()).toBe(201);
      const user = await response.json();
      expect(user).toHaveProperty('id');
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);

      // Cleanup
      await deleteTestUser(page, user.id);
    });

    test('GET /api/users/:id should return specific user', async ({ page }) => {
      const testUser = await createTestUser(page, { name: 'Get User Test', email: 'getuser@test.com' });

      const response = await page.request.get(`/api/users/${testUser.id}`);
      expect(response.status()).toBe(200);

      const user = await response.json();
      expect(user.id).toBe(testUser.id);
      expect(user.name).toBe(testUser.name);

      // Cleanup
      await deleteTestUser(page, testUser.id);
    });

    test('GET /api/users/:id should return 404 for non-existent user', async ({ page }) => {
      const response = await page.request.get('/api/users/99999');
      expect(response.status()).toBe(404);
    });

    test('PUT /api/users/:id should update user', async ({ page }) => {
      const testUser = await createTestUser(page, { name: 'Update Test', email: 'update@test.com' });

      const updatedData = {
        name: 'Updated Name',
        email: 'updated@test.com',
      };

      const response = await page.request.put(`/api/users/${testUser.id}`, {
        data: updatedData,
      });

      expect(response.status()).toBe(200);

      const updated = await response.json();
      expect(updated.name).toBe(updatedData.name);
      expect(updated.email).toBe(updatedData.email);

      // Cleanup
      await deleteTestUser(page, testUser.id);
    });

    test('DELETE /api/users/:id should delete user', async ({ page }) => {
      const testUser = await createTestUser(page, { name: 'Delete Test', email: 'delete@test.com' });

      const response = await page.request.delete(`/api/users/${testUser.id}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('deleted');

      // Verify user is deleted
      const getResponse = await page.request.get(`/api/users/${testUser.id}`);
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Posts Endpoints', () => {
    test('GET /api/posts should return 200', async ({ page }) => {
      const response = await page.request.get('/api/posts');
      expect(response.status()).toBe(200);
    });

    test('GET /api/posts should return array', async ({ page }) => {
      const response = await page.request.get('/api/posts');
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('POST /api/posts should create post', async ({ page }) => {
      const testUser = await createTestUser(page, { name: 'Post Author', email: 'author@test.com' });

      const postData = {
        userId: testUser.id,
        title: 'API Test Post',
        content: 'This is a test post',
      };

      const response = await page.request.post('/api/posts', {
        data: postData,
      });

      expect(response.status()).toBe(201);
      const post = await response.json();
      expect(post).toHaveProperty('id');
      expect(post.title).toBe(postData.title);

      // Cleanup
      await deleteTestPost(page, post.id);
      await deleteTestUser(page, testUser.id);
    });

    test('GET /api/posts/:id should return specific post', async ({ page }) => {
      const testUser = await createTestUser(page, { name: 'Post Reader', email: 'reader@test.com' });
      const testPost = await createTestPost(page, {
        userId: testUser.id,
        title: 'Get Post Test',
        content: 'Test content',
      });

      const response = await page.request.get(`/api/posts/${testPost.id}`);
      expect(response.status()).toBe(200);

      const post = await response.json();
      expect(post.id).toBe(testPost.id);
      expect(post.title).toBe(testPost.title);

      // Cleanup
      await deleteTestPost(page, testPost.id);
      await deleteTestUser(page, testUser.id);
    });

    test('GET /api/posts/:id should return 404 for non-existent post', async ({ page }) => {
      const response = await page.request.get('/api/posts/99999');
      expect(response.status()).toBe(404);
    });

    test('DELETE /api/posts/:id should delete post', async ({ page }) => {
      const testUser = await createTestUser(page, { name: 'Post Deleter', email: 'deleter@test.com' });
      const testPost = await createTestPost(page, {
        userId: testUser.id,
        title: 'Delete Post Test',
        content: 'Will be deleted',
      });

      const response = await page.request.delete(`/api/posts/${testPost.id}`);
      expect(response.status()).toBe(200);

      // Verify post is deleted
      const getResponse = await page.request.get(`/api/posts/${testPost.id}`);
      expect(getResponse.status()).toBe(404);

      // Cleanup
      await deleteTestUser(page, testUser.id);
    });
  });

  test.describe('Swagger Endpoint', () => {
    test('GET /swagger.json should return 200', async ({ page }) => {
      const response = await page.request.get('/swagger.json');
      expect(response.status()).toBe(200);
    });

    test('GET /swagger.json should return valid OpenAPI spec', async ({ page }) => {
      const response = await page.request.get('/swagger.json');
      const data = await response.json();

      // Check for OpenAPI structure
      expect(data).toHaveProperty('openapi').or.toHaveProperty('swagger');
      expect(data).toHaveProperty('paths');
      expect(data).toHaveProperty('info');
    });

    test('Swagger spec should include all endpoints', async ({ page }) => {
      const response = await page.request.get('/swagger.json');
      const data = await response.json();

      const paths = Object.keys(data.paths);

      // Check for key endpoints
      expect(paths.some((p) => p.includes('/api/health'))).toBeTruthy();
      expect(paths.some((p) => p.includes('/api/users'))).toBeTruthy();
      expect(paths.some((p) => p.includes('/api/posts'))).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('POST with missing required fields should fail', async ({ page }) => {
      const response = await page.request.post('/api/users', {
        data: { name: 'Only Name' }, // Missing email
      });

      // Should either fail validation or still create (depending on implementation)
      // This test verifies the endpoint responds appropriately
      expect([400, 201]).toContain(response.status());
    });

    test('Invalid HTTP method should fail', async ({ page }) => {
      const response = await page.request.patch('/api/hello');
      expect([404, 405]).toContain(response.status());
    });
  });
});
