# Goldblum E2E Tests with Playwright

Comprehensive regression test suite for the Goldblum full-stack application using Playwright. Tests can run against both local development and fly.io deployed instances.

## Overview

This test suite includes:

- **Smoke Tests** (`smoke.spec.ts`): Basic page load and functionality checks
- **API Tester Component** (`api-tester.spec.ts`): Tests for the interactive API testing panel
- **Users Component** (`users.spec.ts`): User CRUD operations and UI interactions
- **Posts Component** (`posts.spec.ts`): Post CRUD operations and UI interactions
- **API Endpoints** (`api.spec.ts`): Direct API endpoint testing
- **Responsive Design** (`responsive.spec.ts`): Mobile, tablet, and desktop layouts
- **Performance** (`performance.spec.ts`): Load times, reliability, and consistency

## Quick Start

### Install

```bash
npm install
```

### Run Tests Locally

```bash
# Tests will start goldblum server automatically on port 8080
npm test

# Or with UI to watch tests
npm test:ui
```

### Run Tests Against fly.io

```bash
npm run test:fly
```

## Setup

### Prerequisites

- Node.js 18+ and npm
- The Goldblum application running locally or deployed

### Installation

```bash
npm install
```

This installs Playwright and its browsers.

## Running Tests

### Local Development

Run tests against `http://localhost:8080`:

```bash
# Run all tests (will start goldblum server automatically)
npm test

# Run in UI mode for debugging
npm test:ui

# Run in headed mode (see browser)
npm test:headed

# Run specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Debug mode
npm run test:debug
```

### Against fly.io Deployment

Run tests against your deployed application:

```bash
# Run against deployed instance
npm run test:fly

# Headed mode against production
npm run test:fly:headed
```

### Custom Base URL

```bash
# Test against any URL
BASE_URL=http://example.com npm test
```

## Test Organization

Tests are organized by feature and concern:

```
tests/
├── fixtures.ts           # Shared utilities and API helpers
├── smoke.spec.ts         # Basic page load tests
├── api-tester.spec.ts    # API tester component tests
├── users.spec.ts         # User management tests
├── posts.spec.ts         # Post management tests
├── api.spec.ts           # Direct API endpoint tests
├── responsive.spec.ts    # Mobile/tablet/desktop tests
└── performance.spec.ts   # Performance and reliability tests
```

## Key Features

### Fixtures and Utilities

`fixtures.ts` provides reusable utilities:

```typescript
// Wait for API ready
await waitForApiReady(page);

// Check environment
isLocalTest(); // true for localhost
getBaseUrl(); // Get configured base URL

// API helpers
await createTestUser(page, { name, email });
await createTestPost(page, { userId, title, content });
await getAllUsers(page);
await getAllPosts(page);
await deleteTestUser(page, userId);
await deleteTestPost(page, postId);
```

### Test Isolation

Each test is independent:
- Tests create their own data
- Fixtures can reset state between tests
- Tests clean up after themselves (delete created data)

### Environment-Aware Tests

Some tests skip on production (fly.io):
- Tests that require deleting all data
- Tests that assume fresh state

Tests include environment-specific validation:
```typescript
const isLocal = isLocalTest();
if (!isLocal) test.skip(); // Skip on production
```

## Configuration

### `playwright.config.ts`

Key settings:

- **`baseURL`**: Set via `BASE_URL` env var or defaults to `http://localhost:8080`
- **`webServer`**: Automatically starts Goldblum during tests (local only)
- **`use.screenshot`**: Captures screenshots on test failure
- **`use.trace`**: Records traces on first retry for debugging
- **`retries`**: 2 on CI, 0 locally

### Projects

Tests run on multiple browsers and devices:

- Desktop: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12
- Tablet: iPad Pro

## Debugging

### View Test Report

```bash
# After running tests
npx playwright show-report
```

### Record a Trace

```bash
# During test failure, trace is automatically recorded
# Open with:
npx playwright show-trace trace.zip
```

### Generate Test Code

Use Playwright Codegen to generate test code:

```bash
npm run codegen
# Will open browser and record interactions
```

### Debug Single Test

```bash
npm run test:debug -- tests/smoke.spec.ts
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/e2e-test.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: cd goldblum-test && npm install
      
      - name: Run tests
        run: cd goldblum-test && npm test
        env:
          CI: true
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: goldblum-test/playwright-report/
```

## Best Practices

### Writing Tests

1. **Use descriptive names**: Test names should clearly state what they verify
2. **Arrange-Act-Assert**: Organize tests with setup, action, verification
3. **Isolate tests**: Each test should be independent
4. **Use fixtures**: Leverage shared utilities for API interactions
5. **Wait explicitly**: Use `waitForLoadState`, `waitForSelector`, not `sleep`

### Selectors

Prefer this order of selector strategies:

1. **Role-based**: `page.locator('[role="button"]')`
2. **Label/Text**: `page.locator('text=Submit')`
3. **Test ID**: `page.locator('[data-testid="submit"]')`
4. **CSS class**: `page.locator('.submit-button')`

### Assertions

Use Playwright assertions with auto-retry:

```typescript
// Good - retries automatically
await expect(element).toBeVisible();

// Avoid - only checks once
expect(element.isVisible()).toBeTruthy();
```

## Troubleshooting

### Tests timeout

- Increase timeout: `test.setTimeout(60000)` in spec file
- Check API is responsive: `curl http://localhost:8080/api/health`
- Verify BASE_URL is correct

### Flaky tests

- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use retry logic for network requests
- Verify test doesn't depend on timing

### "No tests found"

```bash
# Verify test file exists
ls tests/
# Check file extension is .spec.ts
```

### Port already in use

```bash
# If 8080 is in use, kill it or run server manually
# Then skip webServer in playwright.config
```

## Reporting

Test reports are generated in `playwright-report/`:

- HTML report with screenshots
- Video recordings
- Traces for debugging
- Detailed test results

View with:
```bash
npx playwright show-report
```

## Test Statistics

Current test suite coverage:

- **Total test files**: 6
- **Total test cases**: 70+
- **Coverage areas**:
  - Smoke/Sanity: 8 tests
  - API Tester UI: 6 tests
  - Users CRUD: 8 tests
  - Posts CRUD: 8 tests
  - API Endpoints: 19 tests
  - Responsive Design: 13 tests
  - Performance/Reliability: 10 tests

## Environment Variables

```bash
# Test URL (default: http://localhost:8080)
BASE_URL=https://goldblum-hello-world.fly.dev

# CI environment
CI=true

# Debug output
DEBUG=pw:api
```

## Contributing

When adding tests:

1. Follow existing patterns
2. Use descriptive test names
3. Add fixtures for reusable logic
4. Document any environment-specific behavior
5. Ensure tests pass locally before committing

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Goldblum README](../goldblum/README.md)
- [Goldblum API Documentation](../goldblum/README.md#api-endpoints)

## License

Same as Goldblum project
