# Test Execution Guide

Complete guide for running the Goldblum E2E test suite.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Goldblum application repo available locally

## Initial Setup

### 1. Install Dependencies

```bash
cd goldblum-test
npm install
```

This installs Playwright and downloads browser binaries (~150-200MB).

### 2. Verify Installation

```bash
npx playwright --version
# Should show: Version X.X.X
```

## Running Tests Locally

### Option 1: Automatic Server Start (Recommended)

Playwright will automatically start the Goldblum server:

```bash
npm test
```

This:
1. Starts Jetty server on `http://localhost:8080`
2. Waits for server to be ready
3. Runs all tests
4. Generates HTML report in `playwright-report/`

**Note**: Requires Leiningen (`lein`) to be available in PATH.

### Option 2: Manual Server Start

If auto-start doesn't work, start the server manually:

```bash
# Terminal 1: Start Goldblum
cd goldblum
lein run

# Terminal 2: Run tests (without auto-start)
cd goldblum-test
BASE_URL=http://localhost:8080 npm test
```

### Option 3: UI Mode (Interactive)

For better debugging and visibility:

```bash
npm run test:ui
```

This opens the Playwright Inspector UI where you can:
- See test execution step-by-step
- Watch tests run in browser
- Inspect elements
- Jump to test source code

## Running Tests Against fly.io

```bash
# Run all tests against production
npm run test:fly

# Run in headed mode to watch
npm run test:fly:headed

# Run specific test file
npm run test:fly -- tests/smoke.spec.ts
```

### Important Notes for Production

- Some tests are skipped on production (those that delete all data)
- Tests are read-only where possible
- Results report to `playwright-report/`

## Running Specific Tests

### Run Single Test File

```bash
npm test -- tests/api.spec.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "Health"
npm test -- --grep "Users"
npm test -- --grep "POST"
```

### Run Single Test

```bash
npm test -- --grep "should display navbar"
```

## Browser-Specific Tests

### Chromium Only

```bash
npm run test:chromium
```

### Firefox Only

```bash
npm run test:firefox
```

### WebKit Only

```bash
npm run test:webkit
```

### All Browsers

```bash
npm test
# Runs on all 3 browsers sequentially
```

## Debug Mode

### Interactive Debugging

```bash
npm run test:debug
```

Opens Playwright Inspector where you can:
- Step through test code
- Pause at breakpoints
- Inspect application state

### With Headed Browsers

```bash
npm run test:headed
```

Shows browser window during test execution for visual debugging.

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Create Trace for Debugging

```bash
npm test -- --trace on
# Then view trace with:
npx playwright show-trace test-results/<test>.zip
```

## Test Reports

### View HTML Report

```bash
# After running tests
npx playwright show-report
```

Opens interactive HTML report showing:
- Test results summary
- Screenshots on failure
- Trace recordings
- Detailed error messages

### Generate Test Report

```bash
npm test -- --reporter html
# Report saved to: playwright-report/index.html
```

### Multiple Reporters

```bash
npm test -- --reporter=html,json,junit
```

## Filtering Tests

### Include Tests

```bash
npm test -- --grep "Smoke"
npm test -- --grep "Users|Posts"
npm test -- --grep "^API"
```

### Exclude Tests

```bash
npm test -- --grep "Responsive" --invert
```

### By Tag

If tests use `@tag` convention:

```bash
npm test -- --grep "@smoke"
npm test -- --grep "@critical"
```

## Test Configuration

### Custom Timeout

For specific test file:

```bash
npm test -- --timeout 60000  # 60 seconds per test
```

### Retry Failed Tests

```bash
npm test -- --retries 3
```

### Parallel Execution

```bash
npm test -- --workers 4
```

## Environment Configuration

### Set Base URL

```bash
BASE_URL=http://localhost:3000 npm test
BASE_URL=https://goldblum-hello-world.fly.dev npm test
```

### Enable Debugging

```bash
DEBUG=pw:api npm test
DEBUG=pw:* npm test  # All debug info
```

### Custom Configuration

```bash
# Edit playwright.config.ts then:
npm test
```

## CI/CD Execution

### GitHub Actions

Tests run on every push:

```yaml
- name: Run E2E Tests
  run: cd goldblum-test && npm test
  env:
    CI: true
```

### Jenkins

```groovy
stage('E2E Tests') {
  steps {
    sh 'cd goldblum-test && npm install && npm test'
  }
}
```

### GitLab CI

```yaml
e2e_tests:
  script:
    - cd goldblum-test
    - npm install
    - npm test
```

## Troubleshooting

### Tests Fail to Start

Check server is ready:
```bash
curl http://localhost:8080/api/health
```

### Timeout Errors

Increase timeout:
```bash
npm test -- --timeout 60000
```

### Browser Issues

Reinstall browser binaries:
```bash
npx playwright install
npx playwright install --with-deps
```

### Memory Issues

Reduce parallel workers:
```bash
npm test -- --workers 1
```

### Port Already in Use

Find and kill process on port 8080:
```bash
# macOS/Linux
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

## Performance Tips

### Run Tests Faster

1. **Use headed=false** (default):
   ```bash
   npm test  # headless by default
   ```

2. **Reduce workers for stability**:
   ```bash
   npm test -- --workers 2
   ```

3. **Skip trace on success**:
   ```bash
   # Already configured in playwright.config.ts
   ```

4. **Only use needed browsers**:
   ```bash
   npm run test:chromium
   ```

## Test Development

### Generate Test Code

Use Codegen to record interactions:

```bash
npm run codegen
# Browser opens, record your interactions
# Saves test code to stdout
```

### Run Single Failing Test

```bash
# Find test name from report
npm test -- --grep "exact test name"
```

### Create New Test

1. Create file: `tests/feature.spec.ts`
2. Import utilities: `import { test, expect, ... } from './fixtures'`
3. Write tests using fixtures
4. Run: `npm test -- tests/feature.spec.ts`

## Advanced Usage

### Debugging Network Requests

```typescript
// In your test:
page.on('request', request => console.log('>>', request.method(), request.url()));
page.on('response', response => console.log('<<', response.status(), response.url()));
```

### Capturing Video

```bash
npm test -- --headed --video=on
# Videos saved to test-results/
```

### Testing Authentication

```typescript
// Save auth state
await page.context().storageState({ path: 'auth.json' });

// Reuse auth state
const context = await browser.newContext({ storageState: 'auth.json' });
```

### Screenshot on Every Action

```bash
npm test -- --screenshot on
```

## Best Practices

1. **Run smoke tests first**: `npm test -- --grep "Smoke"`
2. **Test locally before CI**: `npm test` locally before pushing
3. **Use headed mode for debugging**: `npm run test:headed`
4. **Check reports after failures**: `npx playwright show-report`
5. **Keep tests independent**: No test should depend on another
6. **Use explicit waits**: Don't rely on sleep/timing

## Next Steps

- Review test results: `npx playwright show-report`
- Debug failures: `npm run test:debug`
- Add new test cases
- Integrate with CI/CD
- Monitor test trends

## Support

For issues:
1. Check `playwright-report/` for details
2. Review test source in `tests/`
3. Check Goldblum logs
4. See Playwright docs: https://playwright.dev
