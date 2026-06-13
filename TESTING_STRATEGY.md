# Goldblum Testing Strategy

Complete overview of the Goldblum test suite strategy, architecture, and philosophy.

## Testing Philosophy

The Goldblum test suite follows these principles:

1. **Comprehensive Coverage**: Tests cover all critical user paths and API endpoints
2. **Fast Feedback**: Tests run quickly (< 5 minutes) for rapid development iteration
3. **Reliable**: Tests are deterministic and don't depend on timing or order
4. **Maintainable**: Tests use clear naming and reusable patterns
5. **Environment-Aware**: Tests run against local development and production
6. **Regression Prevention**: Tests catch regressions before deployment

## Test Pyramid

```
        🎭 Performance Tests
       (Reliability, Consistency)
      ╱          ╲
     ╱  E2E Tests ╲    (Responsive, API, UI)
    ╱______________╲
   ╱                ╲
  ╱  Smoke Tests     ╲   (Basic Sanity Checks)
 ╱__________________╲
╱                    ╲
   Unit Tests         (Clojure Backend)
```

### Test Categories

#### 1. Unit Tests (Backend - Clojure)
- **Location**: `goldblum/test/goldblum/`
- **Framework**: clojure.test
- **Coverage**: 
  - API endpoint logic
  - Data validation
  - State management
  - Error handling
- **Speed**: Instant (< 1 second)
- **Run**: `cd goldblum && lein test`

#### 2. Smoke Tests (E2E)
- **Location**: `goldblum-test/tests/smoke.spec.ts`
- **Purpose**: Verify basic application functionality
- **Coverage**:
  - Page loads successfully
  - Navbar is visible
  - Main content sections exist
  - Server status shows
  - Endpoints are accessible
- **Speed**: ~ 30 seconds
- **Critical**: Yes - always run before other tests

#### 3. Component Tests (E2E)
- **Location**: `goldblum-test/tests/{api-tester,users,posts}.spec.ts`
- **Purpose**: Verify UI components work correctly
- **Coverage**:
  - User interactions (clicks, form input)
  - Data display and updates
  - CRUD operations through UI
  - Error states
- **Speed**: ~ 1-2 minutes per suite
- **Parallelizable**: Yes - tests are independent

#### 4. API Tests (E2E)
- **Location**: `goldblum-test/tests/api.spec.ts`
- **Purpose**: Verify all HTTP endpoints work correctly
- **Coverage**:
  - All CRUD endpoints
  - Error responses (404, 400, etc.)
  - Request/response formats
  - Idempotency
- **Speed**: ~ 30 seconds
- **Independent**: Yes - can run standalone

#### 5. Responsive Design Tests (E2E)
- **Location**: `goldblum-test/tests/responsive.spec.ts`
- **Purpose**: Verify UI works on all device sizes
- **Coverage**:
  - Mobile (Pixel 5)
  - Tablet (iPad)
  - Desktop (1920x1080)
  - Touch interactions
  - Text sizing
  - Orientation changes
- **Speed**: ~ 2-3 minutes
- **Browsers**: Mobile devices, tablets, desktops

#### 6. Performance Tests (E2E)
- **Location**: `goldblum-test/tests/performance.spec.ts`
- **Purpose**: Verify application meets performance requirements
- **Coverage**:
  - Page load time (< 10s)
  - Layout stability
  - Rapid requests handling
  - Error recovery
  - Memory management
- **Speed**: ~ 1-2 minutes
- **Critical**: Yes - catch performance regressions

## Test Execution Flow

### Local Development Flow

```
┌─ lein run (Goldblum server)
│  └─ Listens on http://localhost:8080
│
├─ npm test (Playwright tests)
│  ├─ Smoke tests (quick sanity)
│  ├─ API tests (endpoint verification)
│  ├─ Component tests (UI interaction)
│  ├─ Responsive tests (device layouts)
│  └─ Performance tests (load/reliability)
│
└─ HTML Report
   ├─ Screenshots on failure
   ├─ Trace recordings
   └─ Detailed results
```

### CI/CD Flow

