# Troubleshooting Guide

## Installation Issues

### npm install fails

**Problem**: `npm install` returns permission errors

**Solution**:
```bash
# Try with sudo (macOS/Linux)
sudo npm install

# Or clear npm cache
npm cache clean --force
npm install

# Use different npm prefix
npm install --prefix ~/.npm-global
```

### Playwright download fails

**Problem**: Browser installation fails or times out

**Solution**:
```bash
# Download with retry
npx playwright install --with-deps --force-os linux

# Use offline installation
npm ci  # Uses package-lock.json
npx playwright install
```

### TypeScript compilation errors

**Problem**: Errors like "Cannot find module '@playwright/test'"

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Update TypeScript
npm install --save-dev typescript@latest
```

## Server/Port Issues

### Port 8080 already in use

**Problem**: "listen EADDRINUSE :::8080"

**Solution**:

**macOS/Linux**:
```bash
# Find process using port 8080
lsof -i :8080

# Kill process (replace 12345 with PID)
kill -9 12345

# Or use pkill
pkill -f "lein run"
```

**Windows**:
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill process (replace PID with actual PID)
taskkill /PID 12345 /F
```

### Server doesn't start automatically

**Problem**: Tests timeout waiting for server

**Solution**:
```bash
# Start server manually in separate terminal
cd goldblum
lein run

# Run tests with explicit BASE_URL
cd goldblum-test
BASE_URL=http://localhost:8080 npm test
```

### Can't connect to server

**Problem**: "Failed to connect to localhost:8080"

**Solution**:
```bash
# Verify server is running
curl http://localhost:8080/api/health

# If fails, restart server
# Kill any stray java processes
pkill -f java

# Start fresh
cd goldblum
lein run

# In another terminal
cd goldblum-test
npm test
```

## Test Execution Issues

### Tests timeout

**Problem**: Tests hang or timeout after ~30 seconds

**Symptoms**:
- "Timeout of 30000ms exceeded"
- Test hangs on specific page load
- Never reaches assertions

**Solution**:
```bash
# Check server responsiveness
curl -v http://localhost:8080

# Run with longer timeout
npm test -- --timeout 60000

# Run single test in debug mode
npm run test:debug -- tests/smoke.spec.ts

# Check server logs
# Look for errors or slow responses

# Restart everything
pkill -f java
cd goldblum && lein run  # New terminal
cd goldblum-test && npm test
```

### No tests found

**Problem**: "0 tests found"

**Solution**:
```bash
# Verify test files exist
ls tests/

# Check file extension is .spec.ts
# Valid: my-test.spec.ts
# Invalid: my-test.ts

# Clear playwright cache
npx playwright install

# Verify playwright.config.ts has correct testMatch pattern
# Should be: **/*.spec.ts
```

### Tests run but fail with 404

**Problem**: "HTTP 404 errors on all endpoints"

**Solution**:
```bash
# Verify server is actually running
curl http://localhost:8080/

# Check BASE_URL is correct
echo $BASE_URL
BASE_URL=http://localhost:8080 npm test

# Verify server is listening on correct port
# In goldblum/src/goldblum/core.clj, check (def server)
# Default should be 8080

# Check firewall
# Allow localhost:8080 through firewall
```

### Test passes locally but fails on CI

**Problem**: Tests work on local machine but fail in GitHub Actions

**Solution**:
```bash
# 1. Check environment differences
CI=true npm test

# 2. Replicate CI environment locally
export CI=true
npm install --no-optional
npm test

# 3. Check for hardcoded paths
grep -r "localhost" tests/
# Should use getBaseUrl() instead

# 4. Check timing differences
# Add explicit waits in tests

# 5. Run with more verbose output
npm test -- --verbose

# 6. Check logs
cat .github/workflows/e2e-tests.yml
# Review environment variables
```

### "Browser or context closed"

**Problem**: Test fails with "Browser has been closed"

**Solution**:
```bash
# Usually means server crashed
# Check goldblum logs for errors

# Restart everything
pkill -f java
pkill -f node

cd goldblum && lein run  # New terminal
cd goldblum-test && npm test
```

## Browser Issues

### Playwright browser won't launch

**Problem**: "Failed to launch browser"

**Solution**:
```bash
# Reinstall browsers
npx playwright install

# Install system dependencies
npx playwright install --with-deps

# Use different browser
npm run test:chromium
npm run test:firefox

# Check if browser binary exists
ls ~/.cache/ms-playwright/
```

### "Executable doesn't exist"

**Problem**: Browser binary missing or corrupted

**Solution**:
```bash
# Clean and reinstall
rm -rf ~/.cache/ms-playwright
npx playwright install --with-deps --force

# Or in Windows
rmdir /s %APPDATA%\ms-playwright
npx playwright install --with-deps
```

### Browser crashes during test

**Problem**: Browser exits unexpectedly

**Solution**:
```bash
# 1. Run in headed mode to see what's happening
npm test:headed

# 2. Check for memory issues
npm test -- --workers 1

# 3. Increase timeout
npm test -- --timeout 60000

# 4. Check for page crashes
# Add to test:
page.on('error', err => console.log(err));
```

### Timeouts on specific browser

**Problem**: Firefox passes but Chromium fails

**Solution**:
```bash
# Run specific browser
npm run test:chromium -- --verbose

# Check browser-specific selectors
# Some selectors might be different between browsers

# Review test for timing issues
# Add explicit waits before assertions

# Check browser version
npx playwright --version
```

