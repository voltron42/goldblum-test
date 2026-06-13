# Goldblum E2E Test Suite - Quick Reference

## 📦 Project Structure

```
goldblum-test/
├── package.json                 # Dependencies and scripts
├── playwright.config.ts         # Test configuration
├── tsconfig.json               # TypeScript config
├── README.md                    # Main documentation
├── TEST_EXECUTION.md           # Detailed execution guide
├── QUICK_REFERENCE.md          # This file
├── .gitignore
├── .github/
│   └── workflows/
│       └── e2e-tests.yml       # GitHub Actions CI/CD
└── tests/
    ├── fixtures.ts             # Reusable utilities & API helpers
    ├── smoke.spec.ts           # Basic page load tests (8 tests)
    ├── api-tester.spec.ts      # API tester component (6 tests)
    ├── users.spec.ts           # User CRUD operations (8 tests)
    ├── posts.spec.ts           # Post CRUD operations (8 tests)
    ├── api.spec.ts             # API endpoints (19 tests)
    ├── responsive.spec.ts      # Mobile/tablet/desktop (13 tests)
    └── performance.spec.ts     # Performance & reliability (10 tests)
```

## 🚀 Quick Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Run tests locally | `npm test` |
| UI mode (watch) | `npm test:ui` |
| Headed browser | `npm test:headed` |
| Against fly.io | `npm run test:fly` |
| Debug mode | `npm run test:debug` |
| Generate tests | `npm run codegen` |
| View report | `npx playwright show-report` |

## 📝 Test Files Overview

### `smoke.spec.ts` (8 tests)
- Page load verification
- Navbar presence
- Server status display
- Main content sections
- Footer accessibility
- Health endpoint
- Swagger documentation
- Environment validation

### `api-tester.spec.ts` (6 tests)
- Component visibility
- HTTP method selection
- Endpoint input
- GET request execution
- POST request handling
- Error display (404)
- Response updates
- Loading state

### `users.spec.ts` (8 tests)
- Component display
- User list rendering
- Add user button
- Form toggle behavior
- User creation via UI
- User deletion via UI
- User detail display
- ID badge rendering
- List persistence
- Empty state handling

### `posts.spec.ts` (8 tests)
- Component display
- Post list rendering
- Add post button
- Form toggle behavior
- Post creation via UI
- Post deletion via UI
- Post detail display
- User ID display
- List persistence
- Empty state handling

### `api.spec.ts` (19 tests)
**Health Endpoint** (2)
- GET /api/health returns 200
- Returns status ok

**Hello Endpoint** (2)
- GET /api/hello returns 200
- Returns message

**Users Endpoints** (7)
- GET /api/users returns array
- POST creates user
- GET /:id returns specific user
- GET /:id returns 404 for missing
- PUT /:id updates user
- DELETE /:id deletes user
- Idempotent operations

**Posts Endpoints** (6)
- GET /api/posts returns array
- POST creates post
- GET /:id returns specific post
- GET /:id returns 404 for missing
- DELETE /:id deletes post
- Idempotent operations

**Swagger** (2)
- GET /swagger.json returns valid spec
- Includes all endpoints

### `responsive.spec.ts` (13 tests)
- **Mobile**: 5 tests for Pixel 5 device
- **Tablet**: 2 tests for iPad Pro device
- **Desktop**: 2 tests for desktop layout
- **Text sizing**: 3 tests for readability
- **Touch**: 2 tests for iPhone 12
- **Orientation**: 2 tests portrait/landscape

### `performance.spec.ts` (10 tests)
- Page load performance
- Layout stability
- CSS efficiency
- Rapid API requests
- Network retry logic
- Request timeouts
- User input response
- Rapid clicks
- Error handling
- Memory management

## 🛠️ Fixtures & Utilities

All utilities in `fixtures.ts`:

```typescript
// Initialization
await waitForApiReady(page);        // Wait for API ready
getBaseUrl();                       // Get configured URL
isLocalTest();                      // Check if local

// Data Creation (auto cleanup)
const user = await createTestUser(page, { name, email });
const post = await createTestPost(page, { userId, title, content });

// Data Retrieval
const users = await getAllUsers(page);
const posts = await getAllPosts(page);

// Data Deletion
await deleteTestUser(page, userId);
await deleteTestPost(page, postId);
```