```
1. Git push/PR
   ↓
2. GitHub Actions triggered
   ├─ Unit tests (lein test)
   ├─ Docker build
   ├─ E2E tests against local server
   ├─ Upload test artifacts
   └─ Check deployment readiness
   
3. (Optional) Manual deployment
   ├─ flyctl deploy
   ↓
4. Production verification
   ├─ E2E tests against fly.io
   ├─ Upload production test report
   └─ Alert on failures
```

## Test Data Management

### Initial State

Tests start with sample data:
```
Users:
  - Alice (id: 1, alice@example.com)
  - Bob (id: 2, bob@example.com)

Posts:
  - "Hello World" by Alice (id: 1)
  - "Getting Started" by Bob (id: 2)
```

### Data Creation Pattern

Each test follows this pattern:

```
1. Setup
   ├─ Create test data via API
   ├─ Perform action
   └─ Assert result

2. Cleanup
   ├─ Delete created data
   └─ Restore initial state
```

### Environment-Specific Behavior

**Local (localhost)**:
- Create test data freely
- Delete all data for cleanup
- Reset state between tests
- Assume fresh server

**Production (fly.io)**:
- Read-only operations
- Skip destructive tests
- Don't modify shared data
- Verify consistency

## Test Isolation

### Independence Principle

Tests must be:
1. **Runnable in any order** - no dependencies between tests
2. **Runnable in parallel** - multiple tests at once
3. **Runnable standalone** - single test works alone
4. **Idempotent** - same result every run

### Implementation

**Good**:
```typescript
test('should create user', async ({ page }) => {
  const user = await createTestUser(page, { name: 'Test' });
  expect(user.id).toBeTruthy();
  await deleteTestUser(page, user.id);  // Cleanup
});
```

**Bad**:
```typescript
test('should create user', async ({ page }) => {
  // Depends on previous test's data
  const users = await getAllUsers(page);
  expect(users.length).toBe(3);  // Assumes 3 users exist
});
```

## Performance Requirements

### Load Time Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Page load | < 5s | ~2s |
| API response | < 500ms | ~100ms |
| Full E2E suite | < 5 min | ~3 min |

### Performance Testing Strategy

1. **Baseline Measurement**: Track initial performance
2. **Regression Detection**: Alert if performance degrades > 10%
3. **Load Testing**: Verify handling of rapid requests
4. **Resource Monitoring**: Track memory and CPU

## Browser & Device Coverage

### Desktop Browsers
- **Chromium** (Chrome)
- **Firefox**
- **WebKit** (Safari)

### Mobile Devices
- **Pixel 5** (Android)
- **iPhone 12** (iOS)

### Tablets
- **iPad Pro**

### Viewport Sizes
- Mobile: 393x851 (Pixel 5)
- Tablet: 1024x1366 (iPad)
- Desktop: 1920x1080

## Failure Analysis

### When Tests Fail

1. **Smoke tests fail**:
   - Critical issue - stop execution
   - Likely server crash or broken landing page
   - Fix before other tests

2. **API tests fail**:
   - Endpoint broken
   - Response format changed
   - Server issue
   - Check logs immediately

3. **Component tests fail**:
   - UI interaction broken
   - Selector changed
   - Logic error in component
   - May indicate API issue too

4. **Responsive tests fail**:
   - Layout broken on specific device
   - CSS issue
   - Element not visible at viewport size
   - Usually safe to ship if other tests pass

5. **Performance tests fail**:
   - Application slower than expected
   - May be temporary (CI runner busy)
   - Check graph over time for trends
   - Might still be acceptable if < 2x slower

### Investigation Steps

```
1. Run locally
   └─ Reproduce in local environment

2. Check logs
   └─ Look for server errors

3. Run in debug mode
   └─ Step through test execution

4. View traces
   └─ Check full interaction trace

5. Review changes
   └─ What changed since last pass?

6. Run in isolation
   └─ Does test pass alone?

7. Clear cache
   └─ Playwright cache, browser cache
```

## Test Maintenance

### Regular Tasks

- **Weekly**: Run full test suite
- **Before release**: Run against production
- **After API change**: Update affected tests
- **After UI change**: Update selectors
- **Quarterly**: Review and refactor tests

### Adding New Tests