## Test Flakiness

### Tests pass sometimes, fail other times

**Problem**: Random test failures

**Solution**:
1. **Add explicit waits**:
   ```typescript
   // Bad
   await page.click('button');
   await expect(element).toBeVisible();

   // Good
   await page.click('button');
   await page.waitForLoadState('networkidle');
   await expect(element).toBeVisible();
   ```

2. **Increase waits**:
   ```bash
   npm test -- --timeout 60000
   ```

3. **Reduce parallel workers**:
   ```bash
   npm test -- --workers 1
   ```

4. **Check for race conditions**:
   - Don't assume timing
   - Wait for elements explicitly
   - Use `waitForSelector`, not `sleep`

5. **Isolate flaky test**:
   ```bash
   npm test -- --grep "flaky test name"
   ```

### Random 404 errors

**Problem**: Tests occasionally fail with 404

**Solution**:
```bash
# Check if server crashed
curl http://localhost:8080/api/health

# Add retry logic
npm test -- --retries 2

# Check test doesn't interfere with others
# Run test alone
npm test -- --grep "specific test"

# Verify data consistency
# Tests might be affecting each other
```

## Data Issues

### Tests modify production data

**Problem**: Tests create/delete data on production

**Solution**:
```bash
# Add environment check
test.beforeEach(async ({ page }) => {
  if (!isLocalTest()) {
    test.skip();  // Skip destructive tests
  }
});

# Or use read-only operations on production
# Create → read → delete pattern only on local
```

### Orphaned test data

**Problem**: Test data not cleaned up

**Solution**:
```typescript
// Use test.afterEach to cleanup
test.afterEach(async ({ page }) => {
  await deleteTestUser(page, userId);
  await deleteTestPost(page, postId);
});

// Or handle in fixtures
```

### Data inconsistency

**Problem**: GET returns different data than POST created

**Solution**:
```bash
# Check server logs for errors
# Verify request is being processed

# Add explicit wait
await page.waitForLoadState('networkidle');

# Verify API response
console.log(response.json());
```

## Report Issues

### Report not generated

**Problem**: No `playwright-report/` after tests

**Solution**:
```bash
# Check test actually ran
npm test -- --reporter=verbose

# Generate report explicitly
npm test -- --reporter html

# View report
npx playwright show-report
```

### Report shows no screenshots

**Problem**: Screenshots missing on failure

**Solution**:
```bash
# Verify screenshot config in playwright.config.ts
# Should have: screenshot: 'only-on-failure'

# Force screenshots
npm test -- --screenshot on

# Check playwright-report/ has images/
ls playwright-report/
```

## CI/CD Issues

### GitHub Actions fails but local passes

**Problem**: Tests work locally but fail on GitHub Actions

**Solution**:
1. **Check Node version**:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '18'  # Match local
   ```

2. **Check Java version**:
   ```yaml
   - uses: actions/setup-java@v3
     with:
       distribution: 'temurin'
       java-version: '21'
   ```

3. **Replicate locally**:
   ```bash
   export CI=true
   npm install
   npm test
   ```

4. **Check dependencies**:
   ```bash
   npm ci  # Use package-lock.json
   ```

### Workflow timeout

**Problem**: "The operation was canceled" after 6 hours

**Solution**:
```yaml
jobs:
  test:
    timeout-minutes: 30  # Set explicit timeout
```

### Artifact upload fails

**Problem**: "Failed to upload artifact"

**Solution**:
```yaml
# Check path exists
- uses: actions/upload-artifact@v4
  with:
    path: goldblum-test/playwright-report/  # Must end with /
```

## Performance Issues

### Tests run slowly

**Problem**: Tests take 30+ minutes to run

**Solution**:
```bash
# Reduce workers (fewer parallel tests)
npm test -- --workers 1  # Slower but more reliable

# Run specific browser
npm run test:chromium  # Instead of all browsers

# Skip reporter generation
npm test -- --reporter=null  # No HTML report overhead

# Use better machine
# GitHub Actions runners are slower than local
```

### High memory usage

**Problem**: Node process uses 2GB+ memory

**Solution**:
```bash
# Limit workers
npm test -- --workers 1

# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm test

# Check for memory leaks in test
# Use Chrome DevTools to profile
```

## Help & Support

### Get more debug info

```bash
# Verbose output
npm test -- --verbose

# Debug mode (interactive)
npm run test:debug

# Enable Playwright debug
DEBUG=pw:api npm test

# Full debug
DEBUG=pw:* npm test
```

### Gather diagnostic info

```bash
# System info
node --version
npm --version
npx playwright --version

# Check browser versions
ls ~/.cache/ms-playwright/chromium*/

# Check logs
cat goldblum/logs/*  # If applicable
```

### Check known issues

- Search `.github/workflows/` for similar issues
- Check Playwright repo: https://github.com/microsoft/playwright/issues
- Check Goldblum issues: https://github.com/[repo]/issues

## Still Stuck?

1. **Collect info**:
   ```bash
   npx playwright --version
   node --version
   npm --version
   ```

2. **Enable debugging**:
   ```bash
   DEBUG=pw:* npm test -- --verbose
   ```

3. **Generate report**:
   ```bash
   npx playwright show-report
   ```

4. **Share**:
   - Full error message
   - Test file content
   - Debug output
   - Screenshots/videos from report

5. **Check**: TEST_EXECUTION.md for more advanced usage