## 🔧 Configuration

### Environment Variables

```bash
# Test URL (default: http://localhost:8080)
BASE_URL=http://localhost:8080
BASE_URL=https://goldblum-hello-world.fly.dev

# CI environment
CI=true

# Debug
DEBUG=pw:api
```

### Test Filtering

```bash
# By pattern
npm test -- --grep "Users"
npm test -- --grep "POST"

# Invert (exclude)
npm test -- --grep "Responsive" --invert

# By file
npm test -- tests/api.spec.ts
```

## 🐛 Debugging

### Common Issues

| Issue | Solution |
|-------|----------|
| Tests timeout | Check server: `curl http://localhost:8080/api/health` |
| Port in use | Kill process: `lsof -i :8080 \| grep LISTEN \| awk '{print $2}' \| xargs kill -9` |
| Browser fails | Reinstall: `npx playwright install` |
| Flaky tests | Use explicit waits: `await page.waitForLoadState('networkidle')` |

### Debug Techniques

1. **UI Mode** (recommended): `npm test:ui`
2. **Headed**: `npm test:headed`
3. **Debug**: `npm run test:debug`
4. **Screenshots**: Automatic on failure
5. **Traces**: Recorded on first retry
6. **Codegen**: `npm run codegen` to record interactions

## 📊 Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Smoke | 8 | ✅ |
| API Tester | 6 | ✅ |
| Users | 8 | ✅ |
| Posts | 8 | ✅ |
| API Endpoints | 19 | ✅ |
| Responsive | 13 | ✅ |
| Performance | 10 | ✅ |
| **Total** | **72** | **✅** |

## 🔄 CI/CD Workflow

### Automatic Triggers

- **On push to main**: Run local tests + build Docker + check deployment readiness
- **On pull request**: Run local tests
- **Daily schedule** (2 AM UTC): Run tests against production (fly.io)

### Manual Triggers

See `.github/workflows/e2e-tests.yml` for workflow dispatch setup.

## 📋 Test Data

### Sample Data (Auto-created)

**Users**:
- Alice (id: 1, alice@example.com)
- Bob (id: 2, bob@example.com)

**Posts**:
- "Hello World" by Alice (id: 1)
- "Getting Started" by Bob (id: 2)

### Test Data Creation

Tests create their own data via API:
- User creation: `POST /api/users`
- Post creation: `POST /api/posts`
- Auto-cleanup on test completion

## 🎯 Best Practices

✅ **Do:**
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Keep tests independent
- Use explicit waits
- Clean up created data
- Use fixtures for reusable logic

❌ **Don't:**
- Use `sleep()` for timing
- Depend on test execution order
- Create hard-coded selectors
- Skip environment checks
- Leave test data orphaned

## 🚀 Usage Scenarios

### Local Development

```bash
# Start server manually
cd goldblum && lein run

# In another terminal, run tests
cd goldblum-test && npm test:ui
```

### Before Committing

```bash
cd goldblum-test
npm test  # Run locally
```

### Pre-deployment Check

```bash
# Test against staging/prod
npm run test:fly

# Review report
npx playwright show-report
```

### Continuous Integration

```bash
# GitHub Actions automatically runs on every push
# Check Actions tab for results
# Download artifact reports if needed
```

## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [Main README](README.md)
- [Execution Guide](TEST_EXECUTION.md)
- [Goldblum README](../goldblum/README.md)

## 📞 Support

### Getting Help

1. Check this quick reference
2. Read `TEST_EXECUTION.md`
3. Review `README.md`
4. Check Playwright docs
5. Review test source in `tests/`

### Troubleshooting

- Run in debug mode: `npm run test:debug`
- Check report: `npx playwright show-report`
- View traces: `npx playwright show-trace`
- Check browser console: Look in test report screenshots

## 🎓 Learning Path

1. **Start**: Read this file
2. **Run**: `npm test:ui` to see tests in action
3. **Explore**: Review `tests/smoke.spec.ts`
4. **Debug**: Use `npm run test:debug` on specific test
5. **Create**: Add your own test following existing patterns
6. **Deploy**: Run `npm run test:fly` before go-live

---

**Last Updated**: 2024
**Test Suite Version**: 1.0.0
**Coverage**: 72 test cases across 7 test files