1. **Identify gap**: What's not tested?
2. **Choose category**: Smoke, component, API, responsive, performance?
3. **Follow pattern**: Use existing tests as template
4. **Use fixtures**: Reuse API helpers
5. **Document**: Add comment explaining what/why
6. **Run locally**: Verify test passes
7. **Check CI**: Ensure passes in GitHub Actions

### Removing Tests

1. **Document reason**: Why is this test no longer needed?
2. **Check coverage**: Will removing leave gap?
3. **Verify CI**: Ensure build still passes
4. **Update tracking**: Update test count

### Refactoring Tests

1. **Identify duplication**: What code is repeated?
2. **Extract fixture**: Create reusable helper
3. **Update callers**: Use new fixture
4. **Verify tests still pass**: No behavior change

## CI/CD Integration

### GitHub Actions Workflow

```
Event: push/PR
  ↓
Setup Node + Java
  ↓
Install dependencies
  ↓
Run unit tests (Clojure)
  ↓
Build Docker image
  ↓
Run E2E tests (local)
  ↓
Upload report artifact
  ↓
Optional: Deploy to fly.io
  ↓
Optional: Run production tests
```

### Deployment Prerequisites

- ✅ All unit tests pass
- ✅ All smoke tests pass
- ✅ Docker builds successfully
- ✅ E2E tests pass on local server

### Post-Deployment Verification

- Run tests against fly.io
- Monitor for 24 hours
- Alert if tests fail
- Roll back if critical issue

## Monitoring & Observability

### Test Metrics Tracked

- **Pass rate**: % of tests passing
- **Duration**: How long tests take
- **Flakiness**: Tests that sometimes fail
- **Coverage**: What % of code is tested

### Reporting

- **Local**: HTML report in `playwright-report/`
- **CI**: GitHub Actions artifacts
- **Trending**: Track metrics over time
- **Alerting**: Fail notifications

## Best Practices Summary

✅ **Do**:
- Run tests before committing
- Use descriptive test names
- Keep tests independent
- Use fixtures for reusable code
- Wait explicitly, not with sleep
- Clean up test data
- Run full suite before CI push

❌ **Don't**:
- Depend on test execution order
- Use hardcoded paths or URLs
- Sleep for timing
- Skip tests (use conditional logic)
- Modify production data in tests
- Create flaky timing-dependent tests
- Ignore test failures

## Test Statistics

### Coverage Breakdown

| Category | Tests | Coverage | Time |
|----------|-------|----------|------|
| Smoke | 8 | Basic functionality | 30s |
| API Tester | 6 | Component interaction | 30s |
| Users | 8 | CRUD operations | 30s |
| Posts | 8 | CRUD operations | 30s |
| API | 19 | All endpoints | 30s |
| Responsive | 13 | Device layouts | 90s |
| Performance | 10 | Load/reliability | 60s |
| **Total** | **72** | **Comprehensive** | **~5 min** |

### Code Coverage

- **Backend API**: ~95% (all endpoints tested)
- **Frontend Components**: ~85% (main paths)
- **Error Paths**: ~70% (most errors covered)

## Future Improvements

### Planned Enhancements

1. **Visual regression testing**: Screenshot comparison
2. **Accessibility testing**: WCAG compliance
3. **Load testing**: Concurrent users simulation
4. **Security testing**: XSS, CSRF vulnerability checks
5. **Chaos testing**: Failure scenario handling

### Optimization Opportunities

1. **Faster execution**: Parallel test scheduling
2. **Better flakiness detection**: Automatic retry with analysis
3. **Improved reporting**: Custom dashboard
4. **Test data optimization**: Smarter setup/teardown
5. **Mobile-specific tests**: More touch interaction coverage

## Related Documentation

- [README.md](README.md) - Overview and setup
- [TEST_EXECUTION.md](TEST_EXECUTION.md) - Execution commands
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Issue solutions
- [Goldblum API Docs](../goldblum/README.md) - Backend documentation

## Conclusion

The Goldblum test suite provides comprehensive regression testing across unit tests, E2E tests, and performance monitoring. By following the testing pyramid, maintaining test independence, and using reusable fixtures, we ensure fast, reliable test execution that prevents bugs from reaching production.

Regular execution of this test suite ensures high code quality and confidence in deployments.
